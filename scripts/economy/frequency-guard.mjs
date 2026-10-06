import { t } from "../i18n.mjs";

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

/**
 * Slugs whose uses another module counts itself, on its own clock — their pf2e frequency is only a label,
 * and refusing at its zero would refuse a use that module still allows. Added with `FrequencyGuard.exempt`.
 */
const exempted = new Set();

/** Whether a card for this item may be posted. Pure, given the item's frequency and whether a use was just counted. */
export function mayPost({ type, slug, frequency, justCounted, exempt = exempted }) {
    if (!["feat", "action"].includes(type) || exempt.has(slug)) return true;
    if (!frequency || typeof frequency.value !== "number") return true;
    return frequency.value > 0 || Boolean(justCounted);
}

function describe(frequency) {
    const per = String(frequency?.per ?? "");
    const known = ["turn", "round", "PT1M", "PT10M", "PT1H", "PT24H", "day", "P1W", "P1M"];
    return known.includes(per) ? t(`Frequency.Per.${per}`) : per;
}

export const FrequencyGuard = {
    /** Leave this slug's use cards alone: its uses are counted by whoever registered it. */
    exempt(slug) {
        if (typeof slug !== "string" || !slug) throw new Error("Isaac's PF2e Automation | an exempt slug must be a string.");
        exempted.add(slug);
    },

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
        ui.notifications.warn(t("Frequency.NoUses", { name: item.name, max: frequency.max ?? 1, rule: describe(frequency) }));
        return false;
    },
};
