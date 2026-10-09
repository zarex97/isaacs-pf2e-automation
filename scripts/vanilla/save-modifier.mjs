import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { configOf } from "../lib/config-of.mjs";
import { testPredicate } from "../lib/roll-options.mjs";
import { t } from "../i18n.mjs";

/**
 * A save a spell makes harder, or easier, for some of the creatures who roll it.
 *
 * *Wilding Word*: "if the creature is an animal, fungus, or plant, it takes a –1 circumstance penalty to its save".
 * An entry says so with `saveModifier: { value: -1, type: "circumstance", predicate: [...] }`, the predicate tested
 * against the saver's own roll options (`self:trait:animal`). A list may hold several.
 *
 * The modifier joins the save before pf2e totals it, so pf2e's own stacking decides whether it counts and the card's
 * breakdown shows it. A save against a spell carries that spell as `context.item`.
 *
 * *Shape Stone*: "Any creatures standing atop the stone … must each attempt a Reflex save or Acrobatics check".
 * `saveOrSkill: "acrobatics"` lets the saver use the skill when it is the better: the save gains the difference, so
 * its total is the skill's.
 */

/** What a save gains when the skill is better: the difference, or nothing. */
export function skillGain(saveModifier, skillModifier) {
    return Math.max(0, (Number(skillModifier) || 0) - (Number(saveModifier) || 0));
}

/** The declared modifiers whose predicates these roll options pass. */
export function saveModifiersFor(declared, options) {
    const set = options instanceof Set ? options : new Set(options ?? []);
    return [declared].flat().filter((spec) => spec && Number(spec.value) && testPredicate(spec.predicate, set));
}

export const SaveModifier = {
    register() {
        CheckPipeline.before("a save a spell changes for some", 34, (check, context) => {
            if (context?.type !== "saving-throw" || typeof check?.push !== "function") return;
            const item = context.item ?? null;
            const specs = saveModifiersFor(configOf(item, "saveModifier"), context.options);
            const Modifier = game.pf2e?.Modifier;
            const skill = configOf(item, "saveOrSkill");
            const gain = skill && Modifier ? skillGain(check.totalModifier, context.actor?.skills?.[skill]?.mod) : 0;
            if (gain > 0) check.push(new Modifier({ slug: `${skill}-instead`, label: t("SaveModifier.Instead", { skill: game.i18n.localize(CONFIG.PF2E?.skills?.[skill]?.label ?? skill) }), modifier: gain, type: "untyped" }));
            if (specs.length === 0 || !Modifier) return;
            for (const [index, spec] of specs.entries()) {
                check.push(new Modifier({
                    slug: `${item.slug ?? "spell"}-save-${index}`,
                    label: item.name,
                    modifier: Number(spec.value),
                    type: spec.type ?? "untyped",
                }));
            }
        });
    },
};
