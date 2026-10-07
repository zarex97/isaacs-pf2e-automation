import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { CheckPipeline } from "../lib/check-pipeline.mjs";

/**
 * What a form forbids its holder.
 *
 * *Vapor Form*: "It can't cast spells, activate items, or use actions that have the attack or manipulate trait." An
 * effect may carry `forbids` — any of `cast`, `attack`, `manipulate` — and while it lasts: a spell its holder casts is
 * refused (a cast stage), a Strike or other attack roll is refused (a check gate), and an action with the manipulate
 * (or attack) trait posted from its sheet is refused (`actionForbidden`, in the cast pipeline's action wrap).
 *
 * *Moon Frenzy*: "The targets can't use concentrate actions unless those actions also have the rage trait, with the
 * exception of Seek." `concentrate` refuses actions and spells with that trait; `forbidsExcept: { traits, slugs }`
 * lets through those with one of the traits, or of those slugs.
 *
 * *Silence*: "The target can't use … actions with the auditory trait. This prevents it from casting spells … with the
 * exception of subtle spells." Any trait may be forbidden (`auditory`), and `cast` takes exceptions too. "While
 * within the aura, creatures are subject to the same effects": the copy pf2e's Aura puts on a creature forbids what the
 * effect radiating it forbids.
 */

const FLAG = "forbids";

/**
 * What an effect forbids, and its exceptions: its own — or, for a copy pf2e's Aura put on a creature, those of the
 * effect of the same source on the creature radiating it.
 */
export function forbidsOf(effect, lookup = (uuid) => fromUuidSync(uuid)) {
    const own = effect?.flags?.[LIB_ID];
    if (Array.isArray(own?.[FLAG])) return { forbids: own[FLAG], except: own.forbidsExcept ?? null };
    const aura = effect?.flags?.pf2e?.aura;
    const sourceId = effect?.sourceId ?? null;
    if (!aura?.origin || !sourceId) return null;
    const origin = lookup(aura.origin);
    const radiating = (origin?.itemTypes?.effect ?? []).find((e) => e !== effect && e.sourceId === sourceId && Array.isArray(e.flags?.[LIB_ID]?.[FLAG]));
    return radiating ? { forbids: radiating.flags[LIB_ID][FLAG], except: radiating.flags[LIB_ID].forbidsExcept ?? null } : null;
}

/** The effect that forbids this actor `what`, or null. */
export function forbiddenBy(actor, what) {
    return (actor?.itemTypes?.effect ?? []).find((e) => (forbidsOf(e)?.forbids ?? []).includes(what)) ?? null;
}

/** Does the effect's `forbidsExcept` let this item through — a trait it names, or its slug? */
export function excepted(effect, item) {
    const except = forbidsOf(effect)?.except;
    if (!except) return false;
    const traits = item?.system?.traits?.value ?? [];
    const slug = item?.slug ?? item?.system?.slug ?? null;
    return (except.traits ?? []).some((trait) => traits.includes(trait)) || (!!slug && (except.slugs ?? []).includes(slug));
}

/** May this action be used? A warning, and no, when its traits are ones its holder's form forbids. */
export function actionForbidden(action) {
    const traits = action?.system?.traits?.value ?? [];
    for (const what of traits) {
        const effect = forbiddenBy(action.actor, what);
        if (effect && excepted(effect, action)) continue;
        if (effect) {
            ui.notifications?.warn(t("Forbids.Refused", { actor: action.actor.name, name: action.name, effect: effect.name }));
            return true;
        }
    }
    return false;
}

export const Forbids = {
    /** A cast refused. The cast pipeline's stage. */
    castAllowed(spell) {
        // A spell with the concentrate trait, under a form that forbids concentrate actions.
        const concentrate = (spell?.system?.traits?.value ?? []).includes("concentrate") ? forbiddenBy(spell?.actor, "concentrate") : null;
        const cast = forbiddenBy(spell?.actor, "cast");
        const effect = (cast && !excepted(cast, spell) ? cast : null) ?? (concentrate && !excepted(concentrate, spell) ? concentrate : null);
        if (!effect) return true;
        ui.notifications?.warn(t("Forbids.Refused", { actor: spell.actor.name, name: spell.name, effect: effect.name }));
        return false;
    },

    register() {
        CheckPipeline.gate("an attack a form forbids", 15, (_check, context) => {
            if (context?.type !== "attack-roll") return true;
            const actor = context.origin?.actor ?? context.actor;
            const effect = forbiddenBy(actor, "attack");
            if (!effect) return true;
            ui.notifications?.warn(t("Forbids.Refused", { actor: actor.name, name: context.title ?? t("Forbids.Attack"), effect: effect.name }));
            return false;
        });
    },
};
