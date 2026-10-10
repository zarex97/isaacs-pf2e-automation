import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Falling off a thing that changed under you.
 *
 * *Shape Stone*: "Critical Failure The creature falls off the stone (if applicable) and lands Prone." `{ type:
 * "fall-off", feet }` moves the creature from the area's centre (`areaTargeting.markCentre`) straight out until it no
 * longer stands within `feet` of it — off the stone, onto the nearest square beside it.
 */

/** Where a token of this size lands, moved out along the line from the centre until clear of `reach`. */
export function landing(at, size, centre, reach, grid) {
    const mid = { x: at.x + size / 2, y: at.y + size / 2 };
    let dx = mid.x - centre.x, dy = mid.y - centre.y;
    if (!dx && !dy) dx = 1;
    const length = Math.hypot(dx, dy);
    const need = reach + size / 2 + grid / 2;
    const out = { x: centre.x + (dx / length) * need - size / 2, y: centre.y + (dy / length) * need - size / 2 };
    return { x: Math.round(out.x / grid) * grid, y: Math.round(out.y / grid) * grid };
}

export async function fallOff(rider, context) {
    const token = context.target?.document ?? context.target;
    const centre = context.message?.flags?.[LIB_ID]?.centres?.[0];
    const scene = token?.parent;
    if (!token || !centre || !scene) return;
    const grid = scene.grid.size;
    const reach = ((Number(rider.apply.feet) || 5) / (scene.grid.distance || 5)) * grid;
    const spot = landing({ x: token._source.x, y: token._source.y }, token.width * grid, centre, reach, grid);
    await token.update(spot, { animate: false });
    context.notes.push(t("FallOff.Fell", { name: token.name }));
}
