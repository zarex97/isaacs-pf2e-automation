import { wrap } from "./wrap.mjs";

/**
 * The one wrap on `game.pf2e.Check.rerollFromMessage`, and the stages that hang off it.
 *
 * Every reroll pf2e offers from a chat card — a hero point, a fortune feat, a misfortune imposed on someone —
 * goes through this one function, and it fires no hook first. A rule that says a creature "cannot benefit
 * from fortune effects" has to stop the reroll here or nowhere. Each such rule is a **stage**:
 * `(message, options) => truthy` to let the reroll go ahead, anything falsy to refuse it. A refusing stage
 * says why itself.
 *
 * A stage that throws is logged and treated as not objecting: whatever a feature wanted from a reroll, a
 * crash in it should not take the reroll away from everyone.
 */

const LOG = "Isaac's Homebrew |";
const stages = [];

export const RerollPipeline = {
    /**
     * @param {string} name
     * @param {number} priority   Ascending.
     * @param {(message: object, options: object) => unknown} fn  Truthy to allow the reroll.
     */
    before(name, priority, fn) {
        if (typeof fn !== "function") throw new Error(`${LOG} reroll stage "${name}" is not a function.`);
        if (stages.some((stage) => stage.name === name)) {
            throw new Error(`${LOG} the reroll pipeline already has a stage called "${name}".`);
        }
        stages.push({ name, priority, fn });
        stages.sort((a, b) => a.priority - b.priority);
    },

    stages() {
        return stages.map(({ name, priority }) => ({ name, priority }));
    },

    /** Resolves false when some stage refuses the reroll. */
    allows(message, options) {
        for (const stage of stages) {
            try {
                if (!stage.fn(message, options)) return false;
            } catch (error) {
                console.error(`${LOG} ${stage.name} failed before a reroll`, error);
            }
        }
        return true;
    },

    install() {
        wrap(
            "game.pf2e.Check.rerollFromMessage",
            function (wrapped, message, ...rest) {
                if (!RerollPipeline.allows(message, rest[0])) return undefined;
                return wrapped(message, ...rest);
            },
            { feature: "the reroll pipeline" },
        );
    },
};
