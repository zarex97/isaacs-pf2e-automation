import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A curse carried for someone else.
 *
 * *Claim Curse*: "Choose a curse affecting the target that you don't already have. For 5 minutes, you're affected by the
 * curse (at the same stage as the target …), and the target isn't. If the curse's duration ends before claim curse
 * would, it ends as normal; otherwise, when the spell's duration ends the curse's effects return to the target as
 * normal." `{ type: "claim-curse", flag, minutes }` takes the curse the cast named — an effect with the curse trait on the
 * target, one the caster has none of by that name — off the target and onto the caster, as it is, its clock still
 * running, for `minutes` or what the curse has left, whichever is less. When that copy ends, the curse goes back to the
 * target, unless its own time ran out meanwhile. Active GM only.
 */

const FLAG = "claimedCurse";
const UNIT = { rounds: 6, minutes: 60, hours: 3600, days: 86400 };

/** When an effect ends, in world seconds; Infinity for one with no end. */
export function endsAt(effect) {
    const d = effect?.system?.duration ?? {};
    const seconds = (Number(d.value) || 0) * (UNIT[d.unit] ?? 0);
    return seconds > 0 ? (Number(effect.system?.start?.value) || 0) + seconds : Infinity;
}

export async function claimCurse(rider, context, chosen = {}) {
    const caster = context.originActor;
    const target = context.actor;
    if (!caster || !target) return;
    const named = String(chosen[rider.apply.flag ?? "curse"] ?? "").trim().toLowerCase();
    const curses = target.itemTypes.effect.filter((e) => (e.system?.traits?.value ?? []).includes("curse"));
    const curse = curses.find((e) => !named || e.name.toLowerCase() === named);
    if (!curse || caster.itemTypes.effect.some((e) => e.name === curse.name)) return context.notes.push(t("Curse.None", { name: target.name }));
    const now = game.time.worldTime;
    const until = Math.min(now + (Number(rider.apply.minutes) || 5) * 60, endsAt(curse));
    const source = curse.toObject();
    delete source._id;
    source.system.duration = { value: Math.max(1, Math.round((until - now) / 6)), unit: "rounds", expiry: "turn-end", sustained: false };
    source.system.start = { value: now, initiative: null };
    // "At the same stage as the target, and it can't be changed": the copy keeps its stage, and none of its saves.
    source.flags = foundry.utils.mergeObject(source.flags ?? {}, { [LIB_ID]: { [FLAG]: { from: target.uuid, source: curse.toObject(), endsAt: Number.isFinite(endsAt(curse)) ? endsAt(curse) : null }, riders: [] } });
    await caster.createEmbeddedDocuments("Item", [source]);
    await curse.delete();
    context.notes.push(t("Curse.Claimed", { curse: curse.name, from: target.name, actor: caster.name }));
}

export const Curse = {
    registerHooks() {
        Hooks.on("deleteItem", async (item) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const spec = item.flags?.[LIB_ID]?.[FLAG];
            if (!spec) return;
            const target = fromUuidSync(spec.from);
            if (!target) return;
            // A curse with no end is kept as `null`: Infinity does not survive being stored.
            if (spec.endsAt !== null && game.time.worldTime >= spec.endsAt) {
                await ChatMessage.create({ content: `<p>${t("Curse.Ended", { curse: item.name })}</p>` });
                return;
            }
            const back = { ...spec.source };
            delete back._id;
            await target.createEmbeddedDocuments("Item", [back]);
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: target }), content: `<p>${t("Curse.Back", { curse: item.name, name: target.name })}</p>` });
        });
    },
};
