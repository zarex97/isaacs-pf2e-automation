import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A condition held at a value while an effect lasts.
 *
 * *Evil Eye*: "The target becomes Sickened 1 if it fails a Will save (or sickened 2 on a critical failure). This
 * condition value can't be reduced below 1 while the spell is active and you can see the target." An effect with
 * `floor: { slug, value }` keeps its holder's condition of that slug from going below `value`: a lowering is clamped
 * and a removal refused — while its caster can see the holder (not blinded, the holder not invisible, undetected or
 * unnoticed). The effect itself is the spell, Sustained by its caster.
 */

const FLAG = "floor";
const UNSEEN = ["invisible", "undetected", "unnoticed"];

/** The floor an effect on this actor sets for this condition slug, or null. */
export function floorFor(actor, slug) {
    for (const effect of actor?.itemTypes?.effect ?? []) {
        const spec = effect.flags?.[LIB_ID]?.[FLAG];
        if (spec?.slug === slug) return { effect, value: Number(spec.value) || 1, casterUuid: spec.casterUuid ?? null };
    }
    return null;
}

/** Can the caster see the creature? Not blinded, and the creature not invisible, undetected or unnoticed. */
export function canSee(caster, actor) {
    if (!caster) return false;
    if (caster.hasCondition?.("blinded")) return false;
    return !UNSEEN.some((slug) => actor?.hasCondition?.(slug));
}

/** The value a change may leave the condition at: never below the floor. */
export function clamped(next, floor) {
    return Math.max(Number(next) || 0, floor);
}

function holding(item) {
    if (item?.type !== "condition" || !item.actor) return null;
    const floor = floorFor(item.actor, item.slug);
    if (!floor) return null;
    const caster = floor.casterUuid ? fromUuidSync(floor.casterUuid) : null;
    return canSee(caster, item.actor) ? floor : null;
}

export const ConditionFloor = {
    registerHooks() {
        Hooks.on("preUpdateItem", (item, changes) => {
            const floor = holding(item);
            const next = foundry.utils.getProperty(changes, "system.value.value");
            if (!floor || next === undefined || Number(next) >= floor.value) return;
            foundry.utils.setProperty(changes, "system.value.value", clamped(next, floor.value));
            ui.notifications?.info(t("Floor.Held", { actor: item.actor.name, name: item.name, value: floor.value, effect: floor.effect.name }));
        });
        Hooks.on("preDeleteItem", (item) => {
            const floor = holding(item);
            if (!floor) return;
            ui.notifications?.info(t("Floor.Held", { actor: item.actor.name, name: item.name, value: floor.value, effect: floor.effect.name }));
            if ((item.value ?? 0) > floor.value) void item.update({ "system.value.value": floor.value });
            return false;
        });
    },
};
