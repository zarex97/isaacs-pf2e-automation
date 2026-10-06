import { bonusStepsFrom, stepsFor } from "../../automation.mjs";
import { LIB_ID } from "../id.mjs";
import { escapeDcFor } from "./escape.mjs";

export const FLAG = "encasement";

/**
 * Wrapping a creature in something that has to be broken to get them out.
 *
 * Koliço's rings and Freezing Coffin's ice are the same shape at two different scales: a shell with
 * Hardness and Hit Points, worn by the creature it holds, that clears the conditions it caused the moment
 * it is destroyed. Both were whispers — "the rings have Hardness 8, HP 30, and shatter if destroyed" is a
 * sentence describing an object that never existed anywhere Foundry could find it, so nothing could ever
 * attack it and nothing ever shattered.
 *
 * Modelled as a hazard, the same choice Aries' Crystal Wall makes for the same reason: making it a real
 * actor is what lets it be attacked with the system's own rules, rolled into initiative if the table wants
 * that, and reduced to 0 Hit Points by anyone without a line of module code watching for it.
 *
 * The Escape half is a separate problem. Neither `immobilized` nor `petrified` carries a native Escape
 * action — only `grabbed` and `restrained` do — and the guide states an Escape DC anyway, because *this*
 * escape is against the shell, not against a grip. A custom action is granted to the captive naming the DC
 * and the hazard's own id, so a critical success against a stale reference is impossible even if two
 * encasements were ever active on the same table at once.
 */
export const Encasement = {
    async apply(rider, context) {
        const spec = rider.apply;
        const target = context.actor;
        const token = context.target;
        if (!target || !token || !canvas?.ready) return;
        if (game.users.activeGM?.id !== game.user.id) return; // only a GM may write scene geometry

        // "The rings gain +2 Hardness and +10 Hit Points" per heightening step, the same growth outside
        // `system.damage` that a rider apply type deals with everywhere else in this module: nothing but
        // this call site knows the shell exists, so nothing else would ever scale it.
        const steps = spec.hardnessPerStep || spec.hpPerStep
            ? stepsFor({
                  baseRank: context.item?.baseRank ?? context.item?.system?.level?.value,
                  castRank: context.item?.rank,
                  bonusSteps: bonusStepsFrom(context.originActor?.getRollOptions?.() ?? []),
              })
            : 0;
        const grown = {
            ...spec,
            hardness: (Number(spec.hardness) || 0) + (Number(spec.hardnessPerStep) || 0) * steps,
            hp: (Number(spec.hp) || 0) + (Number(spec.hpPerStep) || 0) * steps,
        };

        const hazard = await createHazard(grown, target, token);
        if (!hazard) return;

        const conditions = [spec.conditions].flat().filter(Boolean);
        for (const slug of conditions) {
            const value = Number(spec.value) || undefined;
            await target.increaseCondition(slug, value ? { value } : {});
        }

        if (spec.escapeDc) {
            await target.createEmbeddedDocuments("Item", [escapeAction(spec, hazard, context)]);
        }

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: context.originActor }),
            flavor: context.item?.name ?? spec.name ?? "Encasement",
            content: `<p><strong>${target.name}</strong> is encased in ${spec.name ?? "ice"} — `
                + `Hardness ${hazard.hardness}, ${hazard.hitPoints.max} Hit Points.</p>`,
        });
    },

    /** Break the shell — by damage reaching 0, by the escape check, or by a GM's own hand. */
    async destroy(hazard, { freed = true } = {}) {
        const spec = hazard?.flags?.[LIB_ID]?.[FLAG];
        if (!spec) return;

        for (const token of hazard.getActiveTokens(true, true) ?? []) {
            if (token.parent?.tokens.has(token.id)) await token.parent.deleteEmbeddedDocuments("Token", [token.id]);
        }
        if (hazard.id && game.actors.has(hazard.id)) await hazard.delete();
        if (!freed || !spec.targetUuid) return;

        const target = (await fromUuid(spec.targetUuid))?.actor ?? (await fromUuid(spec.targetUuid));
        if (!target) return;

        for (const slug of [spec.conditions].flat().filter(Boolean)) {
            if (target.hasCondition(slug)) await target.decreaseCondition(slug, { forceRemove: true });
        }
        const escape = target.items.find((i) => i.flags?.[LIB_ID]?.[FLAG]?.hazardUuid === hazard.uuid);
        if (escape) await escape.delete();

        await ChatMessage.create({
            content: `<p><strong>${target.name}</strong> breaks free of ${spec.name ?? "the encasement"}.</p>`,
        });
    },

    /** An encased creature reduced to 0 Hit Points is a creature no longer encased. */
    registerHooks() {
        Hooks.on("updateActor", async (actor) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            if (!actor.flags?.[LIB_ID]?.[FLAG]) return;
            if ((actor.hitPoints?.value ?? 1) > 0) return;
            await Encasement.destroy(actor);
        });
    },
};

async function createHazard(spec, target, token) {
    const level = spec.level ?? target.level ?? 1;
    const hardness = Number(spec.hardness) || 0;
    const hp = Number(spec.hp) || 1;

    try {
        const hazard = await Actor.create(
            {
                name: `${spec.name ?? "Encasement"} (${target.name})`,
                type: "hazard",
                img: spec.img ?? "icons/svg/ice-aura.svg",
                system: {
                    attributes: { ac: { value: Number(spec.ac) || 10 }, hardness, hp: { value: hp, max: hp } },
                    details: { level: { value: level }, isComplex: false },
                    traits: { value: ["cold"], rarity: "common" },
                },
                flags: {
                    [LIB_ID]: {
                        [FLAG]: {
                            name: spec.name ?? null,
                            targetUuid: target.uuid,
                            conditions: spec.conditions ?? [],
                        },
                    },
                },
            },
            { renderSheet: false },
        );
        if (!hazard) return null;

        const size = Math.max(1, token.width ?? 1);
        const tokenDoc = await hazard.getTokenDocument({
            x: token._source.x,
            y: token._source.y,
            width: size,
            height: size,
            actorLink: true,
            name: spec.name ?? "Encasement",
        });
        await canvas.scene.createEmbeddedDocuments("Token", [tokenDoc.toObject()]);
        return hazard;
    } catch (error) {
        console.error("Isaac's Homebrew | could not raise an encasement", error);
        return null;
    }
}

/**
 * Athletics is not written in the guide — none of the two Techniques that state an Escape DC says which
 * skill answers it — and is chosen here as the nearest reading of "breaking physically free of a shell"; a
 * table that would rather call for Acrobatics can say so and the check still lands on the same DC. Routed
 * through the ordinary `action-used` pipeline, like every other granted action in the content: using it
 * posts a card, and the rider on it is what actually rolls the check.
 */
function escapeAction(spec, hazard, context) {
    const dc = escapeDcFor(spec.escapeDc, context);
    return {
        type: "action",
        name: `Escape ${spec.name ?? "the Encasement"}`,
        img: hazard.img,
        system: {
            actionType: { value: "action" },
            actions: { value: 1 },
            description: {
                value: `<p>Attempt an Athletics check against DC ${dc} to break free of `
                    + `@UUID[${hazard.uuid}]{${hazard.name}}. Destroying it does the same.</p>`,
            },
            traits: { value: ["escape"], rarity: "common" },
            category: "defensive",
        },
        flags: {
            [LIB_ID]: {
                [FLAG]: { hazardUuid: hazard.uuid },
                riders: [
                    {
                        apply: { type: "escape", statistic: "athletics", dc, hazardUuid: hazard.uuid },
                        event: "action-used",
                        self: true,
                    },
                ],
            },
        },
    };
}
