import { LIB_ID } from "../id.mjs";
import { t } from "../i18n.mjs";

/**
 * Pulled toward the middle of an area.
 *
 * *Gravity Well*: "All creatures … in the area move towards the center, depending on their Reflex saving throws.
 * This follows the rules for forced movement. If there's not enough space near the center of the sphere,
 * creatures and objects nearer to the center move first, and others move as far as they can without being
 * blocked." So the whole cast is one event: every creature saves, then they move nearest first, each a square
 * at a time straight at the centre, stopping at a wall, at another creature, or at the centre itself. The
 * centre is the placement's own, stamped on the card (`zones.mjs`).
 */

const DEGREES = ["criticalFailure", "failure", "success", "criticalSuccess"];

/** One resolution per cast, however many targets it reached — keyed by the card. */
const resolving = new Map();

/** The squares, in order, a token's top-left corner takes moving up to `squares` toward `centre`; never past it. */
export function pullSteps(from, size, centre, squares, gridSize) {
    const own = { x: from.x + size.w / 2, y: from.y + size.h / 2 };
    const dx = centre.x - own.x;
    const dy = centre.y - own.y;
    const length = Math.hypot(dx, dy);
    const reach = Math.min(squares, Math.floor(length / gridSize + 0.5));
    const steps = [];
    for (let k = 1; k <= reach; k++) {
        const x = Math.round((from.x + (dx / length) * gridSize * k) / gridSize) * gridSize;
        const y = Math.round((from.y + (dy / length) * gridSize * k) / gridSize) * gridSize;
        const last = steps.at(-1) ?? from;
        if (x !== last.x || y !== last.y) steps.push({ x, y });
    }
    return steps;
}

/** How far each degree moves, in feet. */
export function pullFeet(spec, outcome) {
    return Number(spec?.[outcome]) || 0;
}

function overlapsAny(at, size, others) {
    return others.some((o) => at.x < o.x + o.w && o.x < at.x + size.w && at.y < o.y + o.h && o.y < at.y + size.h);
}

function blockedByWall(from, to, size) {
    const centre = (p) => ({ x: p.x + size.w / 2, y: p.y + size.h / 2 });
    return !!CONFIG.Canvas.polygonBackends.move.testCollision(centre(from), centre(to), { type: "move", mode: "any" });
}

/** The cast's pull: every target saves, then they move nearest first. Runs once per card. */
export async function applyPull(rider, context) {
    const key = context.message?.id;
    const centre = context.message?.flags?.[LIB_ID]?.centres?.[0];
    if (!key || !centre) return;
    if (!resolving.has(key)) {
        if (resolving.size > 20) resolving.delete(resolving.keys().next().value);
        resolving.set(key, resolvePull(rider, context, centre));
    }
    await resolving.get(key);
}

async function resolvePull(rider, context, centre) {
    const scene = canvas.scene;
    const grid = scene.grid.size;
    const tokens = [...(context.targets ?? [])].map((t) => t?.document ?? t).filter((t) => t?.actor);
    const { RiderExtensions } = await import("./extensions.mjs");
    const dc = RiderExtensions.resolveDC("spell", context);
    const item = context.item ?? null;
    // The saves first, all of them: who moves how far is settled before anyone moves.
    const planned = [];
    const { Anchor } = await import("./dc-swap.mjs");
    for (const token of tokens) {
        // *Bracing Tendrils*: an anchored creature is moved only past its anchor (`dc-swap.mjs`).
        if (await Anchor.holds({ ...context, actor: token.actor, target: token }, item)) continue;
        const statistic = token.actor.getStatistic?.(rider.apply.save ?? "reflex");
        const roll = statistic && dc ? await statistic.roll({ dc: { value: dc }, skipDialog: true, item }) : null;
        const outcome = DEGREES[roll?.degreeOfSuccess ?? 1];
        const feet = pullFeet(rider.apply.feet, outcome);
        const size = { w: token.width * grid, h: token.height * grid };
        const centreOf = { x: token.x + size.w / 2, y: token.y + size.h / 2 };
        planned.push({ token, feet, size, distance: Math.hypot(centre.x - centreOf.x, centre.y - centreOf.y) });
    }
    // Nearest to the centre first.
    planned.sort((a, b) => a.distance - b.distance);
    const moved = [];
    for (const plan of planned) {
        if (plan.feet <= 0) continue;
        const squares = Math.floor(plan.feet / (scene.grid.distance || 5));
        let at = { x: plan.token.x, y: plan.token.y };
        const others = () => scene.tokens.filter((o) => o.id !== plan.token.id).map((o) => ({ x: o.x, y: o.y, w: o.width * grid, h: o.height * grid }));
        for (const next of pullSteps(at, plan.size, centre, squares, grid)) {
            if (blockedByWall(at, next, plan.size) || overlapsAny(next, plan.size, others())) break;
            at = next;
        }
        if (at.x === plan.token.x && at.y === plan.token.y) continue;
        const travelled = Math.round((Math.max(Math.abs(at.x - plan.token.x), Math.abs(at.y - plan.token.y)) / grid) * (scene.grid.distance || 5));
        await plan.token.update({ x: at.x, y: at.y }, { animate: false, forcedMovement: true });
        moved.push(t("Pull.Moved", { name: plan.token.name, feet: travelled, wanted: plan.feet }));
    }
    if (moved.length > 0) {
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: context.originActor }), content: `<p>${moved.join("<br>")}</p>` });
    }
}
