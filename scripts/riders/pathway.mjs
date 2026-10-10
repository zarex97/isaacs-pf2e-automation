import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { nearestOpen } from "../targeting/pocket.mjs";
import { playersOf } from "./message.mjs";

/**
 * From one fire, or one tree, to another.
 *
 * *Fire's Pathway* / *Nature's Pathway*: "You step into a blazing fire [a living tree] … big enough for you to fit
 * inside and instantly teleport to any other … within 5 miles that also has a sufficiently large size. Once you enter
 * the first …, you instantly know the rough locations of other sufficiently large [ones] within range and can exit from
 * the original …, if you prefer. You can't carry extradimensional spaces with you; if you attempt to do so, the spell
 * fails. Heightened (6th) … 50 miles … (8th) … 500 miles … (9th) … anywhere on the same planet."
 *
 * `{ type: "pathway", feature, miles }` reads the board: a fire or a tree is a Region, Tile or Drawing whose name holds
 * the `feature` word. The caster must stand on or beside one; one carrying an item with the `extradimensional` trait
 * fails. The caster is whispered every other one in reach — on this scene by feet and compass, on another by miles, from
 * the scenes' `at: { x, y }` flags (in miles) — and one button each, the first one theirs to step back out of. `miles`
 * gives the reach by rank; a scene with no `at`, or on another `plane`, is reached only when the reach is `"planet"`.
 */

const FLAG = "pathway";
const COMPASS = ["east", "southeast", "south", "southwest", "west", "northwest", "north", "northeast"];
const WORDS = { east: "Influence.East", southeast: "Influence.Southeast", south: "Influence.South", southwest: "Influence.Southwest", west: "Influence.West", northwest: "Influence.Northwest", north: "Influence.North", northeast: "Influence.Northeast" };

/** The reach at a rank: the highest listed rank at or below it. */
export function reachAt(miles, rank) {
    const listed = Object.entries(miles ?? {}).map(([at, reach]) => [Number(at), reach]).filter(([at]) => rank >= at).sort((a, b) => b[0] - a[0]);
    return listed[0]?.[1] ?? 5;
}

/** Miles between two scenes that say where they are; null when either does not. */
export function milesBetween(a, b) {
    if (!a || !b || !Number.isFinite(a.x) || !Number.isFinite(b.x)) return null;
    return Math.hypot(a.x - b.x, a.y - b.y);
}

/** The fires or trees on a scene: their name, centre and square. */
function featuresOn(scene, word) {
    const test = new RegExp(word, "i");
    const out = [];
    for (const region of scene.regions) {
        const shape = region.shapes?.[0];
        if (!test.test(region.name ?? "") || !shape) continue;
        const w = shape.width ?? (shape.radius ?? 0) * 2, h = shape.height ?? (shape.radius ?? 0) * 2;
        const x = shape.type === "circle" ? shape.x - shape.radius : shape.x, y = shape.type === "circle" ? shape.y - shape.radius : shape.y;
        out.push({ name: region.name, x, y, w, h, uuid: region.uuid, scene });
    }
    for (const tile of scene.tiles) {
        const name = tile.name ?? tile.texture?.src?.split("/").pop() ?? "";
        if (test.test(name)) out.push({ name, x: tile.x, y: tile.y, w: tile.width, h: tile.height, uuid: tile.uuid, scene });
    }
    for (const drawing of scene.drawings) {
        if (test.test(drawing.text ?? "")) out.push({ name: drawing.text, x: drawing.x, y: drawing.y, w: drawing.shape?.width ?? 0, h: drawing.shape?.height ?? 0, uuid: drawing.uuid, scene });
    }
    return out;
}

const centreOf = (f) => ({ x: f.x + f.w / 2, y: f.y + f.h / 2 });

/** Is a token in or beside a feature's box? */
function besides(token, f, grid) {
    const box = { x: token._source.x, y: token._source.y, w: token.width * grid, h: token.height * grid };
    return box.x <= f.x + f.w + grid && f.x <= box.x + box.w + grid && box.y <= f.y + f.h + grid && f.y <= box.y + box.h + grid;
}

export async function offerPathway(rider, context, rank = 5) {
    const caster = context.originActor;
    const scene = canvas?.scene;
    const token = caster?.getActiveTokens?.(true, true).find((tk) => tk.parent === scene);
    const word = rider.apply.feature ?? "fire";
    if (!caster || !token) return;
    const grid = scene.grid.size;
    const here = featuresOn(scene, word).find((f) => besides(token, f, grid));
    if (!here) {
        context.notes.push(t("Pathway.None", { feature: word }));
        return;
    }
    // Carried: a physical item — a spell the caster knows is no space they hold.
    if (caster.items.some((item) => item.isOfType?.("physical") && (item.system?.traits?.value ?? []).includes("extradimensional"))) {
        context.notes.push(t("Pathway.Extradimensional"));
        return;
    }
    const reach = reachAt(rider.apply.miles, rank);
    const plane = (s) => s?.flags?.[LIB_ID]?.plane ?? null;
    const at = (s) => s?.flags?.[LIB_ID]?.at ?? null;
    const choices = [];
    for (const other of game.scenes) {
        if (plane(other) !== plane(scene)) continue;
        const miles = other === scene ? 0 : milesBetween(at(scene), at(other));
        if (other !== scene && reach !== "planet" && (miles === null || miles > Number(reach))) continue;
        for (const f of featuresOn(other, word)) {
            if (f.uuid === here.uuid) continue;
            const c = centreOf(f);
            const where = other === scene
                ? t("Pathway.Here", { feet: Math.round(canvas.grid.measurePath([token.object?.center ?? token, c]).distance), toward: t(WORDS[COMPASS[((Math.round(Math.atan2(c.y - (token.object?.center?.y ?? token.y), c.x - (token.object?.center?.x ?? token.x)) / (Math.PI / 4)) % 8) + 8) % 8]]) })
                : miles === null ? t("Pathway.Afar", { scene: other.name }) : t("Pathway.Miles", { scene: other.name, miles: Math.round(miles) });
            choices.push({ label: `${f.name} — ${where}`, uuid: f.uuid, scene: other.id, x: c.x, y: c.y });
        }
    }
    const back = { label: t("Pathway.Back", { name: here.name }), uuid: here.uuid, scene: scene.id, x: centreOf(here).x, y: centreOf(here).y };
    const buttons = [back, ...choices].map((c, i) => `<button type="button" data-action="isaacs-automation-pathway" data-index="${i}">${foundry.utils.escapeHTML(c.label)}</button>`);
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: caster }),
        whisper: playersOf(caster),
        flavor: context.item?.name ?? "",
        content: `<p>${t("Pathway.Known", { count: choices.length, feature: word })}</p><div class="isaacs-automation-choice">${buttons.join(" ")}</div>`,
        flags: { [LIB_ID]: { [FLAG]: { tokenUuid: token.uuid, choices: [back, ...choices] } } },
    });
}

/** Set a token down at a point, on its own scene or another. */
async function stepOut(token, choice) {
    const scene = game.scenes.get(choice.scene);
    if (!scene) return;
    const grid = scene.grid.size;
    const occupied = scene.tokens.filter((other) => other !== token).map((other) => ({ x: other._source.x, y: other._source.y }));
    const spot = nearestOpen({ x: Math.floor(choice.x / grid) * grid, y: Math.floor(choice.y / grid) * grid }, grid, occupied);
    if (scene === token.parent) return token.update(spot, { animate: false });
    await scene.createEmbeddedDocuments("Token", [{ ...token.toObject(), _id: undefined, x: spot.x, y: spot.y }]);
    await token.delete();
}

export const Pathway = {
    registerHooks() {
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, FLAG);
            if (!spec) return;
            for (const button of html.querySelectorAll?.('[data-action="isaacs-automation-pathway"]') ?? []) {
                if (button.dataset.bound) continue;
                button.dataset.bound = "1";
                if (spec.used) button.disabled = true;
                button.addEventListener("click", async () => {
                    if (flagOf(message, FLAG)?.used) return;
                    const token = fromUuidSync(spec.tokenUuid);
                    const choice = spec.choices[Number(button.dataset.index)];
                    if (!token || !choice) return;
                    await message.update({ [`flags.${LIB_ID}.${FLAG}.used`]: true });
                    await stepOut(token, choice);
                    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ token }), content: `<p>${t("Pathway.Out", { name: token.name, at: choice.label })}</p>` });
                });
            }
        });
    },
};
