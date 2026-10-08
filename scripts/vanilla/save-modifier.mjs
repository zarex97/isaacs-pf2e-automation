import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { configOf } from "../lib/config-of.mjs";
import { testPredicate } from "../lib/roll-options.mjs";

/**
 * A save a spell makes harder, or easier, for some of the creatures who roll it.
 *
 * *Wilding Word*: "if the creature is an animal, fungus, or plant, it takes a –1 circumstance penalty to its save".
 * An entry says so with `saveModifier: { value: -1, type: "circumstance", predicate: [...] }`, the predicate tested
 * against the saver's own roll options (`self:trait:animal`). A list may hold several.
 *
 * The modifier joins the save before pf2e totals it, so pf2e's own stacking decides whether it counts and the card's
 * breakdown shows it. A save against a spell carries that spell as `context.item`.
 */

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
