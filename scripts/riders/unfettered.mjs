import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * An Escape that cannot fail.
 *
 * *Unfettered Movement*: "When they attempt to Escape an effect that has them Immobilized, Grabbed, or Restrained, they
 * automatically succeed unless the effect is magical and of a higher rank than the unfettered movement spell." An
 * effect with `unfettered` (its rank, the cast's) puts a pf2e degree adjustment on its holder's Escape checks — pf2e's
 * own (`action:escape`) and this module's granted ones — raising a failure or a critical failure to a success, unless
 * the check says the hold is magical and of a higher rank (`escape:magical-rank:<n>`, which this module's Escape adds
 * from the spell or magical item that holds the creature).
 */

const FLAG = "unfettered";

/** The holder's unfettered effect, or null. */
export function unfetteredEffect(actor) {
    return (actor?.itemTypes?.effect ?? []).find((e) => e.flags?.[LIB_ID]?.[FLAG]) ?? null;
}

/** The rank of a magical hold, from the options of its Escape check; null when it is not magical. */
export function magicalRank(options) {
    for (const option of options ?? []) {
        const match = /^escape:magical-rank:(\d+)$/.exec(option);
        if (match) return Number(match[1]);
    }
    return null;
}

/** Does unfettered movement at this rank free its holder from this Escape? */
export function freesFrom(options, rank) {
    const list = [...(options ?? [])];
    if (!list.includes("action:escape")) return false;
    const hold = magicalRank(list);
    return hold === null || hold <= rank;
}

/** The roll option a hold of this item adds to an Escape against it: a spell, or anything magical, by its rank. */
export function holdOption(item) {
    if (!item) return null;
    const traits = item.system?.traits?.value ?? [];
    const magical = item.type === "spell" || traits.includes("magical") || ["arcane", "divine", "occult", "primal"].some((tr) => traits.includes(tr));
    if (!magical) return null;
    const rank = Number(item.rank ?? item.system?.location?.heightenedLevel ?? Math.ceil((Number(item.level ?? item.system?.level?.value) || 1) / 2)) || 1;
    return `escape:magical-rank:${rank}`;
}

export const Unfettered = {
    register() {
        CheckPipeline.before("an escape unfettered movement makes", 41, (_check, context) => {
            const effect = unfetteredEffect(context?.actor);
            if (!effect) return;
            const rank = Number(effect.flags[LIB_ID][FLAG].rank) || 1;
            if (!freesFrom(context.options, rank)) return;
            const label = t("Unfettered.Label", { name: effect.name });
            context.dosAdjustments = [...(context.dosAdjustments ?? []), {
                adjustments: { failure: { label, amount: "success" }, criticalFailure: { label, amount: "success" } },
            }];
        });
    },
};
