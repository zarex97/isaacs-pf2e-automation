import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { Dismiss } from "./dismiss.mjs";

/**
 * Seeing from somewhere else.
 *
 * *Shift Perspective*: "You throw one item of light Bulk or less that you're holding to a location within range that
 * you can see, then gain temporary vision from where that object lands. The object sees in all directions with your
 * normal visual senses. You can Sustain this spell to switch between the thrown object's perspective and your regular
 * vision … You can Dismiss this spell." `{ type: "throw-view" }`, after a placement that marks its square: the caster's
 * held item of light Bulk or less leaves their hands and lands there, as a loot token that sees as the caster's own token
 * does. The caster gets an effect that shares its senses (`senses-link.mjs`) — its switch is the Sustain — and the Dismiss.
 *
 * *Instant Parade*: "You can choose to send the parade off with a 2-action activity … the parade no longer follows you
 * and instead continues traveling in the direction of your choice. The parade travels 100 feet over 1 round and then
 * disappears as the spell is Dismissed." `{ type: "send-off", feet }` on the caster's action asks a direction, stops the
 * area that follows them, sets it `feet` along that way, and ends it a round later.
 */

/** A held item light enough to throw: light Bulk or less. */
export function throwable(items) {
    return items.find((item) => item.system?.equipped?.carryType === "held" && (item.system.equipped.handsHeld ?? 0) > 0 && (Number(item.system?.bulk?.value) || 0) <= 0.1) ?? null;
}

export async function throwView(rider, context) {
    const caster = context.originActor;
    const centre = context.message?.flags?.[LIB_ID]?.centres?.[0];
    const scene = canvas?.scene;
    const own = caster?.getActiveTokens?.(true, true).find((token) => token.parent === scene);
    const item = throwable([...(caster?.items ?? [])]);
    if (!caster || !centre || !scene || !own) return;
    if (!item) {
        context.notes.push(t("Perspective.Nothing", { actor: caster.name }));
        return;
    }
    const grid = scene.grid.size;
    const pile = await Actor.create({ name: t("Perspective.Thrown", { item: item.name }), type: "loot", img: item.img, ownership: caster.ownership, prototypeToken: { actorLink: true } });
    await pile.createEmbeddedDocuments("Item", [{ ...item.toObject(), _id: undefined, system: { ...item.toObject().system, equipped: { carryType: "worn" } } }]);
    await item.delete();
    const at = { x: Math.floor(centre.x / grid) * grid, y: Math.floor(centre.y / grid) * grid };
    const [landed] = await scene.createEmbeddedDocuments("Token", [{
        ...(await pile.getTokenDocument(at)).toObject(),
        sight: { ...own.toObject().sight, enabled: true },
        detectionModes: own.toObject().detectionModes,
        texture: { src: item.img },
    }]);
    const duration = rider.duration ?? { value: 1, unit: "minutes" };
    const seconds = (Number(duration.value) || 1) * ({ rounds: 6, minutes: 60, hours: 3600 }[duration.unit] ?? 60);
    const [effect] = await caster.createEmbeddedDocuments("Item", [{
        type: "effect",
        name: `${context.item?.name ?? ""}: ${t("Perspective.View", { item: item.name })}`,
        img: context.item?.img ?? item.img,
        system: { duration: { value: duration.value, unit: duration.unit, expiry: "turn-start", sustained: false }, start: { value: game.time.worldTime }, rules: [] },
        flags: { [LIB_ID]: { sharesSenses: { tokenUuid: landed.uuid, using: false } } },
    }]);
    if (effect) await Dismiss.grantForEffect(caster, context.item, effect);
    context.notes.push(t("Perspective.Landed", { item: item.name, seconds }));
}

/** A point `feet` from another, along one of eight compass directions. */
export function along(from, direction, feet, perFoot) {
    const angle = { east: 0, southeast: 45, south: 90, southwest: 135, west: 180, northwest: 225, north: 270, northeast: 315 }[direction] ?? 0;
    const r = (angle * Math.PI) / 180;
    return { x: Math.round(from.x + Math.cos(r) * feet * perFoot), y: Math.round(from.y + Math.sin(r) * feet * perFoot) };
}

export async function sendOff(rider, context) {
    const caster = context.originActor ?? context.actor;
    const scene = canvas?.scene;
    const spellUuid = flagOf(context.item, "originAction")?.effectUuid ? fromUuidSync(flagOf(context.item, "originAction").effectUuid)?.system?.context?.origin?.item : null;
    const region = scene?.regions.find((r) => {
        const spec = flagOf(r, "lingering");
        return spec?.originUuid === caster?.uuid && spec?.followsCaster && (!spellUuid || spec.itemUuid === spellUuid);
    });
    if (!region) {
        context.notes.push(t("Perspective.NoParade"));
        return;
    }
    const direction = await foundry.applications.api.DialogV2.wait({
        window: { title: context.item?.name ?? "" },
        content: `<p>${t("Perspective.Which")}</p>`,
        buttons: ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"].map((d) => ({ action: d, label: t(`Influence.${d.charAt(0).toUpperCase()}${d.slice(1)}`) })),
        rejectClose: false,
    });
    if (!direction) return;
    const perFoot = scene.grid.size / (scene.grid.distance || 5);
    const feet = Number(rider.apply.feet) || 100;
    // An emanation is drawn around its `base`; any other shape from its own corner.
    const shapes = region.toObject().shapes.map((shape) => (shape.base
        ? { ...shape, base: { ...shape.base, ...along({ x: shape.base.x, y: shape.base.y }, direction, feet, perFoot) } }
        : { ...shape, ...along({ x: shape.x, y: shape.y }, direction, feet, perFoot) }));
    const lingering = flagOf(region, "lingering");
    await region.update({ shapes, [`flags.${LIB_ID}.lingering`]: { ...lingering, followsCaster: false, expiresAt: game.time.worldTime + 6 } });
    context.notes.push(t("Perspective.SentOff", { name: region.name, feet: Number(rider.apply.feet) || 100 }));
}

export const Parade = {
    /**
     * The caster's effect for an area — the one that holds *Send the parade off* — ends with the area, however it ends.
     * Marked `endsWithArea`; matched by the spell and caster the area names, since the area is made after the effect.
     */
    registerHooks() {
        Hooks.on("deleteRegion", async (region) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const spec = flagOf(region, "lingering");
            const caster = spec?.originUuid ? fromUuidSync(spec.originUuid) : null;
            const ids = (caster?.itemTypes?.effect ?? []).filter((effect) => effect.flags?.[LIB_ID]?.endsWithArea && effect.flags?.[LIB_ID]?.rider?.source === spec.itemUuid).map((effect) => effect.id);
            if (ids.length > 0) await caster.deleteEmbeddedDocuments("Item", ids).catch(() => null);
        });
    },
};
