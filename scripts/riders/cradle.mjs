import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { playersOf } from "./message.mjs";

/**
 * A held thing left floating.
 *
 * *Cradle Aloft*: "You temporarily release gravity's hold on an object, allowing you to let go of it without dropping
 * it to the floor. The object floats next to you in your space, following you if you move. You can Interact to retrieve
 * the object on your turn as a free action. If you're within reach of another creature, that creature can spend a single
 * action with the attack trait to attempt an Athletics check against your spell DC, retrieving the object out of the air
 * on a success. The creature must have a free hand to attempt this check. The spell ends if a creature successfully
 * retrieves the object. If the object is floating when the spell ends, it falls."
 *
 * `{ type: "cradle", flag }` lets go of the held item the cast named (2 Bulk or less) — worn, so the hands are free —
 * and gives the caster an effect for the minute with a free action to take it back. A card lets a creature in reach,
 * with a hand free, try to snatch it: Athletics against the spell DC, the item theirs on a success, and the spell over.
 * The effect ending with the item still afloat drops it.
 */

const FLAG = "cradle";

/** Has a creature a hand free: fewer than two hands' worth of held things? */
export function handFree(items) {
    const used = items.filter((item) => item.system?.equipped?.carryType === "held").reduce((sum, item) => sum + (Number(item.system.equipped.handsHeld) || 0), 0);
    return used < 2;
}

export async function cradleAloft(rider, context, chosen = {}, { dc = null } = {}) {
    const caster = context.originActor;
    const named = String(chosen[rider.apply.flag ?? "item"] ?? "").trim().toLowerCase();
    const item = caster?.items?.find((i) => i.name.toLowerCase() === named && i.system?.equipped?.carryType === "held");
    if (!item || (Number(item.system?.bulk?.value) || 0) > 2) {
        context.notes.push(t("Cradle.Nothing", { item: named }));
        return;
    }
    await item.update({ "system.equipped.carryType": "worn", "system.equipped.handsHeld": 0, [`flags.${LIB_ID}.${FLAG}`]: { floating: true } });
    const [effect] = await caster.createEmbeddedDocuments("Item", [{
        type: "effect",
        name: `${context.item?.name ?? ""}: ${item.name}`,
        img: item.img,
        system: { duration: { value: 1, unit: "minutes", expiry: "turn-end", sustained: false }, start: { value: game.time.worldTime }, rules: [] },
        flags: { [LIB_ID]: { [FLAG]: { itemId: item.id } } },
    }]);
    await caster.createEmbeddedDocuments("Item", [{
        type: "action",
        name: t("Cradle.Retrieve", { item: item.name }),
        img: item.img,
        system: { actionType: { value: "free" }, actions: { value: null }, traits: { value: ["manipulate"] }, description: { value: `<p>${t("Cradle.RetrieveHint")}</p>` } },
        flags: { [LIB_ID]: { cradleRetrieve: effect.uuid, withEffect: effect.uuid } },
    }]);
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: caster }),
        flavor: context.item?.name ?? "",
        content: `<p>${t("Cradle.Floats", { item: item.name, dc })}</p><div class="isaacs-automation-choice"><button type="button" data-action="isaacs-automation-snatch">${t("Cradle.Snatch")}</button></div>`,
        flags: { [LIB_ID]: { [FLAG]: { effectUuid: effect.uuid, dc } } },
    });
}

async function land(effect, { to = null } = {}) {
    const caster = effect.actor;
    const item = caster?.items.get(effect.flags[LIB_ID][FLAG].itemId);
    if (!item?.flags?.[LIB_ID]?.[FLAG]?.floating) return;
    if (to) {
        await to.createEmbeddedDocuments("Item", [{ ...item.toObject(), _id: undefined, system: { ...item.toObject().system, equipped: { carryType: "held", handsHeld: 1 } }, flags: { ...item.toObject().flags, [LIB_ID]: { ...(item.toObject().flags?.[LIB_ID] ?? {}), [FLAG]: null } } }]);
        await item.delete();
    } else {
        await item.update({ "system.equipped.carryType": "dropped", [`flags.${LIB_ID}.${FLAG}`]: null });
    }
}

export const Cradle = {
    registerHooks() {
        // Taking it back: the caster's free action.
        Hooks.on("createChatMessage", async (message, _options, userId) => {
            if (userId !== game.user?.id) return;
            const effectUuid = message.item?.flags?.[LIB_ID]?.cradleRetrieve;
            const effect = effectUuid ? fromUuidSync(effectUuid) : null;
            const item = effect?.actor?.items.get(effect.flags[LIB_ID][FLAG].itemId);
            if (!item) return;
            await item.update({ "system.equipped.carryType": "held", "system.equipped.handsHeld": 1, [`flags.${LIB_ID}.${FLAG}`]: null });
            await effect.delete();
        });
        // A snatch from the air.
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, FLAG);
            const button = spec?.effectUuid && html?.querySelector?.('[data-action="isaacs-automation-snatch"]');
            if (!button || button.dataset.bound) return;
            button.dataset.bound = "1";
            button.addEventListener("click", async () => {
                const effect = fromUuidSync(spec.effectUuid);
                const token = canvas.tokens?.controlled?.[0];
                const caster = effect?.actor?.getActiveTokens?.(true, false)?.[0];
                if (!effect || !token?.actor || !caster) return ui.notifications.warn(t("Cradle.Gone"));
                if (!handFree([...token.actor.items])) return ui.notifications.warn(t("Cradle.NoHand", { name: token.name }));
                const reach = Number(token.actor.system?.attributes?.reach?.base) || 5;
                if (token.distanceTo(caster) > reach) return ui.notifications.warn(t("Cradle.OutOfReach", { name: token.name }));
                const roll = await token.actor.skills?.athletics?.roll({ dc: { value: spec.dc }, skipDialog: true, label: t("Cradle.Snatch"), traits: ["attack"] });
                if ((roll?.degreeOfSuccess ?? 0) < 2) return;
                await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ token: token.document }), content: `<p>${t("Cradle.Snatched", { name: token.name })}</p>`, flags: { [LIB_ID]: { cradleSnatch: { effectUuid: spec.effectUuid, toUuid: token.actor.uuid } } } });
            });
        });
        // Settled by the active GM: the item changes hands, the spell ends.
        Hooks.on("createChatMessage", async (message) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const spec = flagOf(message, "cradleSnatch");
            const effect = spec ? fromUuidSync(spec.effectUuid) : null;
            if (!effect) return;
            await land(effect, { to: fromUuidSync(spec.toUuid) });
            await effect.delete();
        });
        // Over with the item still afloat: it falls.
        Hooks.on("deleteItem", async (item) => {
            if (game.users?.activeGM?.id !== game.user?.id || item.type !== "effect" || !item.flags?.[LIB_ID]?.[FLAG]) return;
            await land(item);
        });
    },
};
