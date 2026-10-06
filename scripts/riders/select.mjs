import { testPredicate } from "../lib/roll-options.mjs";

/**
 * Which riders an event earns, given a snapshot of the world.
 *
 * Kept free of Foundry so it can be exercised without one: everything it needs arrives as arguments, and
 * the escalation behaviour the content depends on — one step per hit, never four at once — is a property
 * of this function rather than of the order things happen to be applied in.
 */
export function selectRiders(candidates, { outcome, options }) {
    return candidates.filter(({ rider }) => matches(rider, { outcome, options }));
}

export function matches(rider, { outcome, options }) {
    if (!outcomeMatches(rider, outcome)) return false;
    return testPredicate(rider.predicate, options);
}

/**
 * A rider without `outcomes` fires on any outcome.
 *
 * That is what "needles land on any attack you make, hit or miss" needs, and writing out all four degrees
 * to say "I do not care" would invite one of them being left off by accident.
 */
export function outcomeMatches(rider, outcome) {
    if (!Array.isArray(rider.outcomes)) return true;
    return rider.outcomes.includes(outcome);
}
