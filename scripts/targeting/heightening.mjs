/**
 * The growth pf2e has no field for.
 *
 * `system.heightening` carries `damage` and `area`, and the system applies both. Everything else a
 * Technique gains per step — another creature, another ten feet of range, another pillar, another five
 * feet of wall — has nowhere to live in the spell schema, because pf2e models neither a target count nor a
 * spell's range as a number. So it lives in this module's own targeting config, and this is the arithmetic
 * that turns a cast rank into the numbers the placement uses.
 *
 * Kept pure and separate so the ladders can be checked offline: the step count is the one thing here that
 * is easy to get subtly wrong, and it is invisible in the JSON.
 */

const stepProviders = [];

/**
 * Register a source of heightening the cast rank cannot express.
 *
 * "Your Techniques heighten as though you were 4 levels higher" has nowhere to go in a rank that is
 * already pinned at 10, so it is added as steps on this side instead. A provider reads the caster's roll
 * options and answers how many steps they are worth; the answers add up.
 *
 * @param {string} name
 * @param {(options: Set<string>) => number} fn
 */
export function registerStepProvider(name, fn) {
    if (typeof fn !== "function") throw new Error(`Isaac's Homebrew | step provider "${name}" is not a function.`);
    if (stepProviders.some((entry) => entry.name === name)) {
        throw new Error(`Isaac's Homebrew | heightening already has a step provider called "${name}".`);
    }
    stepProviders.push({ name, fn });
}

/** The bonus steps every registered provider grants for these roll options. */
export function bonusStepsFrom(options) {
    const set = options instanceof Set ? options : new Set(options ?? []);
    let steps = 0;
    for (const { fn } of stepProviders) steps += Math.max(0, Number(fn(set)) || 0);
    return steps;
}

/**
 * The level a Technique's *named* thresholds are read at.
 *
 * "At 12th and 16th level, you may target one additional creature" is growth keyed to a character level
 * rather than to a step, and "heighten as though you were 4 levels higher" does not exclude it. So bonus
 * steps move the threshold too: a step is worth two levels.
 */
export function effectiveLevel(actor) {
    const level = Number(actor?.level) || 0;
    return level + bonusStepsFrom(actor?.getRollOptions?.() ?? []) * 2;
}

/**
 * How many heightening steps a cast has taken. Never negative — a Technique cast at its base rank is 0.
 *
 * `bonusSteps` is growth the cast rank cannot express — see `registerStepProvider`.
 */
export function stepsFor({ baseRank, castRank, interval = 1, bonusSteps = 0 }) {
    const step = Number(interval) || 1;
    const taken = (Number(castRank) || 0) - (Number(baseRank) || 0);
    const earned = Math.max(0, Math.floor(taken / step));
    return earned + Math.max(0, Number(bonusSteps) || 0);
}

/**
 * Apply a `heightening` block to the base numbers.
 *
 * Two kinds of growth, because the Techniques are written both ways. Range grows *per step* — "the range
 * increases by 10 feet" — while extra targets, Strikes and pillars arrive at *named character levels*:
 * "at 12th and 16th level, you may target one additional creature", which is every four levels and so
 * cannot be expressed as a per-step increment at all.
 *
 * `areas` counts placements rather than adding to them: a Technique that places three at base and gains
 * one at 10th places four, which is what "add one pillar" means.
 */
export function applyHeightening(base, heightening, ranks) {
    const result = {
        maxTargets: Number(base.maxTargets) || 0,
        range: Number(base.range) || 0,
        areas: Math.max(1, Number(base.areas) || 1),
        length: Number(base.length) || 0,
        steps: 0,
    };
    // Counted whether or not there is a block to apply. `steps` answers "how far has this cast
    // heightened", which is a fact about the cast rather than about the flag — and the things that ask are
    // not always the things the block grows. *Mavros Eruption Clast* carries no flag heightening at all,
    // because its damage and area are pf2e's business; the fire it leaves on the ground is not, and that
    // grows a die a step. Returning 0 here left the black flame at 4d6 from 16th to 20th.
    const steps = stepsFor({ ...ranks, interval: heightening?.interval });
    result.steps = steps;
    if (!heightening || steps === 0) return result;

    if (heightening.maxTargets && result.maxTargets > 0) {
        result.maxTargets += Number(heightening.maxTargets) * steps;
    }
    if (heightening.range && result.range > 0) result.range += Number(heightening.range) * steps;
    if (heightening.areas) result.areas += Number(heightening.areas) * steps;
    if (heightening.length && result.length > 0) result.length += Number(heightening.length) * steps;

    return result;
}

/**
 * Growth that arrives at named character levels rather than per step.
 *
 * Applied on top of `applyHeightening`, and separately, because the two are not interchangeable: a
 * Technique can gain range every step *and* a target at 12th, and *Another Dimension* does both.
 */
export function applyThresholds(result, heightening, level) {
    const at = heightening?.at;
    if (!at) return result;

    for (const [threshold, gains] of Object.entries(at)) {
        if ((Number(level) || 0) < Number(threshold)) continue;
        if (gains.maxTargets) result.maxTargets += Number(gains.maxTargets);
        if (gains.areas) result.areas += Number(gains.areas);
        if (gains.range) result.range += Number(gains.range);
        if (gains.length) result.length += Number(gains.length);
    }
    return result;
}

/**
 * A value that changes at named character levels.
 *
 * *Tenpōrin'in*'s bonus is "+1, +2 at 12th, +3 at 18th" and *Crimson Mirage*'s per-needle damage is
 * "1d6, +1d6 at 10th, 14th and 18th". Both are the *caster's* level deciding a number on somebody else's
 * effect, so the number is resolved once, at hand-out time. Kept here, pure, because an off-by-one in a
 * ladder is invisible in the JSON and only shows up as a bonus that never grows.
 *
 * The highest threshold at or below the level wins, whatever order the keys were written in.
 */
export function valueAtLevel(ladder, level) {
    if (!ladder || typeof ladder !== "object" || !ladder.at) return undefined;
    const reached = Object.keys(ladder.at)
        .map(Number)
        .filter((threshold) => (Number(level) || 0) >= threshold)
        .sort((a, b) => a - b);
    return reached.length === 0 ? ladder.base : ladder.at[String(reached.at(-1))];
}

/**
 * Which of a counter's thresholds the last increase passed.
 *
 * Scorpio's needles: the fifth inflicts the enfeebled and the sixth does not inflict it again. `was` is the
 * count before the needle landed and `now` is the count after, so a threshold fires on the one increase
 * that crosses it and never afterwards — and never retroactively when a counter is created above it.
 */
export function thresholdsCrossed(thresholds, was, now) {
    if (!Array.isArray(thresholds) || now <= was) return [];
    return thresholds.filter((threshold) => {
        const at = Number(threshold.at);
        return at > was && at <= now;
    });
}
