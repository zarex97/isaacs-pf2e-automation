import { LIB_ID } from "../id.mjs";

/**
 * Riders that may fire once a round, and no more.
 *
 * > **Tensa Zangetsu** — The **first time each round** you hit with your spirit weapon, you may **Step**
 * > as a free action.
 *
 * The rider machinery has `outcomes` and `predicate` and nothing that counts. So this one shipped as a
 * prompt with a note in its own JSON admitting the gap — *"Once per round; pf2e has no per-round gate on
 * a rider, so the card says once"* — and it then said so on the second hit, and the third, which is the
 * one thing the clause forbids.
 *
 * pf2e's `frequency` is the wrong tool: it belongs to an item the player *uses*, and it is spent by the
 * use rather than by the outcome. This fires off somebody else's Strike landing.
 *
 * So the count is kept where the allowance belongs — on the creature the rider is for — as one stamp per
 * rider naming the round it last fired in. `combat.id` is part of the stamp so a stale one from the last
 * encounter cannot suppress the first hit of the next, and the stamp is left behind rather than cleaned
 * up: it is two short strings, and a sweep would need a hook on every way a combat can end.
 *
 * **Out of combat there is no round**, so nothing is gated. A per-round allowance outside an encounter is
 * a sentence with no referent, and refusing the prompt there would be enforcing a rule the table cannot
 * see the boundaries of.
 */

const FLAG = "riderRounds";

/** The round we are in, as a stamp, or null when there is no encounter running. */
export function roundKey(combat = game.combat) {
    if (!combat?.started) return null;
    return `${combat.id}:${combat.round}`;
}

/**
 * What a rider is called in the ledger. Its source item and its position in that item's list.
 *
 * Joined with `-` and not `.`, because a flag key containing a dot is a *path*: Foundry expands
 * `setFlag(id, "riderRounds", {"abc.0": stamp})` into `{abc: {0: stamp}}`, and the very next read of
 * `ledger["abc.0"]` is `undefined`. The gate then stamped the ledger on every hit and let every hit
 * through — a counter that writes and never reads.
 */
export function riderKey(item, index) {
    return `${item?.id ?? "unknown"}-${index ?? 0}`;
}

/**
 * Has this rider already fired this round? Pure, so the decision can be tested without a combat.
 *
 * A null `key` is "no encounter", which is never spent.
 */
export function alreadySpent(ledger, key, stamp) {
    if (!stamp) return false;
    return (ledger ?? {})[key] === stamp;
}

/**
 * Take this round's use, or refuse.
 *
 * Writes before the rider is applied rather than after: an apply that throws has still consumed the
 * round's use, which is the safer of the two mistakes — the alternative is a rider that fires twice
 * because the first attempt failed halfway through.
 */
export async function claimRound(actor, item, index) {
    const stamp = roundKey();
    if (!stamp) return true;
    const key = riderKey(item, index);
    const ledger = actor?.getFlag?.(LIB_ID, FLAG) ?? {};
    if (alreadySpent(ledger, key, stamp)) return false;
    await actor?.setFlag?.(LIB_ID, FLAG, { ...ledger, [key]: stamp });
    return true;
}

/**
 * Drop the riders that have already had their round, keeping everything else in order.
 *
 * `oncePerRound` is opt-in: a rider that does not ask for it is not consulted, so nothing that works
 * today changes behaviour.
 */
export async function gateByRound(candidates, actor) {
    const kept = [];
    for (const candidate of candidates) {
        if (candidate.rider?.oncePerRound !== true) {
            kept.push(candidate);
            continue;
        }
        if (await claimRound(actor, candidate.item, candidate.index)) kept.push(candidate);
    }
    return kept;
}
