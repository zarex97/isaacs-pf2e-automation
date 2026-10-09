import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { playersOf } from "./message.mjs";

/**
 * Who a creature is magically bound to.
 *
 * *Web of Influence*: "You learn the location of the nearest creature to whom the target is connected in a magical
 * manner. A creature sustaining a spell on the target is connected to it …, as are any creatures who are targets of a
 * spell effect currently affecting the target …, members of a coven, and creatures that are magically bonded to the
 * target … If you already know individuals who are magically connected to the target, you can exclude them … This spell
 * doesn't tell you anything about the nearest magically connected creature other than its current distance and
 * direction. If the nearest creature is on a different plane the spell indicates this but doesn't reveal which plane."
 *
 * `{ type: "connections", exclude }` reads the target's connections off the world: the caster of every sustained
 * effect on it, everyone else carrying an effect of the same caster's same spell, and its familiar or master. Those the
 * cast named in its `exclude` field are left out. The nearest one on the caster's scene is reported by its distance and
 * compass direction, never by name; with none on the scene, one on a scene whose `plane` flag differs from this one's
 * is "on another plane", and any other "beyond this map".
 */

const COMPASS = ["east", "southeast", "south", "southwest", "west", "northwest", "north", "northeast"];
const WORDS = { east: "Influence.East", southeast: "Influence.Southeast", south: "Influence.South", southwest: "Influence.Southwest", west: "Influence.West", northwest: "Influence.Northwest", north: "Influence.North", northeast: "Influence.Northeast" };

/** The compass point from one point to another, in screen coordinates (y grows southward). */
export function compass(from, to) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    return COMPASS[((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8];
}

/** The names the caster asked to leave out, compared without case. */
export function excluded(text) {
    return new Set(String(text ?? "").split(/[,;\n]/).map((name) => name.trim().toLowerCase()).filter(Boolean));
}

const originOf = (effect) => effect?.system?.context?.origin ?? {};
const sustained = (effect) => !!effect?.system?.duration?.sustained || !!effect?.flags?.[LIB_ID]?.sustainedBy;

/** Every actor the target is magically connected to, as uuids. */
export function connectionsOf(target, actors) {
    const found = new Set();
    const casts = new Set();
    for (const effect of target?.itemTypes?.effect ?? []) {
        const { actor, item } = originOf(effect);
        if (!actor || actor === target.uuid) continue;
        if (sustained(effect)) found.add(actor);
        if (item) casts.add(`${actor}|${item}`);
    }
    for (const other of actors) {
        if (other.uuid === target.uuid) continue;
        // The others a spell effect on the target also reached: the same caster's same spell.
        if ((other.itemTypes?.effect ?? []).some((effect) => casts.has(`${originOf(effect).actor}|${originOf(effect).item}`))) found.add(other.uuid);
        // A familiar and its master are bound by magic.
        if (other.type === "familiar" && other.system?.master?.id === target.id) found.add(other.uuid);
    }
    if (target.type === "familiar" && target.system?.master?.id) {
        const master = actors.find((a) => a.id === target.system.master.id);
        if (master) found.add(master.uuid);
    }
    return [...found];
}

/** Where a connected creature stands: the token on the caster's scene, else any token of it, else nothing. */
function placed(actor, scene) {
    const tokens = actor.getActiveTokens?.(true, true) ?? [];
    return tokens.find((token) => token.parent === scene) ?? tokens[0] ?? null;
}

export async function findConnection(rider, context, chosen = {}) {
    const from = context.originActor;
    const target = context.actor;
    if (!from || !target) return;
    const scene = canvas?.scene;
    const here = (context.originToken?.object ?? context.originToken)?.center ?? from.getActiveTokens?.(true, false)?.[0]?.center;
    const skip = excluded(chosen[rider.apply.exclude ?? "exclude"]);
    const actors = [...(game.actors ?? []), ...(game.scenes ?? []).flatMap((s) => s.tokens.filter((tk) => !tk.actorLink && tk.actor).map((tk) => tk.actor))];
    const linked = connectionsOf(target, actors)
        .map((uuid) => actors.find((a) => a.uuid === uuid) ?? fromUuidSync(uuid))
        .filter((actor) => actor && actor.uuid !== from.uuid && !skip.has(actor.name.toLowerCase()));

    let report = t("Influence.None", { name: target.name });
    const onScene = linked.map((actor) => ({ actor, token: placed(actor, scene) })).filter(({ token }) => token?.parent === scene && here);
    if (onScene.length > 0) {
        const measured = onScene.map(({ token }) => {
            const center = token.object?.center ?? { x: token.x, y: token.y };
            const feet = Math.round(canvas.grid.measurePath([here, center]).distance);
            return { feet, toward: t(WORDS[compass(here, center)]) };
        }).sort((a, b) => a.feet - b.feet);
        report = t("Influence.Nearest", { name: target.name, feet: measured[0].feet, toward: measured[0].toward });
    } else if (linked.length > 0) {
        const plane = (s) => s?.flags?.[LIB_ID]?.plane ?? null;
        const elsewhere = linked.map((actor) => placed(actor, scene)?.parent ?? null);
        const otherPlane = elsewhere.some((s) => s && plane(s) && plane(s) !== plane(scene));
        report = t(otherPlane ? "Influence.OtherPlane" : "Influence.Beyond", { name: target.name });
    }
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: from }),
        whisper: playersOf(from),
        flavor: context.item?.name ?? t("Influence.Title"),
        content: `<p>${report}</p>`,
    });
}
