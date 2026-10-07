import { t } from "../i18n.mjs";
import { testPredicate, riderOptions } from "../lib/roll-options.mjs";

/**
 * What a cast does once every creature it reached has had its result.
 *
 * *Massacre*: "If massacre doesn't kill even a single creature, the void energy hungrily turns backward toward you,
 * dealing an additional 30 void damage to every living creature in the line (even those above 17th level) and 30
 * void damage to you." Whether anybody died is known only once the last save is in — and the saves are rolled by
 * each creature, at its own pace. So the cast leaves a tally: `aftermath` (on the cast, `self: true`) records the
 * creatures it reached and those of them that must answer (`awaits`, a predicate on each); `aftermath-mark`, the
 * last of each answering creature's riders, ticks it off and says whether it died. When none is left to answer, the
 * tally is read: with nobody dead, `none` riders land on every reached creature `noneTo` admits, and `noneSelf` on
 * the caster.
 *
 * The tally lives on the active GM's client, where every rider runs: a GM who reloads mid-cast loses it, and the
 * backlash is then the table's to apply.
 */

const tallies = new Map();

/** The key a cast's tally is kept under: its caster and its spell. */
function keyOf(context) {
    const item = context.castItem ?? context.item;
    const spell = (item?.original ?? item)?.uuid ?? item?.name;
    return `${context.originActor?.uuid}:${spell}`;
}

/** Is this tally done, and did anybody die? Pure. */
export function tallyState(tally) {
    if (!tally) return { done: false, died: false };
    return { done: tally.awaiting.size === 0, died: tally.died.size > 0 };
}

export const Aftermath = {
    /** The cast: who it reached, and who must answer. */
    async open(rider, context, { castItem }) {
        const reached = (context.targets ?? []).filter((token) => token?.actor);
        const awaits = rider.apply.awaits ?? [];
        const awaiting = reached.filter((token) => testPredicate(awaits, riderOptions({ originActor: context.originActor, targetActor: token.actor, item: castItem })));
        const key = keyOf({ ...context, castItem });
        const tally = { rider, context: { ...context, castItem }, reached, awaiting: new Set(awaiting.map((tk) => tk.uuid)), died: new Set() };
        tallies.set(key, tally);
        if (tally.awaiting.size === 0) await Aftermath.close(key);
    },

    /** One creature's result is in. */
    async mark(_rider, context, { castItem }) {
        const key = keyOf({ ...context, castItem });
        const tally = tallies.get(key);
        const token = context.target?.document ?? context.target;
        if (!tally || !token?.uuid || !tally.awaiting.has(token.uuid)) return;
        tally.awaiting.delete(token.uuid);
        const actor = context.actor;
        if (actor?.statuses?.has?.("dead") || (actor?.hitPoints?.value ?? 1) <= 0) tally.died.add(token.uuid);
        if (tally.awaiting.size === 0) await Aftermath.close(key);
    },

    /** Every result is in: with nobody dead, the backlash. */
    async close(key) {
        const tally = tallies.get(key);
        tallies.delete(key);
        if (!tally || tallyState(tally).died) return;
        const { applyRiderList } = await import("./apply.mjs");
        const spec = tally.rider.apply;
        const base = tally.context;
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: base.originActor }),
            flavor: base.castItem?.name ?? "",
            content: `<p>${t("Aftermath.NoneDied", { name: base.castItem?.name ?? "" })}</p>`,
        });
        for (const token of tally.reached) {
            const options = riderOptions({ originActor: base.originActor, targetActor: token.actor, item: base.castItem });
            if (!testPredicate(spec.noneTo ?? [], options)) continue;
            await applyRiderList(spec.none ?? [], { ...base, actor: token.actor, target: token, outcome: null });
        }
        const own = base.originToken ?? base.originActor?.getActiveTokens?.(true, true)?.[0] ?? null;
        await applyRiderList(spec.noneSelf ?? [], { ...base, actor: base.originActor, target: own, outcome: null });
    },
};
