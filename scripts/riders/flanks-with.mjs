import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Two creatures who flank together wherever they stand.
 *
 * *Pack Attack*: "You and the other target flank any enemy to which you are both adjacent, whether or not you are on
 * opposite sides of the enemy's space." Each creature the cast reached carries an effect with `flanksWith`, the uuids
 * of the others (`apply.mjs`). An attack by one at a creature it and one of them stand adjacent to finds it off-guard —
 * a DC 2 lower, the way every off-guard correction here is made — unless it is off-guard already, pf2e's own flanking
 * included.
 */

const FLAG = "flanksWith";

/** The creatures this one flanks with, by actor uuid. */
export function partnersOf(actor) {
    return (actor?.itemTypes?.effect ?? []).flatMap((e) => e.flags?.[LIB_ID]?.[FLAG] ?? []);
}

/** Do the two flank it: both adjacent, the partner not the target, and it not off-guard already? */
export function flanks({ attackerFeet, partnerFeet, partnerIsTarget, offGuard }) {
    return !partnerIsTarget && !offGuard && attackerFeet <= 5 && partnerFeet <= 5;
}

const placeable = (token) => token?.object ?? token ?? null;

export const FlanksWith = {
    register() {
        CheckPipeline.before("a pair that flanks wherever it stands", 37, (_check, context) => {
            if (context?.type !== "attack-roll" || typeof context.dc?.value !== "number") return;
            const attacker = placeable(context.origin?.token ?? context.token);
            const target = placeable(context.target?.token);
            const uuids = partnersOf(attacker?.actor);
            // "Any enemy": never a creature on the attacker's own side.
            if (!attacker || !target || uuids.length === 0 || attacker.actor?.isAllyOf?.(target.actor)) return;
            const options = context.options instanceof Set ? context.options : new Set(context.options ?? []);
            const offGuard = options.has("target:condition:off-guard") || !!target.actor?.hasCondition?.("off-guard");
            const partner = (canvas?.tokens?.placeables ?? []).find((token) => uuids.includes(token.actor?.uuid) && flanks({
                attackerFeet: attacker.distanceTo(target),
                partnerFeet: token.distanceTo(target),
                partnerIsTarget: token.actor === target.actor,
                offGuard,
            }));
            if (!partner) return;
            const label = t("FlanksWith.OffGuard", { name: target.name, partner: partner.name });
            return { ...context, dc: { ...context.dc, value: context.dc.value - 2, ...(context.dc.label ? { label: `${context.dc.label} (–2 ${label})` } : {}) } };
        });
    },
};
