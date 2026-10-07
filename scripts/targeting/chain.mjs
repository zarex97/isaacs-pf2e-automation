/**
 * Targets that have to form a chain.
 *
 * *Chain Lightning*: "the electricity arcs to another creature within 30 feet of the first target, jumps to
 * another creature within 30 feet of that target, and so on … You can't target the same creature more than
 * once." The caster picks the creatures; the chain is the order they are struck in, and it only has to
 * exist — the caster does not have to have clicked them in that order.
 *
 * So the question is whether *some* order links them: a path through every target where each step is within
 * the link distance. With a handful of targets a search is instant; the step budget keeps a table that
 * selected half the map from hanging the client, and answers "no chain" rather than guessing.
 */

const BUDGET = 200_000;

/**
 * An order of `items` in which each is within `link` of the one before, or null when there is none.
 * `distance(a, b)` measures between two items; `canStart(item)` says which may be struck first — the one
 * the caster reaches, within the spell's range.
 */
export function chainOrder(items, distance, link, canStart = () => true) {
    const n = items.length;
    if (n === 0) return [];
    if (n === 1) return canStart(items[0]) ? items.slice() : null;
    const used = new Array(n).fill(false);
    const path = [];
    let steps = 0;

    const walk = () => {
        if (path.length === n) return true;
        if (++steps > BUDGET) return false;
        const last = path.at(-1);
        for (let i = 0; i < n; i++) {
            if (used[i]) continue;
            if (last === undefined && !canStart(items[i])) continue;
            if (last !== undefined && distance(items[last], items[i]) > link) continue;
            used[i] = true;
            path.push(i);
            if (walk()) return true;
            path.pop();
            used[i] = false;
        }
        return false;
    };

    return walk() ? path.map((i) => items[i]) : null;
}
