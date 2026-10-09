import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * An object conjured for as long as an effect lasts.
 *
 * *Creation*: "You conjure a temporary object from magical energy … It is obviously temporarily conjured, and thus
 * can't be sold or passed off as a genuine item." An effect with `conjures: { flag }` puts an item in its holder's
 * inventory, named for what the caster asked for as the spell was cast (`castChoice`), worth nothing and marked as
 * conjured. When the effect ends, however it ends, the item goes with it. Active GM only.
 */

const FLAG = "conjuredBy";

/** The item a conjuring puts in hand: named, light, worthless, and marked with the effect it belongs to. */
export function conjuredSource(name, effectUuid) {
    return {
        type: "equipment",
        name: String(name || "").trim() || t("Conjure.Object"),
        img: "icons/magic/symbols/runes-star-pentagon-blue.webp",
        system: {
            bulk: { value: 1 },
            price: { value: {} },
            description: { value: `<p>${t("Conjure.Description")}</p>` },
            equipped: { carryType: "held", handsHeld: 1 },
        },
        flags: { [LIB_ID]: { [FLAG]: effectUuid } },
    };
}

export const Conjure = {
    async make(effect, name) {
        if (!effect?.actor) return null;
        const [created] = await effect.actor.createEmbeddedDocuments("Item", [conjuredSource(name, effect.uuid)]);
        return created ?? null;
    },

    registerHooks() {
        Hooks.on("deleteItem", async (item) => {
            if (game.users?.activeGM?.id !== game.user?.id || item.type !== "effect" || !item.actor) return;
            const ids = item.actor.items.filter((owned) => owned.flags?.[LIB_ID]?.[FLAG] === item.uuid).map((owned) => owned.id);
            if (ids.length > 0) await item.actor.deleteEmbeddedDocuments("Item", ids).catch(() => null);
        });
    },
};
