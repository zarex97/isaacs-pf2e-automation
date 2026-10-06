import { wrap } from "./wrap.mjs";

/**
 * The one wrap on a character's `prepareDerivedData`, and the stages that hang off it.
 *
 * pf2e finishes preparing a character in `prepareDerivedData`, after every rule element has run — which is
 * exactly when a number pf2e derives can still be corrected and nothing later will overwrite it: a focus
 * pool sized by level rather than by spells known, a cap on `doomed.max` that pf2e assigns after the rule
 * elements, an action cost pf2e has no alteration for. `wrap.mjs` allows one wrapper per method, so each of
 * those is a **stage**: `(actor) => void`, run after the system's own preparation, in ascending priority.
 *
 * Stages are isolated: a stage that throws is logged by name and the others still run, so one broken
 * correction costs that correction and not the actor.
 */

const LOG = "Isaac's Homebrew |";
const stages = [];

export const ActorPreparation = {
    /**
     * @param {string} name       What breaks if it throws, for the log line.
     * @param {number} priority   Ascending.
     * @param {(actor: object) => void} fn  Runs synchronously, inside data preparation.
     */
    after(name, priority, fn) {
        if (typeof fn !== "function") throw new Error(`${LOG} preparation stage "${name}" is not a function.`);
        if (stages.some((stage) => stage.name === name)) {
            throw new Error(`${LOG} character preparation already has a stage called "${name}".`);
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
            "CONFIG.PF2E.Actor.documentClasses.character.prototype.prepareDerivedData",
            function (wrapped, ...args) {
                const result = wrapped(...args);
                for (const stage of stages) {
                    try {
                        stage.fn(this);
                    } catch (error) {
                        console.error(`${LOG} ${stage.name} failed while preparing ${this?.name}`, error);
                    }
                }
                return result;
            },
            { feature: "character preparation" },
        );
    },
};
