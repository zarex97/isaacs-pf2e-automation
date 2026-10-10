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

/**
 * *Friendfetch*: "ephemeral, telekinetic strands … drag each target directly toward you, stopping in the closest
 * unoccupied space to you in this path. This is forced movement." `{ type: "fetch" }` moves each target along the
 * straight line toward the caster, a square at a time, to the last square on it nobody stands on before the caster —
 * forced movement, so what bars a creature's own steps does not bar it.
 */

/** The squares from one corner toward another, a grid square at a time, the last before the destination's included. */
export function squaresToward(from, to, grid) {
    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) / grid;
    const out = [];
    for (let i = 1; i < steps; i++) out.push({ x: Math.round((from.x + ((to.x - from.x) * i) / steps) / grid) * grid, y: Math.round((from.y + ((to.y - from.y) * i) / steps) / grid) * grid });
    return out;
}

export async function fetchToward(_rider, context) {
    const target = context.target?.document ?? context.target;
    const scene = target?.parent;
    const own = context.originToken?.document ?? context.originToken;
    const caster = own?.parent === scene ? own : context.originActor?.getActiveTokens?.(true, true).find((token) => token.parent === scene);
    if (!target || !caster || target === caster) return;
    const grid = scene.grid.size;
    const taken = scene.tokens.filter((token) => token !== target && !token.hidden).map((token) => ({ x: token._source.x, y: token._source.y, w: token.width * grid, h: token.height * grid }));
    const path = squaresToward({ x: target._source.x, y: target._source.y }, { x: caster._source.x, y: caster._source.y }, grid);
    const free = path.filter((p) => !taken.some((o) => p.x < o.x + o.w && o.x < p.x + target.width * grid && p.y < o.y + o.h && o.y < p.y + target.height * grid));
    const spot = free.at(-1);
    if (!spot) {
        context.notes.push(t("Swap.NoSpace", { name: target.name }));
        return;
    }
    await target.update(spot, { animate: false, forcedMovement: true });
    context.notes.push(t("Swap.Fetched", { name: target.name, caster: caster.name }));
}
