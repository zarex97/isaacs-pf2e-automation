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
 */

const FLAG = "forbids";

/** The effect that forbids this actor `what`, or null. */
export function forbiddenBy(actor, what) {
    return (actor?.itemTypes?.effect ?? []).find((e) => (e.flags?.[LIB_ID]?.[FLAG] ?? []).includes(what)) ?? null;
}

/** May this action be used? A warning, and no, when its traits are ones its holder's form forbids. */
export function actionForbidden(action) {
    const traits = action?.system?.traits?.value ?? [];
    for (const what of ["manipulate", "attack"]) {
        if (!traits.includes(what)) continue;
        const effect = forbiddenBy(action.actor, what);
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
        const effect = forbiddenBy(spell?.actor, "cast");
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
