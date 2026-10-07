import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Dismissing an area.
 *
 * *Toxic Cloud*: "You can Dismiss the spell." An effect on a sheet can be taken off by whoever owns the
 * sheet; an area left on the board is a Region, and only a GM can delete one. So the area gives its caster
 * the action, the way an area that grows gives them its *Sustain*: "Dismiss Toxic Cloud", one action with
 * the concentrate trait, gone with the area however the area goes.
 */

const FLAG = "dismiss";

/** The granted action, as a plain source object. */
export function dismissActionSource({ item, regionUuid = null, effectUuid = null }) {
    const name = item?.name ?? t("Rider.Name");
    return {
        type: "action",
        name: t("Dismiss.Name", { name }),
        img: item?.img ?? "icons/svg/cancel.svg",
        system: {
            actionType: { value: "action" },
            actions: { value: 1 },
            description: { value: `<p>${t("Dismiss.Description", { name })}</p>` },
            traits: { value: ["concentrate"], rarity: "common" },
        },
        flags: {
            [LIB_ID]: {
                [FLAG]: { regionUuid, effectUuid },
                riders: [{ event: "action-used", self: true, apply: { type: "dismiss" } }],
            },
        },
    };
}

export const Dismiss = {
    async grantForRegion(actor, item, region) {
        if (!actor || !region) return null;
        const [created] = await actor.createEmbeddedDocuments("Item", [dismissActionSource({ item, regionUuid: region.uuid })]);
        return created ?? null;
    },

    /** A spell's effect that can be Dismissed — *Animal Form*: "You can Dismiss the spell." */
    async grantForEffect(actor, item, effect) {
        if (!actor || !effect) return null;
        const [created] = await actor.createEmbeddedDocuments("Item", [dismissActionSource({ item, effectUuid: effect.uuid })]);
        return created ?? null;
    },

    /** The action was used: the area — or the effect — goes, and the action with it. */
    async apply(_rider, context) {
        const action = context.item;
        const spec = action?.flags?.[LIB_ID]?.[FLAG];
        const actor = context.actor;
        if (!spec || !actor) return;
        const region = spec.regionUuid ? await fromUuid(spec.regionUuid) : null;
        const effect = spec.effectUuid ? await fromUuid(spec.effectUuid).catch(() => null) : null;
        const name = region?.name ?? effect?.name ?? action.name;
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t("Dismiss.Done", { actor: actor.name, name })}</p>` });
        // The area's own clean-up (`registerHooks`) takes the action too, and may get there first.
        if (region) await region.delete();
        if (effect) await effect.delete().catch(() => {});
        if (actor.items.has(action.id)) await action.delete().catch(() => {});
    },

    /** An area gone — dismissed, or its minute up — takes its Dismiss action off its caster. Active GM only. */
    registerHooks() {
        Hooks.on("deleteRegion", async (region) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            const originUuid = region.flags?.[LIB_ID]?.lingering?.originUuid;
            const actor = originUuid ? await fromUuid(originUuid) : null;
            const orphans = actor?.items?.filter((i) => i.type === "action" && i.flags?.[LIB_ID]?.[FLAG]?.regionUuid === region.uuid).map((i) => i.id) ?? [];
            if (orphans.length > 0) await actor.deleteEmbeddedDocuments("Item", orphans).catch(() => {});
        });
        // …and an effect gone — dismissed, or out of time — likewise.
        Hooks.on("deleteItem", async (item) => {
            if (game.users.activeGM?.id !== game.user.id || item.type !== "effect") return;
            for (const actor of [item.actor, ...game.actors.contents].filter(Boolean)) {
                const orphans = actor.items.filter((i) => i.type === "action" && i.flags?.[LIB_ID]?.[FLAG]?.effectUuid === item.uuid).map((i) => i.id);
                if (orphans.length > 0) {
                    await actor.deleteEmbeddedDocuments("Item", orphans).catch(() => {});
                    return;
                }
            }
        });
    },
};
