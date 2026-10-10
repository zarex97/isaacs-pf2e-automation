import { t } from "../i18n.mjs";
import { asDisguised, disguiseOf, seesThrough } from "./disguise.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A pulse that finds magic.
 *
 * *Detect Magic*: "You send out a pulse that registers the presence of magic. You receive no information beyond the
 * presence or absence of magic. You can choose to ignore magic you're fully aware of, such as the magic items and
 * ongoing spells of you and your allies. You detect illusion magic only if that magic's effect has a lower rank than
 * the rank of your detect magic spell … Heightened (3rd) You learn the rank or level of the most powerful magical
 * effect the spell detects … Heightened (4th) As 3rd rank, but you also pinpoint the source of the highest-rank magic."
 *
 * The `detect-magic` apply type looks within `range` feet of the caster: every creature's magic items and the effects
 * spells and magic left on it, and the areas spells left on the ground. The caster's own and their allies' are left out
 * when the cast chose so (`castChoice` `known: ignore`). An illusion counts only below the spell's rank. The card, to the
 * caster's owners, says whether there is magic; from 3rd rank, the highest rank or level; from 4th, where it is.
 */

const TRADITIONS = ["arcane", "divine", "occult", "primal", "magical"];

/** A source of magic: what it is, its rank or level, whether it is an illusion, and where. */
export function magicIn(item) {
    if (!item) return null;
    const traits = item.system?.traits?.value ?? [];
    if (item.type === "effect") {
        const origin = item.system?.context?.origin?.item ? fromUuidSync(item.system.context.origin.item) : null;
        const fromSpell = origin?.type === "spell" || /^(spell-effect|effect-)/.test(item.slug ?? "") && !!item.system?.context?.origin;
        const magical = fromSpell || traits.some((tr) => TRADITIONS.includes(tr));
        if (!magical) return null;
        const illusion = traits.includes("illusion") || (origin?.system?.traits?.value ?? []).includes("illusion");
        return { name: item.name, level: Number(item.system?.level?.value) || Number(origin?.rank) || 1, kind: "rank", illusion };
    }
    if (item.isOfType?.("physical") && item.isMagical) {
        return { name: item.name, level: Number(item.level) || 0, kind: "level", illusion: traits.includes("illusion") };
    }
    return null;
}

/** The magic the pulse registers, after the rank rule for illusions and the choice to leave known magic out. */
export function detected(found, { rank, ignore = () => false }) {
    return found.filter((m) => !ignore(m) && (!m.illusion || m.level < rank));
}

export async function detectMagic(rider, context) {
    const caster = context.actor;
    const origin = caster?.getActiveTokens?.(true, false)?.[0];
    if (!caster || !origin) return;
    const spell = context.item;
    const rank = Number(spell?.rank) || 1;
    const range = Number(rider.apply.range) || 30;
    const known = rider.apply.ignoreKnown === true;
    const friendly = (actor) => actor === caster || actor?.isAllyOf?.(caster);
    const found = [];
    for (const token of canvas.tokens.placeables) {
        if (!token.actor || origin.distanceTo(token) > range) continue;
        for (const item of token.actor.items) {
            let magic = magicIn(item);
            // *Disguise Magic*: hidden, or something lesser — unless this caster sees through it (`disguise.mjs`).
            const disguise = magic ? disguiseOf(item, token.actor) : null;
            if (disguise && !(await seesThrough(disguise, item.flags?.[LIB_ID]?.disguised ? item : token.actor, caster, rank))) magic = asDisguised(magic, disguise);
            if (magic) found.push({ ...magic, where: token.name, friendly: friendly(token.actor) });
        }
    }
    for (const region of canvas.scene?.regions ?? []) {
        const spec = region.flags?.[LIB_ID]?.lingering;
        const item = spec?.itemUuid ? fromUuidSync(spec.itemUuid) : null;
        if (!item) continue;
        const shape = region.shapes?.[0];
        const at = shape ? { x: shape.x + (shape.width ?? 0) / 2, y: shape.y + (shape.height ?? 0) / 2 } : null;
        if (!at || canvas.grid.measurePath([origin.center, at]).distance > range + 5) continue;
        found.push({ name: region.name || item.name, level: Number(spec.rank ?? item.rank) || 1, kind: "rank", illusion: (item.system?.traits?.value ?? []).includes("illusion"), where: region.name || item.name, friendly: false });
    }
    const seen = detected(found, { rank, ignore: (m) => known && m.friendly });
    const highest = seen.reduce((best, m) => (!best || m.level > best.level ? m : best), null);
    const lines = [t(seen.length > 0 ? "DetectMagic.Present" : "DetectMagic.Absent", { range })];
    if (highest && rank >= 3) lines.push(t(highest.kind === "level" ? "DetectMagic.HighestLevel" : "DetectMagic.HighestRank", { level: highest.level }));
    if (highest && rank >= 4) lines.push(t("DetectMagic.Where", { where: highest.where }));
    const whisper = game.users.filter((u) => caster.testUserPermission(u, "OWNER")).map((u) => u.id);
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), whisper, flavor: spell?.name ?? "", content: lines.map((l) => `<p>${l}</p>`).join("") });
}
