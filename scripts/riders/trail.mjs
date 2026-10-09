import { LIB_ID } from "../id.mjs";

/**
 * A path its holder leaves behind.
 *
 * *Glowing Trail*: "Your movements leave a vague glowing path behind you … The path fades after 10 minutes. You can
 * Dismiss this spell at any time, but the path fades normally. The path can be visible or Invisible … While invisible,
 * you can still detect the path." An effect carries `trail: { visible, color, fades }` (`apply.mjs`). Each move its
 * holder makes leaves a faint mark of that colour where it started, at its elevation, as a Drawing: a hidden one when
 * the path is invisible, which only its author — the caster's player — and the GM see. Each mark keeps its own clock
 * and goes when its time is up, whether the spell is still running or not. Active GM only.
 */

const FLAG = "trail";

/** The trail its holder's effects lay, or null. */
export function trailOf(actor) {
    return (actor?.itemTypes?.effect ?? []).map((effect) => effect.flags?.[LIB_ID]?.[FLAG]).find(Boolean) ?? null;
}

/** How long a stretch of path lasts at this rank: 10 minutes, a day from 3rd, a week, a month, a year. */
export function fadesAfter(rank) {
    const r = Number(rank) || 1;
    if (r >= 9) return 365 * 86400;
    if (r >= 7) return 30 * 86400;
    if (r >= 5) return 7 * 86400;
    if (r >= 3) return 86400;
    return 600;
}

/** The marks due to fade at this world time. */
export function faded(drawings, now) {
    return drawings.filter((drawing) => Number(drawing.flags?.[LIB_ID]?.[FLAG]?.expiresAt) <= now);
}

/** The user a mark belongs to: the actor's player, else the GM laying it. */
function authorOf(actor) {
    const player = Object.entries(actor?.ownership ?? {}).find(([id, level]) => id !== "default" && level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER && !game.users.get(id)?.isGM);
    return player?.[0] ?? game.user.id;
}

const last = new Map();

export const Trail = {
    registerHooks() {
        Hooks.on("updateToken", async (token, changes) => {
            if (game.users?.activeGM?.id !== game.user?.id) return;
            const was = last.get(token.uuid);
            last.set(token.uuid, { x: token._source.x, y: token._source.y });
            if (!("x" in changes || "y" in changes)) return;
            const trail = trailOf(token.actor);
            const from = token.movement?.origin ?? was;
            if (!trail || !from) return;
            const grid = token.parent.grid.size;
            const size = grid * 0.6;
            await token.parent.createEmbeddedDocuments("Drawing", [{
                x: from.x + (token.width * grid - size) / 2,
                y: from.y + (token.height * grid - size) / 2,
                elevation: token.elevation ?? 0,
                shape: { type: "e", width: size, height: size },
                fillType: CONST.DRAWING_FILL_TYPES.SOLID,
                fillColor: trail.color || "#9fd8ff",
                fillAlpha: 0.35,
                strokeWidth: 0,
                hidden: !trail.visible,
                author: authorOf(token.actor),
                flags: { [LIB_ID]: { [FLAG]: { expiresAt: game.time.worldTime + (Number(trail.fades) || 600) } } },
            }]);
        });
        Hooks.on("updateWorldTime", () => Trail.sweep());
    },

    async sweep() {
        if (game.users?.activeGM?.id !== game.user?.id) return;
        for (const scene of game.scenes) {
            const ids = faded(scene.drawings.contents, game.time.worldTime).map((drawing) => drawing.id);
            if (ids.length > 0) await scene.deleteEmbeddedDocuments("Drawing", ids);
        }
    },
};
