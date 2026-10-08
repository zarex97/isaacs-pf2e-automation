import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A creature that draws metal attacks to it.
 *
 * *Magnetize*: "Whenever a creature makes a ranged attack with a metal weapon or projectile against a creature within
 * 15 feet of the magnetized target, the magnetized target becomes the target of the attack instead. Whenever a creature
 * within 15 feet Strikes a creature other than the magnetized target with a metal melee weapon, the attacker takes a
 * –2 circumstance penalty to the attack roll." An effect carries `draws: { feet }`.
 *
 * pf2e does not record whether a weapon is metal: a material is set on 43 of its 1,013 weapons. So the rule is not
 * applied by itself. What can be seen is where everyone stands, and an attack that falls under either sentence is
 * marked on its own card, for the table to settle by the weapon.
 */

const FLAG = "draws";

/** The drawing effect a creature carries, or null. */
export function drawingEffect(actor) {
    return (actor?.itemTypes?.effect ?? []).find((effect) => effect.flags?.[LIB_ID]?.[FLAG]) ?? null;
}

/**
 * Which sentence an attack falls under: `"redirect"`, `"penalty"` or null. The drawing creature's own attacks, and
 * attacks at it, fall under neither.
 */
export function drawnBy({ ranged, melee, attackerIsHolder, targetIsHolder, targetFeet, attackerFeet, feet }) {
    if (!feet || attackerIsHolder || targetIsHolder) return null;
    if (ranged && targetFeet <= feet) return "redirect";
    if (melee && attackerFeet <= feet) return "penalty";
    return null;
}

const placeable = (token) => token?.object ?? token ?? null;

export const Draws = {
    register() {
        CheckPipeline.before("metal drawn to a creature", 35, (_check, context) => {
            if (context?.type !== "attack-roll" || !canvas?.tokens) return;
            const item = context.item;
            if (!["weapon", "melee"].includes(item?.type)) return;
            const attacker = placeable(context.origin?.token ?? context.token);
            const target = placeable(context.target?.token);
            if (!attacker?.actor || !target?.actor) return;
            const notes = [];
            for (const holder of canvas.tokens.placeables) {
                const effect = drawingEffect(holder.actor);
                if (!effect) continue;
                const kind = drawnBy({
                    ranged: !!item.isRanged,
                    melee: !!item.isMelee,
                    attackerIsHolder: holder.actor === attacker.actor,
                    targetIsHolder: holder.actor === target.actor,
                    targetFeet: holder.distanceTo(target),
                    attackerFeet: holder.distanceTo(attacker),
                    feet: Number(effect.flags[LIB_ID][FLAG].feet) || 15,
                });
                if (kind) notes.push({ selector: "attack-roll", title: effect.name, text: kind === "redirect" ? t("Draws.Redirect", { holder: holder.name }) : t("Draws.Penalty") });
            }
            if (notes.length > 0) context.notes = [...(context.notes ?? []), ...notes];
        });
    },
};
