/**
 * A feat or action with no uses left cannot be used (#123).
 *
 * pf2e counts a frequency and never enforces it: `createUseActionMessage` lowers `frequency.value` and posts
 * the card, and at zero it posts the card anyway. Every rider on that card then fires — driven: a second
 * *Sentence Passed* at 0 rolled the target's Will save again.
 *
 * The card of a use pf2e just counted and the card of a use it could not count both arrive with the value at
 * 0, so the difference is recorded when it happens: a `preUpdateItem` that lowers the value marks the item,
 * and the card that follows it on the same client is let through once. A card at 0 with no such mark is
 * refused before it is created, so nothing downstream — riders, buttons, the module's own handlers — sees it.
 *
 * Only use cards are gated: a message carrying a check context (the save a spell asks for, an attack) is not
 * a use, and a spell's frequency is `economy/spell-frequency.mjs`'s.
 */

/** The item uuid of each use pf2e just counted, with when. */
const counted = new Map();
const WINDOW_MS = 10_000;

/** Items whose uses the module counts itself, on its own clock — their pf2e frequency is a label. */
const OWN_COUNTERS = new Set(["unmake-the-moment", "rewrite-the-ending"]);

/** Whether a card for this item may be posted. Pure, given the item's frequency and whether a use was just counted. */
export function mayPost({ type, slug, frequency, justCounted }) {
    if (!["feat", "action"].includes(type) || OWN_COUNTERS.has(slug)) return true;
    if (!frequency || typeof frequency.value !== "number") return true;
    return frequency.value > 0 || Boolean(justCounted);
}

function describe(frequency) {
    const per = String(frequency?.per ?? "");
    const words = { turn: "per turn", round: "per round", PT1M: "per minute", PT10M: "per 10 minutes", PT1H: "per hour", PT24H: "per day", day: "per day", P1W: "per week", P1M: "per month" };
    return words[per] ?? per;
}

export const FrequencyGuard = {
    registerHooks() {
        Hooks.on("preUpdateItem", (item, change) => {
            const next = foundry.utils.getProperty(change, "system.frequency.value");
            const now = item.system?.frequency?.value;
            if (typeof next === "number" && typeof now === "number" && next < now) counted.set(item.uuid, Date.now());
        });
        Hooks.on("preCreateChatMessage", (_message, data) => FrequencyGuard.gate(data));
    },

    gate(data) {
        const uuid = data?.flags?.pf2e?.origin?.uuid;
        if (!uuid || data?.flags?.pf2e?.context) return undefined;
        const item = fromUuidSync(uuid);
        if (!item?.actor) return undefined;
        const at = counted.get(item.uuid);
        const justCounted = typeof at === "number" && Date.now() - at < WINDOW_MS;
        if (justCounted) counted.delete(item.uuid);
        const frequency = item.system?.frequency;
        if (mayPost({ type: item.type, slug: item.slug ?? item.system?.slug, frequency, justCounted })) return undefined;
        ui.notifications.warn(`${item.name}: no uses left (${frequency.max ?? 1} ${describe(frequency)}).`);
        return false;
    },
};
