import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Magic made to look like other magic.
 *
 * *Disguise Magic*: "You alter how an item's or spell's magical aura appears to effects like detect magic. You can hide
 * the auras entirely, have an item register as a common item of lower level, or make a spell register as a common spell
 * of the same or lower rank. You can Dismiss the spell. A caster using Detect Magic or Read Aura of a higher rank than
 * disguise magic can attempt to disbelieve the illusion using the skill matching the tradition of the spell … Further
 * attempts by the same caster get the same result as the initial check to disbelieve. Heightened (2nd) You can Cast this
 * Spell on a creature, disguising all items and spell effects on it."
 *
 * `{ type: "disguise" }` reads the cast's fields — the `item` (an item or effect, by name, on the creature targeted or
 * on the caster; left blank from 2nd rank with a creature targeted, everything on it), the `mode` (`hide` or `lower`),
 * and what it registers `as` and at what `level`. The thing disguised carries the disguise; the caster carries an effect
 * until their daily preparations, with its Dismiss, and the disguise goes with it. *Detect Magic* (`detect-magic.mjs`)
 * leaves a hidden aura out and reports a lowered one as what it pretends to be; a detector of a higher rank rolls its
 * tradition's skill against the disguise's DC once, and that result stands for every later pulse of theirs.
 */

const FLAG = "disguised";
const SKILLS = { arcane: "arcana", divine: "religion", occult: "occultism", primal: "nature" };

/** The skill a tradition disbelieves with. */
export function skillFor(tradition) {
    return SKILLS[tradition] ?? "arcana";
}

/** The disguise over an item, or over every item of a creature, while the effect that keeps it lasts. */
export function disguiseOf(item, actor) {
    const spec = item?.flags?.[LIB_ID]?.[FLAG] ?? actor?.flags?.[LIB_ID]?.[FLAG] ?? null;
    if (!spec?.effectUuid) return null;
    return fromUuidSync(spec.effectUuid) ? spec : null;
}

/** What the pulse reports for a disguised source, or null to leave it out. */
export function asDisguised(magic, spec) {
    if (spec.mode === "hide") return null;
    return { ...magic, name: spec.as || magic.name, level: Math.min(magic.level, Number(spec.level) || 0), illusion: false };
}

/** Has this detector seen through it? Rolled once, kept for every later try. */
export async function seesThrough(spec, holder, detector, rank) {
    if (!(Number(rank) > Number(spec.rank))) return false;
    // Keyed by id: a uuid's dots would make a path of the flag.
    const known = spec.by?.[detector.id];
    if (known !== undefined) return known;
    const roll = await detector.skills?.[skillFor(spec.tradition)]?.roll({ dc: { value: spec.dc }, skipDialog: true, label: t("Disguise.Disbelieve", { name: holder.name }) });
    const passed = (roll?.degreeOfSuccess ?? 0) >= 2;
    await holder.update({ [`flags.${LIB_ID}.${FLAG}.by.${detector.id}`]: passed }).catch(() => null);
    spec.by = { ...(spec.by ?? {}), [detector.id]: passed };
    return passed;
}

export async function disguiseMagic(_rider, context, chosen = {}, { rank = 1, item = null } = {}) {
    const caster = context.originActor;
    const creature = (context.targets ?? []).map((token) => token?.actor ?? token).find((a) => a?.items) ?? caster;
    if (!caster || !creature) return;
    const named = String(chosen.item ?? "").trim().toLowerCase();
    const spec = {
        mode: chosen.mode === "hide" ? "hide" : "lower",
        as: String(chosen.as ?? "").trim(),
        level: Number(chosen.level) || 0,
        rank,
        dc: item?.spellcasting?.statistic?.dc?.value ?? 15,
        tradition: item?.spellcasting?.tradition ?? "arcane",
        by: {},
    };
    const thing = named ? creature.items.find((i) => i.name.toLowerCase() === named) : null;
    if (!thing && !(rank >= 2 && !named && creature !== caster)) {
        context.notes.push(t("Disguise.NoThing", { item: named, name: creature.name }));
        return;
    }
    const [effect] = await caster.createEmbeddedDocuments("Item", [{
        type: "effect",
        name: `${context.item?.name ?? ""}: ${thing?.name ?? creature.name}`,
        img: context.item?.img ?? "icons/svg/mystery-man.svg",
        system: { duration: { value: 1, unit: "unlimited", expiry: null, sustained: false }, start: { value: game.time.worldTime }, rules: [] },
        flags: { [LIB_ID]: { untilPreparations: caster.uuid } },
    }]);
    spec.effectUuid = effect.uuid;
    // A fresh disguise, not merged into an old one's results.
    await (thing ?? creature).update({ [`flags.${LIB_ID}.-=${FLAG}`]: null });
    await (thing ?? creature).update({ [`flags.${LIB_ID}.${FLAG}`]: spec });
    const { Dismiss } = await import("./dismiss.mjs");
    await Dismiss.grantForEffect(caster, context.item, effect);
    context.notes.push(t(spec.mode === "hide" ? "Disguise.Hidden" : "Disguise.Lowered", { thing: thing?.name ?? creature.name, as: spec.as, level: spec.level }));
}

export const Disguise = {
    /** The effect gone, the disguise goes. Active GM only. */
    registerHooks() {
        Hooks.on("deleteItem", async (item) => {
            if (game.users?.activeGM?.id !== game.user?.id || item.type !== "effect") return;
            const actors = [...game.actors, ...[...game.scenes].flatMap((scene) => scene.tokens.filter((token) => !token.actorLink && token.actor).map((token) => token.actor))];
            for (const actor of actors) {
                const holders = [actor, ...actor.items].filter((doc) => doc.flags?.[LIB_ID]?.[FLAG]?.effectUuid === item.uuid);
                for (const doc of holders) await doc.update({ [`flags.${LIB_ID}.-=${FLAG}`]: null });
            }
        });
    },
};
