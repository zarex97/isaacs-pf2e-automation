/**
 * Where other code plugs into area targeting.
 *
 * Area targeting is generic — aim a Region, catch who is inside, set the targets — but the casts it serves
 * are not. A Gemini duplicate may not cast at all, a Saint projecting their astral body aims from somewhere
 * else, a Soulbound pays from a charge pool that decides how many areas go on the cursor, and three
 * Techniques leave something behind on the ground the caster just aimed at. Those used to be imported and
 * called by name from inside `AreaTargeting.run`, which tied the targeting code to every class that ever
 * needed a word in it.
 *
 * Each of them is now a registration. The registries are **awaited, in ascending priority** — several of
 * them open a dialog, and the after-aim ones read the preview Region before `run`'s `finally` discards it,
 * which a Foundry hook could not promise: `Hooks.call` does not wait for an async listener.
 */

const preAim = [];
const aimed = [];
const afterAim = [];
const origins = [];
const scopes = new Map();
let areaCount = null;

function add(list, what, name, priority, fn) {
    if (typeof fn !== "function") throw new Error(`Isaac's Homebrew | ${what} "${name}" is not a function.`);
    if (list.some((entry) => entry.name === name)) {
        throw new Error(`Isaac's Homebrew | area targeting already has a ${what} called "${name}".`);
    }
    list.push({ name, priority, fn });
    list.sort((a, b) => a.priority - b.priority);
}

const listed = (list) => list.map(({ name, priority }) => ({ name, priority }));

export const Extensions = {
    /**
     * Before anything is asked or aimed. Return `false` to refuse the cast; anything else lets it continue.
     * @param {(spell: object, options: object) => Promise<boolean | void> | boolean | void} fn
     */
    registerPreAim(name, priority, fn) {
        add(preAim, "pre-aim check", name, priority, fn);
    },

    /**
     * After a placement is aimed and in range, before the target review. Return a boolean to end the run
     * with that answer — a placement that is about a place rather than about people takes over here — or
     * `undefined` to carry on to the review.
     * @param {(config: object, regions: object[], originToken: object) => Promise<boolean | undefined> | boolean | undefined} fn
     */
    registerAimed(name, priority, fn) {
        add(aimed, "aimed handler", name, priority, fn);
    },

    /**
     * After the targets are set, while the confirmed Regions still exist.
     * @param {(config: object, regions: object[], originToken: object) => Promise<void> | void} fn
     */
    registerAfterAim(name, priority, fn) {
        add(afterAim, "after-aim step", name, priority, fn);
    },

    /**
     * Where a cast is measured from, when it is not the caster's own token. The first resolver to answer
     * with a token wins.
     * @param {(actor: object, item: object) => object | null} fn
     */
    registerOriginResolver(name, priority, fn) {
        add(origins, "origin resolver", name, priority, fn);
    },

    /**
     * Items that are aimed even though they carry no authored config, under the narrower scope setting.
     * @param {(item: object) => boolean} fn
     */
    registerScopePredicate(name, fn) {
        if (typeof fn !== "function") throw new Error(`Isaac's Homebrew | scope predicate "${name}" is not a function.`);
        if (scopes.has(name)) throw new Error(`Isaac's Homebrew | area targeting already has a scope predicate called "${name}".`);
        scopes.set(name, fn);
    },

    /**
     * How many areas this cast places. Answers a count (0 or 1 for the ordinary single area), or `false`
     * to refuse the cast. One per world: two answers to "how many" cannot both be right.
     * @param {(cast: object, options: object) => Promise<number | false> | number | false} fn
     */
    registerAreaCount(fn) {
        if (areaCount) throw new Error("Isaac's Homebrew | area targeting already has an area count.");
        areaCount = fn;
    },

    async preAim(spell, options) {
        for (const entry of preAim) {
            if ((await entry.fn(spell, options)) === false) return false;
        }
        return true;
    },

    async aimed(config, regions, originToken) {
        for (const entry of aimed) {
            const answer = await entry.fn(config, regions, originToken);
            if (answer !== undefined) return !!answer;
        }
        return undefined;
    },

    async afterAim(config, regions, originToken) {
        for (const entry of afterAim) await entry.fn(config, regions, originToken);
    },

    originFor(actor, item) {
        for (const entry of origins) {
            const token = entry.fn(actor, item);
            if (token) return token;
        }
        return null;
    },

    inScope(item) {
        for (const fn of scopes.values()) if (fn(item)) return true;
        return false;
    },

    async areaCount(cast, options) {
        return areaCount ? areaCount(cast, options) : 0;
    },

    /** Everything registered, in the order it runs, for the console and the tests. */
    registered() {
        return {
            preAim: listed(preAim),
            aimed: listed(aimed),
            afterAim: listed(afterAim),
            origins: listed(origins),
            scopes: [...scopes.keys()],
            areaCount: !!areaCount,
        };
    },
};
