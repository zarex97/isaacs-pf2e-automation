import { wrap } from "./wrap.mjs";

/**
 * The one wrap on `game.pf2e.Check.roll`, and the stages that hang off it.
 *
 * `Check.roll` is the last place a check can be changed before the die falls: the modifiers are collected,
 * `context.substitutions` and `context.rollTwice` are filled in, and nothing has been rolled. pf2e fires
 * no hook there, so anything that must act on a check before it resolves has to sit inside a wrap of it —
 * and `wrap.mjs` refuses a second claim on the same method, which is the fix for the one crash that reached
 * a release. The Soulbound's Strikes that ignore cover were its only consumer; the Stargazer's armed
 * Portent is the second. This is `damage-bus.mjs`'s shape, for checks.
 *
 * A stage is `(check, context) => context | void`. It may return a **new** context — the cover stage swaps
 * in a copy with a corrected DC — or mutate the one it was given, which matters for the arrays pf2e reads
 * back after the roll: a rule element's `removeAfterRoll: "if-enabled"` consults `context.substitutions` on
 * the caller's own context object, so a stage that means pf2e to see a change there edits that array in
 * place rather than replacing it.
 *
 * Stages run in ascending `priority` and are isolated: a stage that throws is logged by name and the check
 * is still rolled. Whatever a feature wanted from a check, the roll matters more.
 */

const stages = [];

export const CheckPipeline = {
    /**
     * @param {string} name       What breaks if it throws, for the log line.
     * @param {number} priority   Ascending.
     * @param {(check: object, context: object) => object | void} fn
     */
    before(name, priority, fn) {
        if (stages.some((stage) => stage.name === name)) {
            throw new Error(`Isaac's Homebrew | the check pipeline already has a stage called "${name}".`);
        }
        stages.push({ name, priority, fn });
        stages.sort((a, b) => a.priority - b.priority);
    },

    /** The stages in the order they run, for the console and the tests. */
    stages() {
        return stages.map(({ name, priority }) => ({ name, priority }));
    },

    install() {
        wrap(
            "game.pf2e.Check.roll",
            async function (wrapped, check, context = {}, ...rest) {
                for (const stage of stages) {
                    try {
                        const next = stage.fn(check, context);
                        if (next && typeof next === "object") context = next;
                    } catch (error) {
                        console.error(`Isaac's Homebrew | ${stage.name} failed before a check`, error);
                    }
                }
                return wrapped(check, context, ...rest);
            },
            { feature: "the check pipeline" },
        );
    },
};
