import { t } from "../i18n.mjs";
import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { configOf } from "../lib/config-of.mjs";

/**
 * An attack that counts a target's circumstance bonus to AC for less.
 *
 * *Phase Bolt*: "if the target has any circumstance bonuses to AC (such as from a shield or cover), reduce that
 * bonus by 2 for this attack." An entry says so with `circumstanceAcLess: 2`. pf2e's own *Spell Effect: Phase Bolt*
 * says it too, but as rules on the target, standing for ever — the attack is the only moment it is true.
 *
 * The correction is made on the DC the attack rolls against, like every other AC correction here: a modifier switched
 * off inside `Check.roll` is switched back on before the dice fall.
 */

/** The best circumstance bonus standing on a creature's AC, or 0. Only the best one counts in pf2e. */
export function circumstanceBonus(modifiers = []) {
    return modifiers
        .filter((m) => m.type === "circumstance" && m.enabled !== false && !m.ignored && m.modifier > 0)
        .reduce((best, m) => Math.max(best, m.modifier), 0);
}

/** How much of that bonus an attack takes away: never more than there is. */
export function lessBy(bonus, less) {
    return Math.max(0, Math.min(bonus, Number(less) || 0));
}

export const Phase = {
    register() {
        CheckPipeline.before("a circumstance bonus to AC that counts less", 33, (_check, context) => {
            if (context?.type !== "attack-roll" || typeof context.dc?.value !== "number") return;
            const less = configOf(context.item, "circumstanceAcLess");
            const target = context.target?.actor;
            if (!less || !target) return;
            const by = lessBy(circumstanceBonus(target.armorClass?.modifiers ?? []), less);
            if (by <= 0) return;
            const label = t("Phase.Less", { name: context.item.name, by });
            return { ...context, dc: { ...context.dc, value: context.dc.value - by, ...(context.dc.label ? { label: `${context.dc.label} (${label})` } : {}) } };
        });
    },
};
