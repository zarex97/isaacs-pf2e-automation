import { Relay } from "../riders/relay.mjs";
import { LIB_ID } from "../id.mjs";
import { catchTokens } from "../../automation.mjs";

export const FLAG = "overlap";

/**
 * What being caught by two areas at once is worth.
 *
 * *Lightning Crown* puts three pillars on the board and says: *"a creature caught by two or more rolls once
 * and takes damage once, but suffers a −2 circumstance penalty to that save."* The first half was already
 * true — `collect` in `index.mjs` merges the placements so a creature standing in two of them is one target
 * — and the second half was the part nobody could act on, because by the time the save is rolled the areas
 * have been discarded and nothing remembers how many caught it.
 *
 * So it is counted here, while the placements still exist, and written onto the creature as an effect that
 * lasts a round. The penalty is predicated on the Technique that caused it, so a creature standing in three
 * pillars is not also worse at dodging everything else that happens this round.
 *
 * The counting runs on the caster's client, because that is where the placements are; the writing runs on
 * the GM's, because a player cannot put an effect on a monster. That is the same split every rider uses,
 * so it goes through the same relay.
 */
export const Overlap = {
    /** The GM applies an overlap's penalty; a player's client asks it to through the relay. */
    registerRelay() {
        Relay.register("applyOverlap", applyOverlap);
    },

    async apply(config, regions, originToken) {
        const spec = config.item?.flags?.[LIB_ID]?.[FLAG];
        const placed = [regions].flat().filter((region) => region);
        if (!spec || placed.length < 2) return;

        const counts = new Map();
        for (const region of placed) {
            for (const entry of catchTokens(region, config, originToken).caught) {
                const uuid = entry.token.document.uuid;
                counts.set(uuid, (counts.get(uuid) ?? 0) + 1);
            }
        }

        const threshold = Number(spec.from) || 2;
        const overlapped = [...counts.entries()]
            .filter(([, count]) => count >= threshold)
            .map(([targetUuid, count]) => ({ targetUuid, count }));
        if (overlapped.length === 0) return;

        await Relay.request({
            action: "applyOverlap",
            event: "overlap",
            itemUuid: config.item.uuid ?? null,
            originUuid: config.item.actor?.uuid ?? null,
            overlapped,
        });
    },
};

/**
 * Write the penalty onto whoever the pillars caught twice. GM side.
 *
 * Built inline rather than pulled from a pack because there is nothing in it that is not already on the
 * flag: a selector, a value and the name of the Technique. An authored effect would be a fourth place to
 * keep the number `-2` in step with the guide.
 */
export async function applyOverlap(payload) {
    const item = payload.itemUuid ? await fromUuid(payload.itemUuid) : null;
    const spec = item?.flags?.[LIB_ID]?.[FLAG];
    if (!spec) return;

    for (const { targetUuid, count } of payload.overlapped ?? []) {
        const token = await fromUuid(targetUuid);
        const actor = token?.actor;
        if (!actor) continue;

        // Replace rather than stack: re-aiming and re-casting in the same round should leave the creature
        // with the penalty it has now, not with two of them.
        const stale = actor.itemTypes.effect.filter((effect) => effect.flags?.[LIB_ID]?.[FLAG]);
        if (stale.length > 0) await actor.deleteEmbeddedDocuments("Item", stale.map((effect) => effect.id));

        await actor.createEmbeddedDocuments("Item", [
            {
                type: "effect",
                name: `${item.name}: caught by ${count}`,
                img: item.img,
                system: {
                    description: {
                        value: `<p>Caught by ${count} placements of @UUID[${item.uuid}]{${item.name}} — `
                            + `${spec.value ?? -2} circumstance to the save it forces.</p>`,
                    },
                    duration: { expiry: "turn-start", sustained: false, unit: "rounds", value: 1 },
                    level: { value: item.level ?? item.system?.level?.value ?? 1 },
                    start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                    tokenIcon: { show: true },
                    traits: { value: [], rarity: "common" },
                    rules: [
                        {
                            key: "FlatModifier",
                            label: item.name,
                            selector: spec.selector ?? "reflex",
                            type: "circumstance",
                            value: Number(spec.value) || -2,
                            predicate: spec.predicate ?? [`item:slug:${item.slug}`],
                        },
                    ],
                },
                flags: { [LIB_ID]: { [FLAG]: { count, source: item.uuid } } },
            },
        ]);
    }
}
