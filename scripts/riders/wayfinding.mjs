import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { playersOf } from "./message.mjs";

/**
 * Knowing the way back.
 *
 * *Know the Way*: "You immediately know which direction is north (if it exists at your current location), and you can
 * choose a location you were at within the last 24 hours and learn what direction it lies. Heightened (3rd) … within
 * the last week. Heightened (7th) … regardless of how long ago you were there."
 *
 * Every creature's moves are kept as places it has been: a point each time it stands 30 feet or more from the last one
 * kept, or arrives on another scene, the last 300 of them, each named for the nearest map note within 60 feet. `{ type:
 * "know-way", window }` whispers the caster where north is — up the map, or as the scene's `north` flag (degrees from
 * up, clockwise) says — and a button for each place kept within the rank's `window` (days; `"all"` for ever). Clicked,
 * it says which way that place lies: by compass on this scene; on another, by the scenes' `at` flags, or not at all.
 */

const FLAG = "visits";
const KEEP = 300;
const COMPASS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
const WORDS = { east: "Influence.East", southeast: "Influence.Southeast", south: "Influence.South", southwest: "Influence.Southwest", west: "Influence.West", northwest: "Influence.Northwest", north: "Influence.North", northeast: "Influence.Northeast" };

/** The compass point of a bearing, in degrees clockwise from north. */
export function pointOf(bearing) {
    return COMPASS[((Math.round((((bearing % 360) + 360) % 360) / 45)) % 8)];
}

/** The bearing from one map point to another, clockwise from up, turned by where the scene says north is. */
export function bearing(from, to, north = 0) {
    const up = (Math.atan2(to.x - from.x, -(to.y - from.y)) * 180) / Math.PI;
    return up - (Number(north) || 0);
}

/** A visit log with one more point, if it is far enough from the last, kept to its newest `KEEP`. */
export function logged(log, point, minPixels) {
    const last = log.at(-1);
    if (last && last.scene === point.scene && Math.hypot(point.x - last.x, point.y - last.y) < minPixels) return log;
    return [...log, point].slice(-KEEP);
}

/** The places kept within a window of days of now, newest first, one per name. */
export function placesWithin(log, now, days) {
    const since = days === "all" ? -Infinity : now - (Number(days) || 1) * 86400;
    const seen = new Set();
    return [...log].reverse().filter((p) => p.t >= since && !seen.has(p.label) && seen.add(p.label));
}

function labelFor(scene, point) {
    const reach = (scene.grid.size * 60) / (scene.grid.distance || 5);
    const note = scene.notes.contents
        .map((n) => ({ n, d: Math.hypot(n.x - point.x, n.y - point.y) }))
        .filter(({ d }) => d <= reach).sort((a, b) => a.d - b.d)[0]?.n;
    const name = note?.label || note?.entry?.name;
    return name ? `${scene.name}: ${name}` : t("Wayfinding.Square", { scene: scene.name, x: Math.round(point.x / scene.grid.size), y: Math.round(point.y / scene.grid.size) });
}

export async function knowTheWay(rider, context, rank = 1) {
    const caster = context.originActor;
    const scene = canvas?.scene;
    if (!caster || !scene) return;
    const window = Object.entries(rider.apply.window ?? { 1: 1 }).filter(([at]) => rank >= Number(at)).sort((a, b) => Number(b[0]) - Number(a[0]))[0]?.[1] ?? 1;
    const north = scene.flags?.[LIB_ID]?.north;
    const places = placesWithin(caster.getFlag(LIB_ID, FLAG) ?? [], game.time.worldTime, window).slice(0, 12);
    const buttons = places.map((p, i) => `<button type="button" data-action="isaacs-automation-way" data-index="${i}">${foundry.utils.escapeHTML(p.label)}</button>`);
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: caster }),
        whisper: playersOf(caster),
        flavor: context.item?.name ?? "",
        content: `<p>${north === undefined ? t("Wayfinding.NorthUp") : t("Wayfinding.North", { degrees: north })}</p>`
            + (buttons.length ? `<p>${t("Wayfinding.Choose")}</p><div class="isaacs-automation-choice">${buttons.join(" ")}</div>` : `<p>${t("Wayfinding.Nowhere")}</p>`),
        flags: { [LIB_ID]: { wayfinding: { actorUuid: caster.uuid, places } } },
    });
}

export const Wayfinding = {
    registerHooks() {
        // Where each creature has been. Active GM only.
        Hooks.on("updateToken", async (token, change) => {
            if (game.users?.activeGM?.id !== game.user?.id || !("x" in change || "y" in change) || !token.actor) return;
            const scene = token.parent;
            const point = { scene: scene.id, x: token._source.x, y: token._source.y, t: game.time.worldTime };
            const before = token.actor.getFlag(LIB_ID, FLAG) ?? [];
            const after = logged(before, { ...point, label: labelFor(scene, point) }, (scene.grid.size * 30) / (scene.grid.distance || 5));
            if (after !== before) await token.actor.setFlag(LIB_ID, FLAG, after);
        });
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, "wayfinding");
            if (!spec) return;
            for (const button of html.querySelectorAll?.('[data-action="isaacs-automation-way"]') ?? []) {
                if (button.dataset.bound) continue;
                button.dataset.bound = "1";
                button.addEventListener("click", async () => {
                    const place = spec.places[Number(button.dataset.index)];
                    const actor = fromUuidSync(spec.actorUuid);
                    const here = actor?.getActiveTokens?.(true, true).find((token) => token.parent === canvas.scene);
                    if (!place || !here) return;
                    let said;
                    if (place.scene === canvas.scene.id) {
                        said = t("Wayfinding.Lies", { place: place.label, toward: t(WORDS[pointOf(bearing({ x: here._source.x, y: here._source.y }, place, canvas.scene.flags?.[LIB_ID]?.north))]) });
                    } else {
                        const a = canvas.scene.flags?.[LIB_ID]?.at, b = game.scenes.get(place.scene)?.flags?.[LIB_ID]?.at;
                        said = a && b ? t("Wayfinding.Lies", { place: place.label, toward: t(WORDS[pointOf(bearing({ x: a.x, y: -a.y }, { x: b.x, y: -b.y }))]) }) : t("Wayfinding.Elsewhere", { place: place.label });
                    }
                    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: playersOf(actor), content: `<p>${said}</p>` });
                });
            }
        });
    },
};
