import { CastPipeline } from "../cast-pipeline.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { Extensions } from "./extensions.mjs";
import { occupants } from "./move-caster.mjs";

/**
 * A creature summoned to a square.
 *
 * *Summon Animal*: "You summon a creature that has the animal trait and whose level is –1 to fight for you.
 * Heightened As listed in the summon trait." The summon trait: "The spell's rank determines the maximum level of the
 * creature you can summon … it gains the minion trait … If you summon a creature, it appears in an open space within
 * the spell's range." `areaTargeting.summon: { traits }` makes the spell's placement a square to summon into; after
 * the cast the caster picks a common creature with those traits, at most the rank's level, from pf2e's Monster Cores;
 * the active GM puts it there, a minion of the caster, owned as the caster is. The caster carries an effect for it,
 * Sustained up to a minute: the effect gone takes the creature away, and the creature gone ends the effect.
 */

const FLAG = "summoned";
const pending = new Map();

/** The summon trait's table: the most a spell of this rank can summon. */
export const SUMMON_LEVELS = { 1: -1, 2: 1, 3: 2, 4: 3, 5: 5, 6: 7, 7: 9, 8: 11, 9: 13, 10: 15 };
export const SUMMON_PACKS = ["pf2e.pathfinder-monster-core", "pf2e.pathfinder-monster-core-2"];

export function summonLevel(rank) {
    return SUMMON_LEVELS[Math.min(10, Math.max(1, Number(rank) || 1))];
}

/** May a compendium entry be summoned: an NPC, common, with every trait asked, no higher than the level allowed? */
export function eligible(entry, { traits = [], maxLevel }) {
    if (entry?.type !== "npc") return false;
    const system = entry.system ?? {};
    const level = Number(system.details?.level?.value);
    const own = system.traits?.value ?? [];
    return Number.isFinite(level) && level <= maxLevel && (system.traits?.rarity ?? "common") === "common" && traits.every((trait) => own.includes(trait));
}

/** The creatures a spell of this rank can summon, highest level first. */
async function candidates(spec, rank) {
    const maxLevel = summonLevel(rank);
    const out = [];
    for (const id of spec.packs ?? SUMMON_PACKS) {
        const pack = game.packs.get(id);
        if (!pack) continue;
        const index = await pack.getIndex({ fields: ["system.details.level.value", "system.traits.value", "system.traits.rarity"] });
        for (const entry of index) {
            if (eligible(entry, { traits: spec.traits ?? [], maxLevel })) out.push({ uuid: entry.uuid, name: entry.name, level: Number(entry.system.details.level.value) });
        }
    }
    return out.sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
}

async function choose(spell, list) {
    if (list.length === 0) {
        ui.notifications.warn(t("Summon.None", { name: spell.name }));
        return null;
    }
    const options = list.map((c) => `<option value="${c.uuid}">${foundry.utils.escapeHTML(c.name)} (${c.level})</option>`).join("");
    return foundry.applications.api.DialogV2.prompt({
        window: { title: spell.name },
        content: `<p>${t("Summon.Choose", { level: list[0] ? summonLevel(spell.rank) : "" })}</p><select name="uuid">${options}</select>`,
        ok: { label: t("Summon.Ok"), callback: (_event, button) => button.form.elements.uuid.value },
        rejectClose: false,
    });
}

async function summonedFolder() {
    const name = t("Summon.Folder");
    return game.folders.find((f) => f.type === "Actor" && f.name === name) ?? Folder.create({ name, type: "Actor" });
}

export const Summon = {
    register() {
        Extensions.registerAimed("a summoned creature's square", 55, (config, regions, originToken) => Summon.aimed(config, regions, originToken));
        CastPipeline.after("a creature summoned", 61, (cast, spell) => Summon.after(spell ?? cast));
    },

    async aimed(config, regions, originToken) {
        if (!config.summon || !originToken) return undefined;
        const shape = regions.at(-1)?.shapes?.[0];
        if (!shape) return false;
        const grid = canvas.grid.size;
        // On the grid: the square the placement mostly covers.
        const snap = (v) => Math.round(v / grid) * grid;
        const rect = { x: snap(shape.x), y: snap(shape.y), width: shape.width ?? grid, height: shape.height ?? grid };
        const there = occupants(rect, canvas.tokens.placeables, null);
        if (there.length > 0) {
            ui.notifications.warn(t("Summon.Occupied", { names: there.map((token) => token.document.name).join(", ") }));
            return false;
        }
        pending.set((config.item.original ?? config.item).uuid, { sceneId: canvas.scene.id, x: rect.x, y: rect.y, spec: config.summon, casterUuid: originToken.actor?.uuid ?? null });
        canvas.tokens.setTargets([]);
        return true;
    },

    async after(spell) {
        const key = (spell?.original ?? spell)?.uuid;
        const place = key ? pending.get(key) : null;
        if (!place) return;
        pending.delete(key);
        const actorUuid = await choose(spell, await candidates(place.spec, spell.rank));
        if (!actorUuid) return;
        const payload = { action: "summon", spellUuid: key, actorUuid, sceneId: place.sceneId, x: place.x, y: place.y, casterUuid: place.casterUuid };
        if (game.user.isGM) return Summon.create(payload);
        const { Relay } = await import("../riders/relay.mjs");
        return Relay.request(payload);
    },

    /** Put the creature on the scene, and the caster's effect for it. Active GM. */
    async create({ spellUuid, actorUuid, sceneId, x, y, casterUuid }) {
        const scene = game.scenes.get(sceneId);
        const source = await fromUuid(actorUuid);
        const caster = casterUuid ? await fromUuid(casterUuid) : null;
        const spell = spellUuid ? await fromUuid(spellUuid) : null;
        if (!scene || !source || !caster) return null;
        const folder = await summonedFolder();
        const actor = game.actors.find((a) => a._stats?.compendiumSource === actorUuid && a.folder?.id === folder?.id)
            ?? await Actor.implementation.create({ ...source.toObject(), folder: folder?.id ?? null, ownership: { ...caster.ownership } });
        const traits = [...new Set([...(actor.system.traits?.value ?? []), "minion", "summoned"])];
        const casterToken = caster.getActiveTokens?.(true, true)?.[0] ?? null;
        const data = (await actor.getTokenDocument({ x, y, actorLink: false, disposition: casterToken?.disposition ?? CONST.TOKEN_DISPOSITIONS.FRIENDLY })).toObject();
        data.delta = foundry.utils.mergeObject(data.delta ?? {}, { system: { traits: { value: traits } }, ownership: { ...caster.ownership } });
        data.flags = foundry.utils.mergeObject(data.flags ?? {}, { [LIB_ID]: { [FLAG]: { casterUuid: caster.uuid, spellUuid } } });
        const [token] = await scene.createEmbeddedDocuments("Token", [data]);
        if (!token) return null;
        await caster.createEmbeddedDocuments("Item", [{
            type: "effect",
            name: t("Summon.Effect", { name: token.name, spell: spell?.name ?? "" }),
            img: actor.img,
            system: {
                duration: { value: 1, unit: "minutes", expiry: "turn-end", sustained: true },
                start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                tokenIcon: { show: true },
                rules: [],
            },
            flags: { [LIB_ID]: { summonToken: token.uuid, sustainedBy: spell ? { origin: caster.uuid, spell: spellUuid, repeat: null } : null } },
        }]);
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p>${t("Summon.Arrives", { caster: caster.name, name: token.name })}</p>` });
        return token;
    },

    /** The caster's effect gone takes the creature; the creature gone ends the effect. Active GM only. */
    registerHooks() {
        Hooks.on("deleteItem", async (item) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            const uuid = item.flags?.[LIB_ID]?.summonToken;
            const token = uuid ? fromUuidSync(uuid) : null;
            if (token?.parent?.tokens?.has(token.id)) {
                await token.delete().catch(() => {});
                await ChatMessage.create({ content: `<p>${t("Summon.Gone", { name: token.name })}</p>` });
            }
        });
        Hooks.on("deleteToken", async (token) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            const spec = token.flags?.[LIB_ID]?.[FLAG];
            const caster = spec?.casterUuid ? fromUuidSync(spec.casterUuid) : null;
            const effects = (caster?.itemTypes?.effect ?? []).filter((e) => e.flags?.[LIB_ID]?.summonToken === token.uuid);
            if (effects.length > 0) await caster.deleteEmbeddedDocuments("Item", effects.map((e) => e.id)).catch(() => {});
        });
    },
};

/** Did this caster summon this token? *Final Sacrifice*: "Target 1 minion you summoned". */
export function summonedBy(token, caster) {
    const spec = (token?.document ?? token)?.flags?.[LIB_ID]?.[FLAG];
    return !!spec && !!caster && spec.casterUuid === caster.uuid;
}
