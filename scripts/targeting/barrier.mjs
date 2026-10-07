import { LIB_ID } from "../id.mjs";
import { t } from "../i18n.mjs";
import { DamageBus } from "../lib/damage-bus.mjs";
import { CheckPipeline } from "../lib/check-pipeline.mjs";

/**
 * A wall of sections, each one breakable on its own.
 *
 * *Wall of Stone*: "You can shape the wall's path, placing each 5 feet of the wall on the border between squares …
 * Each 10-foot-by-10-foot section of the wall has AC 10, Hardness 14, and 50 Hit Points … A destroyed section of the
 * wall can be moved through, but the rubble created from it is difficult terrain." *Wall of Thorns* is the same
 * idea built of squares rather than borders.
 *
 * The caster aims a line (`areaTargetingShapes` names its lengths and, for a bent wall, how many runs). It is snapped
 * onto the grid — a run of borders starts on a grid point and goes along a grid line; a run of squares goes one of
 * eight ways — and cut into sections. Each section is a hazard token (one hazard actor per cast, the tokens unlinked,
 * so each keeps its own Hit Points) standing for one piece of wall: a `Wall` segment for a wall of borders, or a
 * lingering Region of its squares for a wall of squares, carrying whatever the spell's ground does (`lingering.mjs`).
 * At 0 Hit Points the section goes, and with it its piece of wall; a stone section leaves rubble.
 *
 * "You must conjure the wall in an unbroken open space so its edges don't pass through any creatures … or the spell
 * is lost": a run through a creature builds nothing.
 */

const FLAG = "barrier";

/** The run as placed, put on the grid: the start on a grid point, the direction a multiple of `snapDeg`. */
export function snappedRun(start, rotationDeg, feet, gridSize, gridDistance, snapDeg) {
    const snap = (v) => Math.round(v / gridSize) * gridSize;
    const a = { x: snap(start.x), y: snap(start.y) };
    const angle = Math.round((Number(rotationDeg) || 0) / snapDeg) * snapDeg;
    const radians = (angle * Math.PI) / 180;
    const steps = Math.max(1, Math.round(feet / gridDistance));
    // A diagonal step is one square on each axis, not a square's length along the diagonal.
    const dx = Math.round(Math.cos(radians));
    const dy = Math.round(Math.sin(radians));
    return { a, b: { x: a.x + dx * steps * gridSize, y: a.y + dy * steps * gridSize }, dx, dy, steps, angle };
}

/** A run of borders cut into sections of `perSection` grid steps. */
export function borderSections(run, perSection, gridSize) {
    const out = [];
    for (let i = 0; i < run.steps; i += perSection) {
        const n = Math.min(perSection, run.steps - i);
        out.push({
            a: { x: run.a.x + run.dx * i * gridSize, y: run.a.y + run.dy * i * gridSize },
            b: { x: run.a.x + run.dx * (i + n) * gridSize, y: run.a.y + run.dy * (i + n) * gridSize },
        });
    }
    return out;
}

/** A run of squares — the square the run starts in, then one per step its way — cut into sections. */
export function squareSections(run, perSection, gridSize) {
    const first = { x: run.a.x - (run.dx < 0 ? gridSize : 0), y: run.a.y - (run.dy < 0 ? gridSize : 0) };
    const squares = Array.from({ length: run.steps }, (_, i) => ({ x: first.x + run.dx * i * gridSize, y: first.y + run.dy * i * gridSize }));
    const out = [];
    for (let i = 0; i < squares.length; i += perSection) out.push(squares.slice(i, i + perSection));
    return out;
}

/** Does a segment pass through the inside of a rectangle — not merely along its edge? */
export function crossesInterior(seg, rect) {
    const inset = 0.5;
    const r = { x1: rect.x + inset, y1: rect.y + inset, x2: rect.x + rect.w - inset, y2: rect.y + rect.h - inset };
    // Liang–Barsky clip of the segment against the inset rectangle.
    let t0 = 0;
    let t1 = 1;
    const dx = seg.b.x - seg.a.x;
    const dy = seg.b.y - seg.a.y;
    for (const [p, q] of [[-dx, seg.a.x - r.x1], [dx, r.x2 - seg.a.x], [-dy, seg.a.y - r.y1], [dy, r.y2 - seg.a.y]]) {
        if (p === 0) {
            if (q < 0) return false;
        } else {
            const u = q / p;
            if (p < 0) t0 = Math.max(t0, u);
            else t1 = Math.min(t1, u);
            if (t0 > t1) return false;
        }
    }
    return true;
}

/** Hit Points at a cast: the base and what heightening adds. */
export function sectionHp(spec, steps) {
    const interval = Math.max(1, Number(spec.hpPerStepInterval) || 1);
    return (Number(spec.hp) || 1) + (Number(spec.hpPerStep) || 0) * Math.floor((Number(steps) || 0) / interval);
}

export const Barrier = {
    /**
     * Build the barrier along each placed run. `makeRegion(rectangle)` builds a section's ground for a wall of
     * squares (a lingering Region, from `lingering.mjs`). Active GM only — only a GM may write scene geometry.
     */
    async build(spec, config, placed, originToken, { makeRegion = null, expiresAt = null } = {}) {
        const scene = canvas.scene;
        const grid = scene.grid.size;
        const distance = scene.grid.distance || 5;
        const kind = spec.kind === "squares" ? "squares" : "border";
        const perSection = Math.max(1, Math.round((Number(spec.sectionFeet) || 10) / distance));
        const runs = placed.map((region) => {
            const shape = region.shapes?.[0] ?? region.toObject?.().shapes?.[0];
            const feet = ((Number(shape?.length) || 0) / grid) * distance || Number(config.area?.value) || 0;
            return snappedRun({ x: shape.x, y: shape.y }, shape.rotation, feet, grid, distance, kind === "border" ? 90 : 45);
        });

        // "So its edges don't pass through any creatures": anything in the way, and the spell is lost.
        const occupied = scene.tokens.filter((tk) => tk.actor && !flagOf(tk)).map((tk) => ({ x: tk.x, y: tk.y, w: tk.width * grid, h: tk.height * grid, name: tk.name }));
        const pieces = runs.map((run) => (kind === "border" ? borderSections(run, perSection, grid) : squareSections(run, perSection, grid)));
        const blocked = occupied.filter((rect) => pieces.flat().some((piece) => (kind === "border"
            ? crossesInterior(piece, rect)
            : piece.some((sq) => sq.x < rect.x + rect.w && rect.x < sq.x + grid && sq.y < rect.y + rect.h && rect.y < sq.y + grid))));
        if (blocked.length > 0) {
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: config.item.actor }), content: `<p>${t("Barrier.Lost", { name: config.item.name, names: [...new Set(blocked.map((b) => b.name))].join(", ") })}</p>` });
            return null;
        }

        const hp = sectionHp(spec, config.steps ?? 0);
        const hazard = await Actor.create({
            name: `${config.item.name} (${config.item.actor?.name ?? ""})`.trim(),
            type: "hazard",
            img: config.item.img,
            system: {
                attributes: {
                    ac: { value: Number(spec.ac) || 10 },
                    hardness: Number(spec.hardness) || 0,
                    hp: { value: hp, max: hp },
                    immunities: (spec.immunities ?? []).map((type) => ({ type })),
                },
                details: { level: { value: config.item.rank ?? 1 }, isComplex: false },
                traits: { value: [], rarity: "common" },
            },
            flags: { [LIB_ID]: { [FLAG]: { base: true } } },
        }, { renderSheet: false });
        if (!hazard) return null;

        const castId = foundry.utils.randomID();
        const tokens = [];
        for (const piece of pieces.flat()) {
            const wallIds = [];
            let regionId = null;
            let at;
            if (kind === "border") {
                const [wall] = await scene.createEmbeddedDocuments("Wall", [{
                    c: [piece.a.x, piece.a.y, piece.b.x, piece.b.y],
                    move: CONST.WALL_MOVEMENT_TYPES.NORMAL,
                    sight: CONST.WALL_SENSE_TYPES.NORMAL,
                    light: CONST.WALL_SENSE_TYPES.NORMAL,
                    sound: CONST.WALL_SENSE_TYPES.NORMAL,
                    flags: { [LIB_ID]: { [FLAG]: { castId } } },
                }]);
                if (wall) wallIds.push(wall.id);
                at = { x: Math.round(((piece.a.x + piece.b.x) / 2 - grid / 2) / (grid / 2)) * (grid / 2), y: Math.round(((piece.a.y + piece.b.y) / 2 - grid / 2) / (grid / 2)) * (grid / 2) };
            } else {
                const shapes = piece.map((sq) => ({ type: "rectangle", x: sq.x, y: sq.y, width: grid, height: grid }));
                const region = makeRegion ? await makeRegion(shapes, castId) : null;
                regionId = region?.id ?? null;
                at = { x: piece[0].x, y: piece[0].y };
            }
            const tokenData = (await hazard.getTokenDocument({ x: at.x, y: at.y, actorLink: false, name: t("Barrier.Section", { name: config.item.name }) })).toObject();
            tokenData.flags = foundry.utils.mergeObject(tokenData.flags ?? {}, { [LIB_ID]: { [FLAG]: { castId, kind, wallIds, regionId, rubble: spec.rubble === true, cover: spec.cover === true, piece, expiresAt, hazardId: hazard.id } } });
            tokens.push(tokenData);
        }
        await scene.createEmbeddedDocuments("Token", tokens);
        return hazard;
    },

    /** A section at 0 Hit Points: its piece of wall goes, and stone leaves rubble. */
    async breach(token, { rubble = true } = {}) {
        const spec = flagOf(token);
        const scene = token?.parent;
        if (!spec || !scene) return;
        // Each piece on its own, and a piece already gone is no error: the area's own expiry sweep (`lingering.mjs`)
        // may take a section's Region on the same tick this does.
        const gone = (promise) => promise.catch(() => null);
        const wallIds = (spec.wallIds ?? []).filter((id) => scene.walls.has(id));
        if (wallIds.length > 0) await gone(scene.deleteEmbeddedDocuments("Wall", wallIds));
        if (spec.regionId && scene.regions.has(spec.regionId)) await gone(scene.deleteEmbeddedDocuments("Region", [spec.regionId]));
        if (rubble && spec.rubble && spec.kind === "border") await placeRubble(scene, spec.piece);
        if (scene.tokens.has(token.id)) await gone(scene.deleteEmbeddedDocuments("Token", [token.id]));
        const left = scene.tokens.some((tk) => flagOf(tk)?.castId === spec.castId);
        if (!left && spec.hazardId && game.actors.has(spec.hazardId)) await gone(game.actors.get(spec.hazardId).delete());
        if (rubble) await ChatMessage.create({ content: `<p>${t(spec.rubble ? "Barrier.Rubble" : "Barrier.Breached", { name: token.name })}</p>` });
    },

    /** Sections whose time is up, with no rubble. Active GM only. */
    async sweep() {
        if (game.users?.activeGM?.id !== game.user?.id) return;
        const now = game.time.worldTime;
        for (const scene of game.scenes) {
            for (const token of scene.tokens.filter((tk) => typeof flagOf(tk)?.expiresAt === "number" && flagOf(tk).expiresAt <= now)) {
                await Barrier.breach(token, { rubble: false });
            }
        }
    },

    registerHooks() {
        // *Wall of Thorns*: "Everything on each side of the wall has cover from creatures on the opposite side." An
        // attack whose line crosses a standing section of such a wall is made against the target's AC with standard
        // cover's +2.
        CheckPipeline.before("cover from a wall of squares", 30, (_check, context) => {
            if (context?.type !== "attack-roll" || !context.dc?.value) return;
            const from = (context.origin?.token ?? context.token)?.object?.center;
            const to = context.target?.token?.object?.center;
            if (!from || !to || !canvas?.scene) return;
            const covering = canvas.scene.tokens.find((tk) => flagOf(tk)?.cover && crossesAny(from, to, flagOf(tk).piece, canvas.grid.size));
            if (!covering) return;
            const label = t("Barrier.Cover", { name: covering.name });
            return { ...context, dc: { ...context.dc, value: context.dc.value + 2, ...(context.dc.label ? { label: `${context.dc.label} (+2 ${label})` } : {}) } };
        });
        DamageBus.after("a wall section at 0 Hit Points is breached", 90, async (actor) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const token = actor?.token;
            if (!flagOf(token) || (actor.hitPoints?.value ?? 1) > 0) return;
            await Barrier.breach(token);
        });
        Hooks.on("updateWorldTime", () => Barrier.sweep());
        Hooks.on("pf2e.startTurn", () => Barrier.sweep());
    },
};

/** Does the line between two points pass through any of these squares? */
export function crossesAny(from, to, squares, gridSize) {
    if (!Array.isArray(squares)) return false;
    return squares.some((sq) => crossesInterior({ a: from, b: to }, { x: sq.x, y: sq.y, w: gridSize, h: gridSize }));
}

function flagOf(token) {
    return token?.flags?.[LIB_ID]?.[FLAG] ?? null;
}

/** The squares on either side of a breached border section, as difficult terrain. */
async function placeRubble(scene, piece) {
    if (!piece?.a) return;
    const grid = scene.grid.size;
    const horizontal = piece.a.y === piece.b.y;
    const x = Math.min(piece.a.x, piece.b.x) - (horizontal ? 0 : grid);
    const y = Math.min(piece.a.y, piece.b.y) - (horizontal ? grid : 0);
    const width = horizontal ? Math.abs(piece.b.x - piece.a.x) : grid * 2;
    const height = horizontal ? grid * 2 : Math.abs(piece.b.y - piece.a.y);
    const model = CONFIG.RegionBehavior.dataModels.modifyMovementCost;
    const actions = Object.keys(model?.schema?.fields?.difficulties?.fields ?? {});
    await scene.createEmbeddedDocuments("Region", [{
        name: t("Barrier.RubbleName"),
        shapes: [{ type: "rectangle", x, y, width, height }],
        color: "#8a7f72",
        visibility: CONST.REGION_VISIBILITY.ALWAYS,
        behaviors: actions.length ? [{ type: "modifyMovementCost", name: t("Barrier.RubbleName"), system: { difficulties: Object.fromEntries(actions.map((a) => [a, 2])) } }] : [],
    }]);
}
