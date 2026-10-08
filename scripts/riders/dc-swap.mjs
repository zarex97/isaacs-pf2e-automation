import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A DC its holder may set by another statistic.
 *
 * *Bracing Tendrils*: "Whenever you're on the ground and a creature or effect attempts to forcibly move you from your
 * space, you can use your spell DC in place of your Fortitude DC as the DC of the check to move you." An effect carries
 * `dcSwap: { actions, dc }` — the actions it answers and the DC it offers, frozen when it was made (`apply.mjs`). A
 * check against its holder by one of those actions rolls against that DC when it is the higher: "can use" is a choice
 * nobody makes for the lower one.
 */

const FLAG = "dcSwap";

/** The DC a check should face instead, or null: the swap's, when it answers the action and is higher. */
export function swappedDc(current, swap, options) {
    if (!swap || !Number.isFinite(Number(swap.dc)) || !Number.isFinite(current)) return null;
    const answers = (swap.actions ?? []).some((action) => options.has(`action:${action}`));
    return answers && Number(swap.dc) > current ? Number(swap.dc) : null;
}

export const DcSwap = {
    register() {
        CheckPipeline.before("a DC its holder sets another way", 36, (_check, context) => {
            const target = context?.target?.actor;
            if (!target || typeof context.dc?.value !== "number") return;
            const effect = (target.itemTypes?.effect ?? []).find((e) => e.flags?.[LIB_ID]?.[FLAG]);
            if (!effect) return;
            const options = context.options instanceof Set ? context.options : new Set(context.options ?? []);
            const dc = swappedDc(context.dc.value, effect.flags[LIB_ID][FLAG], options);
            if (dc === null) return;
            const label = t("DcSwap.Label", { name: effect.name });
            return { ...context, dc: { ...context.dc, value: dc, ...(context.dc.label ? { label: `${context.dc.label} (${label})` } : {}) } };
        });
    },
};
