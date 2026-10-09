import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Small magic done to things.
 *
 * *Quick Sort*: "You magically sort a group of objects into neat stacks or piles … into different piles depending on an
 * easily observed factor … Alternatively … into ordered stacks depending on a clearly indicated notation". `{ type:
 * "sort-items", flag, limit, limitAtRank }` sorts the target's inventory — loot standing unattended — by kind and look
 * (`look`), or by name (`notation`), as the cast chose: the first `limit` of them, more from a rank.
 *
 * *Shape Wood*: "You shape the wood into a rough shape of your choice … You cannot use this spell to enhance the value
 * of the wooden object". `{ type: "reshape", item, shape }` renames the item named in the cast's `item` field after its
 * `shape`, keeping its price.
 *
 * *Spontaneous Cartography*: "You concentrate on a blank piece of parchment in your possession and record the landscape
 * … The resulting map bears crude but recognizable symbols … but doesn't label them. Heightened (6th) … major landmarks
 * are labeled. A small star shows the spot where you are when the map is created." `{ type: "map" }` makes a journal
 * entry the caster's players own: the scene's own picture — or, with none, a snapshot of the board — and from 6th rank the scene's map notes by name and where
 * the caster stood. The parchment is used up.
 *
 * *Glamorize*: "While the spell is active, you can Sustain it to make further adjustments." `{ type: "adjust" }`, on the
 * action an effect gives its caster (`originAction`), asks what changes now and writes it on the effect's name.
 */

const MAPS = "isaacs-pf2e-automation-maps";

/** The scene as a picture: its own background, else a snapshot of the board saved beside the world's files, else its thumbnail. */
async function pictureOf(scene) {
    if (scene.background?.src) return scene.background.src;
    try {
        const { thumb } = await scene.createThumbnail({ width: 1024, height: 1024, format: "image/webp" });
        const blob = await (await fetch(thumb)).blob();
        const FilePicker = foundry.applications.apps.FilePicker.implementation;
        await FilePicker.createDirectory("data", MAPS).catch(() => null);
        const saved = await FilePicker.upload("data", MAPS, new File([blob], `${scene.id}-${Date.now()}.webp`, { type: "image/webp" }), {}, { notify: false });
        if (saved?.path) return saved.path;
    } catch { /* no snapshot: fall back */ }
    return scene.thumb || "icons/svg/book.svg";
}

/** The order a sort leaves items in: by kind then picture then name, or by name alone. */
export function sortedIds(items, by, limit) {
    const key = (item) => (by === "notation" ? [item.name] : [item.type, item.img ?? "", item.name]);
    const chosen = items.slice(0, Number(limit) || items.length);
    return [...chosen].sort((a, b) => key(a).join("\u0000").localeCompare(key(b).join("\u0000"))).map((item) => item.id);
}

export async function sortItems(rider, context, chosen = {}, rank = 1) {
    const actor = context.actor;
    if (!actor) return;
    const physical = actor.items.filter((item) => typeof item.isOfType === "function" ? item.isOfType("physical") : true);
    const extra = Object.entries(rider.apply.limitAtRank ?? {}).filter(([at]) => rank >= Number(at)).map(([, n]) => Number(n));
    const limit = Math.max(Number(rider.apply.limit) || 200, ...extra);
    const ids = sortedIds(physical, chosen[rider.apply.flag ?? "by"], limit);
    await actor.updateEmbeddedDocuments("Item", ids.map((id, i) => ({ _id: id, sort: (i + 1) * 100 })));
    context.notes.push(t("Handiwork.Sorted", { count: ids.length, name: actor.name }));
}

export async function reshapeItem(rider, context, chosen = {}) {
    const actor = context.originActor;
    const named = String(chosen[rider.apply.item ?? "item"] ?? "").trim().toLowerCase();
    const shape = String(chosen[rider.apply.shape ?? "shape"] ?? "").trim();
    const item = actor?.items?.find((i) => i.name.toLowerCase() === named);
    if (!item || !shape) {
        context.notes.push(t("Handiwork.NoItem", { item: named }));
        return;
    }
    await item.update({ name: shape });
    context.notes.push(t("Handiwork.Shaped", { from: named, to: shape }));
}

export async function drawMap(_rider, context, rank = 3) {
    const actor = context.originActor;
    const parchment = actor?.items?.find((i) => /parchment|paper/i.test(i.name));
    const scene = canvas?.scene;
    if (!actor || !scene) return;
    if (!parchment) {
        context.notes.push(t("Handiwork.NoParchment", { actor: actor.name }));
        return;
    }
    const players = Object.entries(actor.ownership ?? {}).filter(([id, level]) => id !== "default" && level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER).map(([id]) => id);
    const pages = [{ name: scene.name, type: "image", src: await pictureOf(scene) }];
    if (rank >= 6) {
        const at = actor.getActiveTokens?.(true, true).find((token) => token.parent === scene);
        const landmarks = scene.notes.map((note) => note.label || note.entry?.name).filter(Boolean);
        pages.push({ name: t("Handiwork.Legend"), type: "text", text: { content: `<ul>${landmarks.map((l) => `<li>${foundry.utils.escapeHTML(l)}</li>`).join("")}</ul>`
            + (at ? `<p>★ ${t("Handiwork.Here", { x: Math.round(at._source.x / scene.grid.size), y: Math.round(at._source.y / scene.grid.size) })}</p>` : "") } });
    }
    await JournalEntry.create({ name: t("Handiwork.MapName", { scene: scene.name }), pages, ownership: Object.fromEntries(players.map((id) => [id, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER])) });
    if ((parchment.system?.quantity ?? 1) > 1) await parchment.update({ "system.quantity": parchment.system.quantity - 1 });
    else await parchment.delete();
    context.notes.push(t("Handiwork.Mapped", { scene: scene.name }));
}

export async function adjustEffect(_rider, context) {
    const uuid = context.item?.flags?.[LIB_ID]?.originAction?.effectUuid;
    const effect = uuid ? await fromUuid(uuid).catch(() => null) : null;
    if (!effect) return;
    const data = await foundry.applications.api.DialogV2.input({
        window: { title: effect.name },
        content: `<p>${t("Handiwork.Adjust")}</p><div class="form-group"><input type="text" name="text"></div>`,
        rejectClose: false,
    });
    const words = String(data?.text ?? "").trim();
    if (!words) return;
    const base = effect.name.split(" — ")[0];
    await effect.update({ name: `${base} — ${words}` });
    context.notes.push(t("Handiwork.Adjusted", { name: base, words }));
}
