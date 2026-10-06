/**
 * Degree of success, recomputed.
 *
 * This is the only place in the module that re-implements a piece of pf2e rather than calling it, and it
 * exists for one reason: *The Balance* has to change a die that has already been rolled, and pf2e's
 * `DegreeOfSuccess` — which would happily take the `{ dieValue, modifier }` brief this produces
 * (`system/degree-of-success.ts:29`) — is not exposed to modules.
 *
 * Because it is a re-implementation it is kept pure, kept small, and pinned by a table of cases in
 * `npm run test:riders`. Read against **pf2e 8.4** (`system/degree-of-success.ts`); if the bands ever move,
 * the tests are where it will show.
 */

export const DEGREES = ["criticalFailure", "failure", "success", "criticalSuccess"];

const CRITICAL_FAILURE = 0;
const CRITICAL_SUCCESS = 3;

/** pf2e's `DEGREE_ADJUSTMENT_AMOUNTS`, verbatim. */
const AMOUNTS = {
    LOWER_BY_TWO: -2,
    LOWER: -1,
    INCREASE: 1,
    INCREASE_BY_TWO: 2,
};

/** The four bands, before the die or any adjustment is considered. */
export function bandFor(total, dc) {
    if (total - dc >= 10) return CRITICAL_SUCCESS;
    if (total >= dc) return 2;
    if (total - dc <= -10) return CRITICAL_FAILURE;
    return 1;
}

/** A natural 20 moves the result one step up, a natural 1 one step down. */
export function applyNatural(degree, dieValue) {
    if (dieValue === 20) return shift(AMOUNTS.INCREASE, degree);
    if (dieValue === 1) return shift(AMOUNTS.LOWER, degree);
    return degree;
}

/**
 * The first applicable adjustment wins, and an adjustment can never push past the end it is already at —
 * "increase" does nothing to a critical success, "lower" nothing to a critical failure. Both exclusions are
 * pf2e's, and both matter: without them an Assurance-style adjustment would turn a critical failure into a
 * worse critical failure and the index would fall off the bottom.
 */
export function adjustmentFor(degree, adjustments) {
    for (const [outcome, adjustment] of Object.entries(adjustments ?? {})) {
        if (!adjustment) continue;
        const { amount } = adjustment;
        if (degree === CRITICAL_SUCCESS && amount === AMOUNTS.INCREASE) continue;
        if (degree === CRITICAL_FAILURE && amount === AMOUNTS.LOWER) continue;
        if (outcome === "all" || DEGREES.indexOf(outcome) === degree) return adjustment;
    }
    return null;
}

function shift(amount, degree) {
    const named = DEGREES.indexOf(amount);
    if (named >= 0) return named;
    return Math.min(CRITICAL_SUCCESS, Math.max(CRITICAL_FAILURE, degree + Number(amount)));
}

/**
 * The whole computation: band, then the die, then one adjustment.
 *
 * Returns the index, its key, and the unadjusted index — the same three things pf2e's own class exposes,
 * because the message flags want all of them.
 */
export function degreeOf({ dieValue, modifier = 0, total, dc, adjustments = null }) {
    const rollTotal = Number.isFinite(total) ? total : Number(dieValue) + Number(modifier);
    const unadjusted = applyNatural(bandFor(rollTotal, Number(dc)), Number(dieValue));
    const adjustment = adjustmentFor(unadjusted, adjustments);
    const value = adjustment ? shift(adjustment.amount, unadjusted) : unadjusted;

    return {
        value,
        key: DEGREES[value],
        unadjusted,
        unadjustedKey: DEGREES[unadjusted],
        adjustment,
        total: rollTotal,
    };
}
