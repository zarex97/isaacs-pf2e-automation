import { CastPipeline } from "../cast-pipeline.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * An object that will not be used to watch.
 *
 * *Blind Eye*: "You enchant a single object, preventing it from being used for magical observation. If you cast this
 * spell on a non-magical item used to cast scrying spells, such as a spell component pouch or a spell focus, the item
 * can't be used to cast the spell. If you cast blind eye on a magical item that can be activated to scry …, the item
 * can't be activated for scrying effects. Magical items that are twice blind eye's spell rank or more aren't blocked
 * this way." An effect on the object's holder carries `blindEye: { itemId, rank }`, the item named as it was cast.
 * A spell with the scrying trait is refused to a caster whose every pouch, focus or spellbook is blinded; a magical
 * item with the scrying trait posts no card while blinded, unless its level is twice the rank or more.
 */

const FLAG = "blindEye";

/** The items this actor's effects have blinded, with the rank of each. */
export function blinded(actor) {
    return (actor?.itemTypes?.effect ?? []).map((e) => e.flags?.[LIB_ID]?.[FLAG]).filter((spec) => spec?.itemId);
}

/** Is this a non-magical tool a spell is cast with? */
export function castingTool(item) {
    const traits = item?.system?.traits?.value ?? [];
    // A thing in the inventory: an action called *Refocus* is no focus.
    const physical = typeof item?.isOfType === "function" ? item.isOfType("physical") : ["equipment", "weapon", "armor", "consumable", "treasure", "backpack", "shield", "book"].includes(item?.type);
    return physical && !traits.includes("magical") && /pouch|focus|spellbook|component/i.test(`${item?.slug ?? ""} ${item?.name ?? ""}`);
}

/** Does blind eye stop this magical item scrying? Not when its level is twice the rank or more. */
export function stopsScrying(item, rank) {
    const traits = item?.system?.traits?.value ?? [];
    return traits.includes("scrying") && (Number(item?.level ?? item?.system?.level?.value) || 0) < 2 * (Number(rank) || 1);
}

export const BlindEye = {
    register() {
        CastPipeline.before("a scrying spell with no tool to cast it", 13, (spell) => {
            if (!(spell?.system?.traits?.value ?? []).includes("scrying")) return true;
            const actor = spell.actor;
            const blind = new Set(blinded(actor).map((spec) => spec.itemId));
            const tools = (actor?.items ?? []).filter(castingTool);
            if (tools.length === 0 || tools.some((tool) => !blind.has(tool.id))) return true;
            ui.notifications.warn(t("BlindEye.NoTool", { name: spell.name }));
            return false;
        });
        Hooks.on("preCreateChatMessage", (message, _data, _options, userId) => {
            if (userId !== game.user?.id) return true;
            const item = message.item;
            const spec = blinded(item?.actor).find((s) => s.itemId === item?.id);
            if (!spec || !stopsScrying(item, spec.rank) || message.rolls?.length) return true;
            ui.notifications.warn(t("BlindEye.NoScrying", { name: item.name }));
            return false;
        });
    },
};
