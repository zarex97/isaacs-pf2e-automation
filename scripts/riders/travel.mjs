import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Where a creature has been, and a vision of it.
 *
 * *Fate's Travels*: "You get a vision of the creature when it was alive, and its last 10 minutes of travel. This vision
 * gives you a clear impression of the route it took and locations it visited … This information is enough to
 * automatically succeed at Tracking the creature over that distance. Heightened (6th) Your vision covers the creature's
 * last hour of travel, and you gain an impression of the hazards, creature types, and number of creatures it
 * encountered along the way, as well as a clear impression of how it died."
 *
 * Foundry keeps no history of where a token went outside an encounter, so this module keeps one: each move a token
 * makes writes where it set out from, and when, into the same update (`travel`, the last hour). `{ type:
 * "fates-travels" }` reads the corpse's: the route is drawn for the caster's players — a Drawing they own, hidden
 * from everyone else — and its length and turns whispered; an effect lets the caster's Survival to Track succeed. At
 * 6th rank the vision reaches an hour back and also names the creatures that stood along the way, by kind and number,
 * and the last damage that landed on it.
 */

const FLAG = "travel";
const KEEP = 3600;
const LIMIT = 200;

/** The log with one more point, keeping the last hour and at most 200 entries. */
export function logged(log, point, now) {
    return [...(log ?? []), point].filter((entry) => now - entry.t <= KEEP).slice(-LIMIT);
}

/** The points of the log within `seconds` of now, oldest first, with where the creature ended. */
export function route(log, end, now, seconds) {
    return [...(log ?? []).filter((entry) => now - entry.t <= seconds), { ...end, t: now }];
}

/** How far a route goes, in grid units. */
export function lengthOf(points, perUnit) {
    let total = 0;
    for (let i = 1; i < points.length; i++) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    return Math.round(total / perUnit);
}

export const Travel = {
    registerHooks() {
        // The move and the log in one write, on the client that moved it.
        Hooks.on("preUpdateToken", (token, changes) => {
            if (!("x" in changes || "y" in changes)) return;
            const from = { x: token._source.x, y: token._source.y, t: game.time.worldTime };
            foundry.utils.setProperty(changes, `flags.${LIB_ID}.${FLAG}`, logged(token.flags?.[LIB_ID]?.[FLAG], from, game.time.worldTime));
        });
    },
};

export async function fatesTravels(_rider, context, rank = 3) {
    const corpse = context.target?.document ?? context.target;
    const caster = context.originActor;
    if (!corpse?.parent || !caster) return;
    const scene = corpse.parent;
    const grid = scene.grid.size;
    const perUnit = grid / (scene.grid.distance || 5);
    const seconds = rank >= 6 ? 3600 : 600;
    const now = game.time.worldTime;
    const half = (corpse.width * grid) / 2;
    const points = route(corpse.flags?.[LIB_ID]?.[FLAG], { x: corpse._source.x, y: corpse._source.y }, now, seconds).map((p) => ({ x: p.x + half, y: p.y + half }));
    const players = Object.entries(caster.ownership ?? {}).filter(([id, level]) => id !== "default" && level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER && !game.users.get(id)?.isGM).map(([id]) => id);
    const lines = [];
    if (points.length > 1) {
        const x0 = Math.min(...points.map((p) => p.x)), y0 = Math.min(...points.map((p) => p.y));
        await scene.createEmbeddedDocuments("Drawing", [{
            x: x0, y: y0, shape: { type: "p", points: points.flatMap((p) => [p.x - x0, p.y - y0]) },
            strokeWidth: 6, strokeColor: "#e0c060", strokeAlpha: 0.9, fillType: CONST.DRAWING_FILL_TYPES.NONE,
            hidden: true, author: players[0] ?? game.user.id,
            flags: { [LIB_ID]: { trail: { expiresAt: now + 3600 } } },
        }]);
        lines.push(t("Travel.Route", { name: corpse.name, feet: lengthOf(points, perUnit), turns: points.length - 1 }));
    } else {
        lines.push(t("Travel.Still", { name: corpse.name }));
    }
    if (rank >= 6) {
        const near = scene.tokens.filter((token) => token.id !== corpse.id && token.actor && points.some((p) => Math.hypot(token._source.x + half - p.x, token._source.y + half - p.y) <= 30 * perUnit));
        const kinds = {};
        for (const token of near) {
            const kind = token.actor.type === "hazard" ? t("Travel.Hazard") : (token.actor.system?.traits?.value?.[0] ?? token.actor.type);
            kinds[kind] = (kinds[kind] ?? 0) + 1;
        }
        lines.push(Object.keys(kinds).length ? t("Travel.Met", { list: Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(", ") }) : t("Travel.MetNone"));
        const death = game.messages.contents.findLast((m) => m.flags?.pf2e?.context?.type === "damage-taken" && (m.actor === corpse.actor || m.speaker?.token === corpse.id));
        lines.push(death ? t("Travel.Death", { how: (death.flavor || death.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) }) : t("Travel.DeathUnknown"));
    }
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: caster }),
        whisper: [...new Set([...players, ...ChatMessage.getWhisperRecipients("GM").map((u) => u.id)])],
        content: lines.map((line) => `<p>${line}</p>`).join(""),
    });
}
