import { targetingOptions, testPredicate } from "../lib/roll-options.mjs";

/**
 * Decide who the placed area caught.
 *
 * Containment is tested against the Region's polygon tree rather than its `tokens` collection, because
 * `RegionDocument#tokens` is filled in asynchronously after creation and we want an answer in the same
 * turn the caster confirmed the placement. Each token is sampled at the centre of every square it
 * occupies and counts as caught if any of them lands inside — which is both the PF2e rule ("a creature is
 * affected if any square of its space is in the area") and what the coverage highlight the caster is
 * looking at already shows.
 *
 * Returns tokens inside the area, split into the ones the Technique's rule accepts and the ones it
 * rejects. Tokens outside the area are not mentioned at all; only a token the caster can see caught in
 * the highlight and then not targeted needs explaining.
 */
export function catchTokens(region, config, originToken) {
    const originActor = config.item.actor;
    const origin = originPoint(region, originToken);
    const caught = [];
    const rejected = [];

    for (const token of canvas.tokens.placeables) {
        if (!contains(region, token)) continue;

        const reason = rejectionFor(token, config, originActor, originToken, origin);
        if (reason) rejected.push({ token, reason });
        else caught.push({ token, checked: true, note: "" });
    }

    // "up to five allies" is a cap on how many the Technique may take, not a rule about who is in the
    // area — so the extras stay listed and simply start unchecked for the caster to choose between.
    if (config.maxTargets > 0 && caught.length > config.maxTargets) {
        for (const entry of caught.slice(config.maxTargets)) {
            entry.checked = false;
            entry.note = `over the limit of ${config.maxTargets}`;
        }
    }

    return { caught, rejected };
}

/** Why this token, though inside the area, is not a legal target. Null if it is one. */
function rejectionFor(token, config, originActor, originToken, origin) {
    const actor = token.actor;
    if (token === originToken) return config.includesSelf ? null : "you";
    if (token.document.hidden) return "hidden token";
    if (!actor?.isOfType?.("creature", "hazard", "vehicle")) return "not a creature";
    if (actor.isDead) return "already dead";

    if (actor.alliance === null && !config.includesNeutral) return "neutral";
    if (config.affects === "allies" && !actor.isAllyOf(originActor)) return "not an ally";
    if (config.affects === "enemies" && !actor.isEnemyOf(originActor)) return "not an enemy";

    if (config.requireLineOfEffect && blocked(origin, token.center)) return "no line of effect";

    if (!testPredicate(config.predicate, targetingOptions(originActor, actor, config.item))) {
        return "excluded by this Technique";
    }

    return null;
}

/** Where the area originates, which is where every line of effect is drawn from. */
function originPoint(region, originToken) {
    const shape = region?.shapes?.at?.(0);
    const fallback = originToken?.center ?? { x: 0, y: 0 };
    if (!shape) return fallback;
    if (shape.origin) return shape.origin;
    if (shape.base) return { x: shape.base.x, y: shape.base.y };
    return Number.isFinite(shape.x) && Number.isFinite(shape.y) ? { x: shape.x, y: shape.y } : fallback;
}

function blocked(origin, target) {
    return !!CONFIG.Canvas.polygonBackends.move.testCollision(origin, target, { type: "move", mode: "any" });
}

function contains(region, token) {
    if (!withinElevation(region, token)) return false;
    const points = samplePoints(token);
    const tree = region.polygonTree;
    if (tree) return points.some((point) => tree.testPoint(point));
    // The polygon tree is derived from the shapes and should always be there; the placeable is the
    // fallback rather than the other way round because it depends on the region having been drawn.
    const placeable = region.object;
    return !!placeable && points.some((point) => placeable.testPoint(point, token.document.elevation));
}

/** Region elevation is open-ended at both ends: a null bound means "no bound", not zero. */
function withinElevation(region, token) {
    const elevation = token.document.elevation ?? 0;
    const bottom = region.elevation?.bottom ?? null;
    const top = region.elevation?.top ?? null;
    if (bottom !== null && elevation < bottom) return false;
    if (top !== null && (region.elevation?.topInclusive ? elevation > top : elevation >= top)) return false;
    return true;
}

/**
 * The centre of every grid square the token occupies. Square grids only — on hex and gridless there is no
 * square to take the centre of, so the token's own centre is the sample, which is what pf2e's own
 * distance measurement falls back to as well.
 */
function samplePoints(token) {
    const grid = canvas.grid;
    if (grid.type !== CONST.GRID_TYPES.SQUARE) return [token.center];

    const { x, y } = token.document;
    const across = Math.max(1, Math.round(token.document.width));
    const down = Math.max(1, Math.round(token.document.height));
    const points = [];
    for (let i = 0; i < across; i++) {
        for (let j = 0; j < down; j++) {
            points.push({ x: x + (i + 0.5) * grid.sizeX, y: y + (j + 0.5) * grid.sizeY });
        }
    }
    return points.length > 0 ? points : [token.center];
}
