/**
 * The arithmetic of pf2e's conditions, apart from Foundry, so it can be held to the rules offline.
 *
 * Each function answers one sentence of a condition's text (`Docs/clauses/pf2e-conditions.md`); the module
 * around it (`index.mjs`) reads the actor, asks, and writes the answer back.
 */

/** A creature regains three actions at the start of its turn — four, quickened. */
export const BASE_ACTIONS = 3;

/**
 * What the start of a turn does to a creature's actions (CND-33a, CND-36b, CND-37c, CND-37e).
 *
 * "When you regain your actions, reduce the number of actions regained by your slowed value." "Each time you
 * regain actions, reduce the number you regain by your stunned value, then reduce your stunned value by the
 * number of actions you lost." "Stunned overrides Slowed": while stunned, slowed takes nothing.
 */
export function actionsAtTurnStart({ stunned = 0, slowed = 0, quickened = false } = {}) {
    const offered = BASE_ACTIONS + (quickened ? 1 : 0);
    const stunnedLost = Math.min(stunned, offered);
    const slowedLost = stunned > 0 ? 0 : Math.min(slowed, offered);
    return { offered, regained: offered - stunnedLost - slowedLost, lostToStunned: stunnedLost, lostToSlowed: slowedLost, stunnedLeft: stunned - stunnedLost };
}

/** "As with all penalties to your Speed, this can't reduce your Speed below 5 feet" (CND-13d). */
export function flooredSpeed({ base, value, penalized }) {
    if (!penalized || !(base >= 5) || value >= 5) return value;
    return 5;
}

/**
 * The dying value a creature takes when knocked out or hurt while dying (CND-12d, CND-39k, CND-43c).
 *
 * Reduced to 0 Hit Points: dying 1, or 2 if the blow was a critical hit or a critically failed save, plus the
 * wounded value. Already dying and hurt again: dying rises by 1, or by 2 on such a blow.
 */
export function dyingAfterDamage({ dying = 0, wounded = 0, critical = false, knockedOut = false }) {
    const step = critical ? 2 : 1;
    if (dying > 0) return dying + step;
    return knockedOut ? step + wounded : 0;
}

/** A recovery check's change to dying, by degree of success (0 critical failure … 3 critical success). */
export function recoveryStep(degree) {
    return [2, 1, -1, -2][degree] ?? 0;
}

/** "If it ever reaches dying 4, you die" — dying 4 less doomed (CND-12b, CND-10c). */
export function diesAt({ dying = 0, max = 4 }) {
    return dying >= Math.max(0, max);
}

/**
 * The flat checks a condition asks of its holder before an action takes effect (CND-09d, CND-20b, CND-38c).
 * `traits` are the action's or the spell's; `spell` says it is a Cast a Spell. Returns the hardest DC owed,
 * and the condition that owes it, or null.
 */
export function flatCheckOwed({ conditions = {}, traits = [], spell = false }) {
    const owed = [];
    if (conditions.deafened && traits.includes("auditory")) owed.push({ slug: "deafened", dc: 5 });
    if (conditions.grabbed && traits.includes("manipulate")) owed.push({ slug: "grabbed", dc: 5 });
    if (conditions.stupefied && spell) owed.push({ slug: "stupefied", dc: 5 + conditions.stupefied });
    return owed.sort((a, b) => b.dc - a.dc)[0] ?? null;
}

/**
 * What a condition refuses its holder (CND-24a, CND-29b, CND-31a, CND-32c, CND-34b, CND-37a, CND-39a): `action`, `cast`,
 * `attack`, or an action trait, with the slugs it lets through. Paralyzed may still Recall Knowledge;
 * restrained may still Escape and Force Open its bonds.
 */
export const REFUSES = {
    paralyzed: { refuses: ["action", "cast", "attack"], except: ["recall-knowledge"] },
    petrified: { refuses: ["action", "cast", "attack"], except: [] },
    stunned: { refuses: ["action", "cast", "attack"], except: [] },
    unconscious: { refuses: ["action", "cast", "attack"], except: [] },
    immobilized: { refuses: ["move"], except: [] },
    // CND-32c: "The only move actions you can use while you're prone are Crawl and Stand."
    prone: { refuses: ["move"], except: ["crawl", "stand"] },
    // CND-05c, CND-17c: "you can't Delay, Ready, …" — Ready is an action; Delay is the encounter tracker's.
    confused: { refuses: [], except: [], slugs: ["ready"] },
    fleeing: { refuses: [], except: [], slugs: ["ready"] },
    restrained: { refuses: ["attack", "manipulate"], except: ["escape", "force-open"] },
};

/** The condition that refuses this use, or null: `held` are the holder's active condition slugs. */
export function refusedBy({ held = [], what = [], slug = null }) {
    for (const condition of held) {
        const rule = REFUSES[condition];
        if (!rule || (slug && rule.except.includes(slug))) continue;
        if (what.some((w) => rule.refuses.includes(w)) || (slug && (rule.slugs ?? []).includes(slug))) return condition;
    }
    return null;
}

/**
 * What the attacker owes before attacking this target (CND-08a, CND-22d, CND-26b, CND-40e): the DC, or 0.
 * A target that is concealed to the attacker is the concealment gate's (`riders/unobserved.mjs`), so it is
 * left out here; an invisible target the attacker cannot see through is undetected to it.
 */
export function attackFlatCheck({ attacker = {}, target = {}, concealedAlready = false }) {
    if (concealedAlready) return 0;
    if (target.hidden || target.undetected || target.unnoticed || target.invisible) return 11;
    if (attacker.dazzled) return 5;
    return 0;
}

/** Is the target off-guard to this attacker, because the attacker is hidden from or undetected by it (CND-22c, CND-40c)? */
export function offGuardToUnseen({ attacker = {} }) {
    return !!(attacker.hidden || attacker.undetected || attacker.unnoticed || attacker.invisible);
}

/** Speed doubled on every normal square for a blinded creature (CND-01b): a step's cost, given its normal cost. */
export function blindedStepCost(cost, distance) {
    return cost <= distance ? distance * 2 : cost;
}
