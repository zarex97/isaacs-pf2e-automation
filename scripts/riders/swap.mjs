import { t } from "../i18n.mjs";
import { PlanarTether } from "./tether.mjs";

/**
 * Two creatures trading places.
 *
 * *King's Castle*: "You and a willing creature swap places. You appear in the target's former space, and the target
 * appears in your former space. You and your target must each be able to fit in the new spaces within range; otherwise,
 * the spell fails." `{ type: "swap", range }` moves the caster's token to the target's corner and the target's to the
 * caster's, each blinking rather than sliding. It fails, and says why, when the two stand farther apart than `range`
 * feet, or when either one's footprint in its new place would overlap a third creature or leave the scene. A planar
 * tether on either holds them both in place.
 */

/** Do two squares-based footprints overlap? `{ x, y, w, h }` in pixels. */
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Does a footprint fit at a place: inside the scene, and over nobody else? */
export function fits(box, others, bounds) {
    const inside = box.x >= bounds.x && box.y >= bounds.y && box.x + box.w <= bounds.x + bounds.width && box.y + box.h <= bounds.y + bounds.height;
    return inside && !others.some((other) => overlaps(box, other));
}

const boxOf = (token, at, grid) => ({ x: at.x, y: at.y, w: token.width * grid, h: token.height * grid });

export async function swapPlaces(rider, context) {
    const target = context.target?.document ?? context.target;
    const scene = target?.parent;
    const own = context.originToken?.document ?? context.originToken;
    const caster = own?.parent === scene ? own : context.originActor?.getActiveTokens?.(true, true).find((token) => token.parent === scene);
    if (!target || !caster || caster === target) {
        context.notes.push(t("Swap.NoOne"));
        return;
    }
    const grid = scene.grid.size;
    const casterAt = { x: caster._source.x, y: caster._source.y };
    const targetAt = { x: target._source.x, y: target._source.y };
    const range = Number(rider.apply.range) || 60;
    const feet = canvas.grid.measurePath([caster.object?.center ?? casterAt, target.object?.center ?? targetAt]).distance;
    if (feet > range) {
        context.notes.push(t("Swap.TooFar", { name: target.name, feet: Math.round(feet), range }));
        return;
    }
    const others = scene.tokens.filter((token) => token !== caster && token !== target && !token.hidden)
        .map((token) => boxOf(token, { x: token._source.x, y: token._source.y }, grid));
    const bounds = scene.dimensions.sceneRect;
    if (!fits(boxOf(caster, targetAt, grid), others, bounds) || !fits(boxOf(target, casterAt, grid), others, bounds)) {
        context.notes.push(t("Swap.NoRoom", { caster: caster.name, name: target.name }));
        return;
    }
    const item = context.item ?? null;
    for (const actor of [context.actor, context.originActor]) {
        if (await PlanarTether.holds({ ...context, actor }, "teleport", { item })) return;
    }
    await caster.update(targetAt, { animate: false });
    await target.update(casterAt, { animate: false });
    context.notes.push(t("Swap.Done", { caster: caster.name, name: target.name }));
}
