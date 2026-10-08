import { CastPipeline } from "../cast-pipeline.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { Extensions } from "./extensions.mjs";
import { occupants } from "./move-caster.mjs";

/**
 * An orb of light.
 *
 * *Light*: "You create an orb of light that sheds bright light in a 20-foot radius (and dim light for the next 20 feet)
 * in a color you choose. If you create the light in the same space as a willing creature, you can attach the light to
 * the creature, causing it to float near that creature as it moves. You can Sustain the spell to move the light up to
 * 60 feet; you can attach or detach it from a creature as part of this movement. You can Dismiss the spell. If you
 * Cast the Spell while you already have four light spells active, you must choose one of the existing spells to end.
 * Heightened (4th) The orb sheds light in a 60-foot radius (and dim light for the next 60 feet)."
 *
 * `areaTargeting.lightOrb: { bright, dim, atRank: { <rank>: { bright, dim } }, max }` makes the placement a square:
 * after the cast the caster picks a colour; on a creature, the light is an effect on it (pf2e's `TokenLight`), so it
 * goes where the token goes; on an empty square, an ambient light there. The caster carries an effect for each orb,
 * lasting until their daily preparations, with a *Dismiss* and a *Move the Light* — aimed again, up to `move` feet from
 * where the light is, onto a creature to attach it or an empty square to set it down. A fifth asks which to end.
 */

const FLAG = "lightOrb";
const pending = new Map();

/** The light at this rank: the authored radii, or a rank's own. */
export function orbRadii(spec, rank) {
    let out = { bright: Number(spec?.bright) || 20, dim: Number(spec?.dim) || 40 };
    for (const [at, radii] of Object.entries(spec?.atRank ?? {})) if ((Number(rank) || 1) >= Number(at)) out = { ...out, ...radii };
    return out;
}

function snapped(shape) {
    const grid = canvas.grid.size;
    const snap = (v) => Math.round(v / grid) * grid;
    return { x: snap(shape.x), y: snap(shape.y), width: grid, height: grid };
}

async function chooseColour(spell) {
    return foundry.applications.api.DialogV2.prompt({
        window: { title: spell.name },
        content: `<p>${t("LightOrb.Colour")}</p><input type="color" name="colour" value="#e7f3f1">`,
        ok: { label: t("LightOrb.Ok"), callback: (_event, button) => button.form.elements.colour.value },
        rejectClose: false,
    });
}

async function relay(payload) {
    if (game.user.isGM) return LightOrb.handle(payload);
    const { Relay } = await import("../riders/relay.mjs");
    return Relay.request(payload);
}

function lightData({ x, y, bright, dim, colour }) {
    const grid = canvas.grid.size;
    return { x: x + grid / 2, y: y + grid / 2, config: { bright, dim, color: colour, alpha: 0.5, animation: { type: "pulse", speed: 2, intensity: 1 } } };
}

function tokenLightEffect({ name, img, bright, dim, colour, casterEffectUuid }) {
    return {
        type: "effect", name, img: img ?? "icons/svg/light.svg",
        system: { duration: { value: -1, unit: "unlimited", expiry: null, sustained: false }, tokenIcon: { show: true },
            rules: [{ key: "TokenLight", value: { bright, dim, color: colour, alpha: 0.05, animation: { type: "pulse", speed: 2, intensity: 1 } } }] },
        flags: { [LIB_ID]: { [FLAG]: { attachedFor: casterEffectUuid } } },
    };
}

/** Where an orb is now: its ambient light's centre, or the token it is attached to. */
function orbPosition(spec) {
    if (spec.lightUuid) {
        const light = fromUuidSync(spec.lightUuid);
        return light ? { x: light.x, y: light.y } : null;
    }
    const token = spec.tokenUuid ? fromUuidSync(spec.tokenUuid)?.object : null;
    return token?.center ?? null;
}

/** Where an orb is, in words: on a creature, or set down so far from its caster. */
function whereIs(spec) {
    if (spec.tokenUuid) return t("LightOrb.On", { name: fromUuidSync(spec.tokenUuid)?.name ?? "" });
    const light = spec.lightUuid ? fromUuidSync(spec.lightUuid) : null;
    return light ? t("LightOrb.At", { x: Math.round(light.x), y: Math.round(light.y) }) : t("LightOrb.Gone");
}

export const LightOrb = {
    register() {
        Extensions.registerAimed("a light set down", 56, (config, regions, originToken) => LightOrb.aimed(config, regions, originToken));
        CastPipeline.after("a light set down", 63, (cast, spell) => LightOrb.after(spell ?? cast));
    },

    async aimed(config, regions, originToken) {
        const move = config.item?.flags?.[LIB_ID]?.[FLAG]?.moves;
        if (!config.lightOrb && !move) return undefined;
        const shape = regions.at(-1)?.shapes?.[0];
        if (!shape) return false;
        const rect = snapped(shape);
        // A creature in the square — the targeted one where several share it.
        const there = occupants(rect, canvas.tokens.placeables, null).filter((tk) => tk.actor?.isOfType?.("creature"));
        const on = there.find((tk) => game.user.targets.has(tk)) ?? there[0] ?? null;
        canvas.tokens.setTargets([]);
        if (move) {
            // "Move the light up to 60 feet": measured from where the light is.
            const effect = await fromUuid(move);
            const spec = effect?.flags?.[LIB_ID]?.[FLAG];
            const from = spec ? orbPosition(spec) : null;
            const to = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            const feet = from ? canvas.grid.measurePath([from, to]).distance : 0;
            if (feet > (Number(spec?.moveFeet) || 60)) {
                ui.notifications.warn(t("LightOrb.TooFar", { feet: Math.round(feet), max: Number(spec?.moveFeet) || 60 }));
                return false;
            }
            await relay({ action: "lightOrb", op: "move", effectUuid: move, x: rect.x, y: rect.y, tokenUuid: on?.document?.uuid ?? null });
            return true;
        }
        pending.set((config.item.original ?? config.item).uuid, { sceneId: canvas.scene.id, x: rect.x, y: rect.y, tokenUuid: on?.document?.uuid ?? null, spec: config.lightOrb, casterUuid: originToken?.actor?.uuid ?? null });
        return true;
    },

    async after(spell) {
        const key = (spell?.original ?? spell)?.uuid;
        const place = key ? pending.get(key) : null;
        if (!place) return;
        pending.delete(key);
        const caster = spell.actor;
        // "If you Cast the Spell while you already have four light spells active, you must choose one of the existing
        // spells to end."
        const max = Number(place.spec?.max) || 4;
        const orbs = (caster?.itemTypes?.effect ?? []).filter((e) => e.flags?.[LIB_ID]?.[FLAG]?.spellUuid === key);
        if (orbs.length >= max) {
            const end = await foundry.applications.api.DialogV2.wait({
                window: { title: spell.name },
                content: `<p>${t("LightOrb.Fifth", { max })}</p>`,
                buttons: orbs.map((e) => ({ action: e.id, label: whereIs(e.flags[LIB_ID][FLAG]) })),
                rejectClose: false,
            });
            if (!end) return;
            await relay({ action: "lightOrb", op: "end", effectUuid: caster.items.get(end)?.uuid });
        }
        const colour = (await chooseColour(spell)) ?? "#e7f3f1";
        const { bright, dim } = orbRadii(place.spec, spell.rank);
        await relay({ action: "lightOrb", op: "create", spellUuid: key, casterUuid: place.casterUuid ?? caster?.uuid, sceneId: place.sceneId, x: place.x, y: place.y, tokenUuid: place.tokenUuid, bright, dim, colour, moveFeet: Number(place.spec?.move) || 60 });
    },

    /** The active GM's side: create, move, end. */
    async handle(payload) {
        if (payload.op === "create") return LightOrb.create(payload);
        const effect = payload.effectUuid ? await fromUuid(payload.effectUuid) : null;
        if (!effect) return null;
        if (payload.op === "end") return effect.delete();
        if (payload.op === "move") return LightOrb.move(effect, payload);
        return null;
    },

    async place({ effect, spec, sceneId, x, y, tokenUuid }) {
        const scene = game.scenes.get(sceneId) ?? canvas.scene;
        const token = tokenUuid ? fromUuidSync(tokenUuid) : null;
        if (token?.actor) {
            const [attached] = await token.actor.createEmbeddedDocuments("Item", [tokenLightEffect({ name: effect.name, img: effect.img, bright: spec.bright, dim: spec.dim, colour: spec.colour, casterEffectUuid: effect.uuid })]);
            return { tokenUuid: token.uuid, attachedUuid: attached?.uuid ?? null, lightUuid: null };
        }
        const [light] = await scene.createEmbeddedDocuments("AmbientLight", [{ ...lightData({ x, y, ...spec }), flags: { [LIB_ID]: { [FLAG]: { effectUuid: effect.uuid } } } }]);
        return { lightUuid: light?.uuid ?? null, tokenUuid: null, attachedUuid: null };
    },

    async create({ spellUuid, casterUuid, sceneId, x, y, tokenUuid, bright, dim, colour, moveFeet }) {
        const caster = casterUuid ? await fromUuid(casterUuid) : null;
        const spell = spellUuid ? await fromUuid(spellUuid) : null;
        if (!caster) return null;
        const [effect] = await caster.createEmbeddedDocuments("Item", [{
            type: "effect",
            name: t("LightOrb.Effect", { spell: spell?.name ?? "" }),
            img: spell?.img ?? "icons/svg/light.svg",
            system: { duration: { value: -1, unit: "unlimited", expiry: null, sustained: false }, tokenIcon: { show: false }, rules: [] },
            flags: { [LIB_ID]: { untilPreparations: caster.uuid, [FLAG]: { spellUuid, bright, dim, colour, moveFeet } } },
        }]);
        if (!effect) return null;
        const at = await LightOrb.place({ effect, spec: { bright, dim, colour }, sceneId, x, y, tokenUuid });
        await effect.update({ [`flags.${LIB_ID}.${FLAG}`]: { ...effect.flags[LIB_ID][FLAG], ...at } });
        // "You can Dismiss the spell", and Sustain it to move the light.
        const { Dismiss } = await import("../riders/dismiss.mjs");
        await Dismiss.grantForEffect(caster, spell, effect);
        await caster.createEmbeddedDocuments("Item", [{
            type: "action",
            name: t("LightOrb.Move", { name: effect.name }),
            img: spell?.img ?? "icons/svg/light.svg",
            system: { actionType: { value: "action" }, actions: { value: 1 }, traits: { value: ["concentrate"], rarity: "common" }, description: { value: `<p>${t("LightOrb.MoveHelp", { feet: moveFeet })}</p>` } },
            flags: { [LIB_ID]: { [FLAG]: { moves: effect.uuid }, areaTargeting: { area: { type: "square", value: 5 }, range: 1000, placeOnly: true } } },
        }]);
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p>${t(at.tokenUuid ? "LightOrb.Attached" : "LightOrb.Placed", { caster: caster.name, name: at.tokenUuid ? fromUuidSync(at.tokenUuid)?.name : "" })}</p>` });
        return effect;
    },

    async move(effect, { x, y, tokenUuid }) {
        const spec = effect.flags[LIB_ID][FLAG];
        await LightOrb.clear(spec);
        const at = await LightOrb.place({ effect, spec, sceneId: canvas.scene.id, x, y, tokenUuid });
        await effect.update({ [`flags.${LIB_ID}.${FLAG}`]: { ...spec, ...at } });
    },

    /** Take an orb off the board: its ambient light, or the effect that hangs it on a creature. */
    async clear(spec) {
        const light = spec.lightUuid ? fromUuidSync(spec.lightUuid) : null;
        if (light) await light.delete().catch(() => {});
        const attached = spec.attachedUuid ? fromUuidSync(spec.attachedUuid) : null;
        if (attached) await attached.delete().catch(() => {});
    },

    /** The caster's effect gone — dismissed, ended by a fifth, or their preparations — puts the light out. Active GM. */
    registerHooks() {
        Hooks.on("deleteItem", async (item) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            const spec = item.flags?.[LIB_ID]?.[FLAG];
            if (!spec?.spellUuid) return;
            await LightOrb.clear(spec);
            const actor = item.parent;
            const moves = actor?.items?.filter((i) => i.type === "action" && i.flags?.[LIB_ID]?.[FLAG]?.moves === item.uuid).map((i) => i.id) ?? [];
            if (moves.length > 0) await actor.deleteEmbeddedDocuments("Item", moves).catch(() => {});
        });
    },
};
