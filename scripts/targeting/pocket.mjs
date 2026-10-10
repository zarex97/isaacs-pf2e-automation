import { t } from "../i18n.mjs";
import { flagOf } from "../lib/flags.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A room that is not on the map.
 *
 * *Liminal Doorway*: "You draw a chalk doorway on an unbroken surface, which opens into an extradimensional space. Any
 * creature treating the drawing as an actual door can Interact to touch the doorknob and pass through. The warped,
 * chalk-drawn room beyond the door is 20 feet in width, depth, and height … If the drawing is scrubbed away, the
 * underlying surface is broken, or a creature attempts to enter the space that would put it over capacity, the space
 * begins to collapse. The space ejects one creature at random each round, depositing it on the nearest open ground,
 * until all creatures are returned outside."
 *
 * `{ type: "pocket", feet, duration }` is the room as Foundry already has the parts for it: a small Scene of its own,
 * and a doorway Region on the caster's scene beside them. Each side carries Foundry's own *Teleport Token* behavior to
 * the other, so stepping onto the door is passing through it, both ways, with no new code in the move. The door keeps
 * the room's clock; when the door goes — its hours up, or deleted because it was scrubbed away — or a creature steps in
 * past the room's capacity (one creature a square), the room collapses: one creature at random is put back on the
 * nearest open square to the door each round of the world clock, and the room is deleted once empty. Active GM only.
 *
 * *Rope Trick*: "The space holds up to eight Medium creatures and their gear. A Large creature counts as two Medium
 * creatures, a Huge creature counts as four Medium creatures, and a Gargantuan creature fills the space on its own … The
 * rope can't be removed or hidden, though it can be detached … by … critically succeeding at an Athletics check against
 * the spell's DC … the space begins to unravel. It disappears in 1d4 rounds, depositing the creatures within safely on
 * the ground below." `capacity` sets the room's hold, counted by size (`weighted`); `collapse: "all"` empties it at once
 * after `delay` rounds rather than one a round; `detach` posts a card whose Athletics check, critically succeeding
 * against the spell's DC, starts the collapse; `door` names the square on the board.
 */

const FLAG = "pocket";
const ROUND = 6;

const isGM = () => game.users?.activeGM?.id === game.user?.id;

/** The spell's DC, from the spellcasting entry that cast it. */
function castDc(context) {
    const item = context.item ?? context.riderItem;
    return item?.spellcasting?.statistic?.dc?.value ?? null;
}

/** A square Region on a scene, one grid square across, with the behaviors given. */
function squareRegion(name, x, y, grid, behaviors, flags) {
    return { name, color: "#e8e1c9", visibility: CONST.REGION_VISIBILITY.ALWAYS, shapes: [{ type: "rectangle", x, y, width: grid, height: grid, rotation: 0, hole: false }], behaviors, flags };
}

/** The open squares nearest a point, nearest first, among those no token stands on. */
export function nearestOpen(point, grid, occupied) {
    const rings = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
    return rings.map(([dx, dy]) => ({ x: point.x + dx * grid, y: point.y + dy * grid })).find((p) => !occupied.some((o) => o.x === p.x && o.y === p.y)) ?? point;
}

/** What a creature counts for in a room counted by size: a Large two, a Huge four, a Gargantuan eight. */
export function sizeWeight(size) {
    return { lg: 2, huge: 4, grg: 8 }[size] ?? 1;
}

/** How many creatures the room holds: one to a square. */
export function capacityOf(feet, distance) {
    const side = Math.max(1, Math.round((Number(feet) || 20) / (Number(distance) || 5)));
    return side * side;
}

export const Pocket = {
    async open(rider, context) {
        const scene = canvas?.scene;
        const caster = context.originActor;
        const casterToken = (context.originToken?.parent === scene ? context.originToken : null) ?? caster?.getActiveTokens?.(true, true).find((token) => token.parent === scene);
        if (!scene || !casterToken) return;
        const grid = scene.grid.size;
        const feet = Number(rider.apply.feet) || 20;
        const side = Math.max(1, Math.round(feet / (scene.grid.distance || 5)));
        const seconds = (Number(rider.duration?.value ?? rider.apply.duration?.value) || 8) * ({ minutes: 60, hours: 3600, days: 86400 }[rider.duration?.unit ?? rider.apply.duration?.unit ?? "hours"] ?? 3600);
        const name = context.item?.name ?? t("Pocket.Room");

        const room = await Scene.create({
            name: t("Pocket.SceneName", { name, actor: caster.name }),
            width: side * grid, height: side * grid, padding: 0,
            grid: { type: CONST.GRID_TYPES.SQUARE, size: grid, distance: scene.grid.distance, units: scene.grid.units },
            backgroundColor: "#d9d4c5", navigation: false, tokenVision: false,
            ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
            flags: { [LIB_ID]: { [FLAG]: { room: true } } },
        });
        const at = { x: casterToken._source.x, y: casterToken._source.y };
        const occupied = scene.tokens.map((token) => ({ x: token._source.x, y: token._source.y }));
        const doorAt = nearestOpen({ x: at.x + grid, y: at.y }, grid, occupied);
        // The table may hand the key in already localized, which `format` would then not fill.
        const doorName = rider.apply.door ? game.i18n.localize(rider.apply.door).replace("{name}", name) : t("Pocket.Door", { name });
        const capacity = Number(rider.apply.capacity) || capacityOf(feet, scene.grid.distance);
        const [door] = await scene.createEmbeddedDocuments("Region", [squareRegion(doorName, doorAt.x, doorAt.y, grid, [], {
            [LIB_ID]: { lingering: { expiresAt: game.time.worldTime + seconds, name, originUuid: caster.uuid }, [FLAG]: { roomUuid: room.uuid, capacity, weighted: !!rider.apply.weighted } },
        })]);
        const [exit] = await room.createEmbeddedDocuments("Region", [squareRegion(t("Pocket.Exit"), 0, (side - 1) * grid, grid,
            [{ type: "teleportToken", name: t("Pocket.Exit"), system: { destinations: [door.uuid], placement: "center" } }],
            { [LIB_ID]: { [FLAG]: { doorUuid: door.uuid } } })]);
        await door.createEmbeddedDocuments("RegionBehavior", [{ type: "teleportToken", name: doorName, system: { destinations: [exit.uuid], placement: "random" } }]);
        await room.setFlag(LIB_ID, FLAG, { room: true, doorUuid: door.uuid, sceneId: scene.id, door: doorAt, all: rider.apply.collapse === "all", delay: rider.apply.delay ?? null });
        context.notes.push(t("Pocket.Opened", { name, feet }));
        if (rider.apply.detach) {
            const dc = Number(context.dc) || Number(castDc(context)) || 20;
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: caster }),
                flavor: name,
                content: `<p>${t("Pocket.Detach", { dc })}</p><div class="isaacs-automation-choice"><button type="button" data-action="isaacs-automation-detach">${t("Pocket.Pull")}</button></div>`,
                flags: { [LIB_ID]: { [FLAG]: { detach: { roomUuid: room.uuid, dc } } } },
            });
        }
    },

    /** The room is collapsing: put one creature out at random, and delete the room once nobody is left. */
    async ejectOne(room) {
        const spec = room?.getFlag(LIB_ID, FLAG);
        if (!spec?.collapsing) return;
        const inside = room.tokens.contents;
        if (inside.length === 0) {
            await room.delete();
            return;
        }
        const token = inside[Math.floor(Math.random() * inside.length)];
        const outside = game.scenes.get(spec.sceneId);
        if (outside) {
            const grid = outside.grid.size;
            const spot = nearestOpen(spec.door, grid, outside.tokens.map((other) => ({ x: other._source.x, y: other._source.y })));
            await outside.createEmbeddedDocuments("Token", [{ ...token.toObject(), _id: undefined, x: spot.x, y: spot.y }]);
        }
        await token.delete();
        await ChatMessage.create({ content: `<p>${t("Pocket.Ejected", { token: token.name })}</p>` });
        if (room.tokens.size === 0) await room.delete();
    },

    async collapse(room, why) {
        if (!room || room.getFlag(LIB_ID, FLAG)?.collapsing) return;
        const spec = room.getFlag(LIB_ID, FLAG);
        // Everyone at once, after a few rounds — *Rope Trick*'s 1d4.
        if (spec.all) {
            const rounds = spec.delay ? (await new Roll(String(spec.delay)).evaluate()).total : 0;
            await room.setFlag(LIB_ID, FLAG, { ...spec, collapsing: true, dueAt: game.time.worldTime + rounds * ROUND });
            await ChatMessage.create({ content: `<p>${t("Pocket.Unravels", { name: room.name, why, rounds })}</p>` });
            if (rounds <= 0) await Pocket.ejectAll(room);
            return;
        }
        await room.setFlag(LIB_ID, FLAG, { ...spec, collapsing: true, lastEject: game.time.worldTime });
        await ChatMessage.create({ content: `<p>${t("Pocket.Collapses", { name: room.name, why })}</p>` });
        await Pocket.ejectOne(room);
    },

    /** Everyone inside set down on the ground by the door, and the room gone. */
    async ejectAll(room) {
        const spec = room?.getFlag(LIB_ID, FLAG);
        if (!spec?.collapsing) return;
        const outside = game.scenes.get(spec.sceneId);
        for (const token of room.tokens.contents) {
            if (outside) {
                const spot = nearestOpen(spec.door, outside.grid.size, outside.tokens.map((other) => ({ x: other._source.x, y: other._source.y })));
                await outside.createEmbeddedDocuments("Token", [{ ...token.toObject(), _id: undefined, x: spot.x, y: spot.y, elevation: 0 }]);
            }
            await ChatMessage.create({ content: `<p>${t("Pocket.Ejected", { token: token.name })}</p>` });
        }
        await room.delete();
        // The space is gone, and the rope that led to it with it.
        const door = spec.doorUuid ? fromUuidSync(spec.doorUuid) : null;
        if (door) await door.delete().catch(() => {});
    },

    registerHooks() {
        // *Rope Trick*'s rope pulled free: an Athletics check against the spell's DC, a critical success.
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, FLAG)?.detach;
            const button = spec && html?.querySelector?.('[data-action="isaacs-automation-detach"]');
            if (!button || button.dataset.bound) return;
            button.dataset.bound = "1";
            button.addEventListener("click", async () => {
                const actor = canvas.tokens?.controlled?.[0]?.actor ?? game.user.character;
                if (!actor) return ui.notifications.warn(t("Pocket.Select"));
                const roll = await actor.skills?.athletics?.roll({ dc: { value: spec.dc }, skipDialog: true, label: t("Pocket.Pull") });
                if (roll?.degreeOfSuccess !== 3) return;
                await ChatMessage.create({ content: `<p>${t("Pocket.Detached", { actor: actor.name })}</p>`, flags: { [LIB_ID]: { [FLAG]: { detached: spec.roomUuid } } } });
            });
        });
        Hooks.on("createChatMessage", async (message) => {
            if (!isGM()) return;
            const roomUuid = flagOf(message, FLAG)?.detached;
            const room = roomUuid ? fromUuidSync(roomUuid) : null;
            if (room) await Pocket.collapse(room, t("Pocket.RopeGone"));
        });
        // The door scrubbed away, or its hours up: the room begins to collapse.
        Hooks.on("deleteRegion", async (region) => {
            if (!isGM()) return;
            const roomUuid = flagOf(region, FLAG)?.roomUuid;
            const room = roomUuid ? fromUuidSync(roomUuid) : null;
            if (room) await Pocket.collapse(room, t("Pocket.DoorGone"));
        });
        // One past the room's capacity steps in: it collapses.
        Hooks.on("createToken", async (token) => {
            if (!isGM()) return;
            const room = token.parent;
            const spec = room?.getFlag(LIB_ID, FLAG);
            if (!spec?.room || spec.collapsing) return;
            const door = fromUuidSync(spec.doorUuid);
            const capacity = Number(flagOf(door, FLAG)?.capacity) || capacityOf(20, room.grid.distance);
            const filled = flagOf(door, FLAG)?.weighted
                ? room.tokens.contents.reduce((sum, inside) => sum + sizeWeight(inside.actor?.size), 0)
                : room.tokens.size;
            if (filled > capacity) await Pocket.collapse(room, t("Pocket.Overfull"));
        });
        // A round of the world clock puts the next creature out.
        Hooks.on("updateWorldTime", async () => {
            if (!isGM()) return;
            for (const room of game.scenes.filter((scene) => scene.getFlag(LIB_ID, FLAG)?.collapsing)) {
                const spec = room.getFlag(LIB_ID, FLAG);
                if (spec.all) {
                    if (game.time.worldTime >= (Number(spec.dueAt) || 0)) await Pocket.ejectAll(room);
                    continue;
                }
                const due = Math.floor((game.time.worldTime - (Number(spec.lastEject) || 0)) / ROUND);
                for (let i = 0; i < due && room.tokens.size > 0; i++) await Pocket.ejectOne(room);
                if (game.scenes.has(room.id)) await room.setFlag(LIB_ID, FLAG, { ...spec, lastEject: game.time.worldTime });
            }
        });
    },
};
