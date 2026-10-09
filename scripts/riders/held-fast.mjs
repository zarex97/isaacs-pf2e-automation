import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A weapon its wielder cannot let go of.
 *
 * *Metal Merged*: "For the duration of this spell, you can't drop your weapon". An effect carries `heldFast: { items }`,
 * the weapons in hand when it was made (`apply.mjs`). While it lasts, a change that takes one of them out of the
 * hand — dropped, worn, stowed — or deletes it is refused, on the client that tried, with a word why.
 */

const FLAG = "heldFast";

/** The ids of the items this creature's effects hold fast. */
export function heldFastIds(actor) {
    return new Set((actor?.itemTypes?.effect ?? []).flatMap((effect) => effect.flags?.[LIB_ID]?.[FLAG]?.items ?? []));
}

/** Does this update take a held item out of the hand? */
export function letsGo(changes) {
    const get = (path) => changes?.[path] ?? path.split(".").reduce((at, key) => at?.[key], changes);
    const carryType = get("system.equipped.carryType");
    const hands = get("system.equipped.handsHeld");
    return (carryType !== undefined && carryType !== "held") || hands === 0;
}

export const HeldFast = {
    registerHooks() {
        const refuse = (item, userId) => {
            if (userId !== game.user?.id || !item?.actor || !heldFastIds(item.actor).has(item.id)) return true;
            ui.notifications.warn(t("HeldFast.Refused", { item: item.name, actor: item.actor.name }));
            return false;
        };
        Hooks.on("preUpdateItem", (item, changes, _options, userId) => (letsGo(changes) ? refuse(item, userId) : true));
        Hooks.on("preDeleteItem", (item, _options, userId) => refuse(item, userId));
    },
};
