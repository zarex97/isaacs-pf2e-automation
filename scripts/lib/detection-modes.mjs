import { wrap } from "./wrap.mjs";

/**
 * The one wrap on a token's `_prepareDetectionModes`, and the stages that hang off it.
 *
 * pf2e turns a creature's senses into Foundry detection modes here, and hands some of them to Foundry with
 * no range at all — see-invisibility among them. A sense that is only good within some distance has to be
 * corrected after pf2e is done and before Foundry reads it, which is this method and nowhere else. Each
 * correction is a **stage**: `(tokenDocument) => void`, run after the system's own preparation, in
 * ascending priority, isolated so one failing stage does not cost the token its vision.
 */

const LOG = "Isaac's Homebrew |";
const stages = [];

export const DetectionModes = {
    /**
     * @param {string} name
     * @param {number} priority   Ascending.
     * @param {(token: object) => void} fn  Runs synchronously; edit `token.detectionModes` in place.
     */
    after(name, priority, fn) {
        if (typeof fn !== "function") throw new Error(`${LOG} detection stage "${name}" is not a function.`);
        if (stages.some((stage) => stage.name === name)) {
            throw new Error(`${LOG} detection modes already have a stage called "${name}".`);
        }
        stages.push({ name, priority, fn });
        stages.sort((a, b) => a.priority - b.priority);
    },

    stages() {
        return stages.map(({ name, priority }) => ({ name, priority }));
    },

    install() {
        wrap(
            "CONFIG.Token.documentClass.prototype._prepareDetectionModes",
            function (wrapped, ...args) {
                const result = wrapped(...args);
                for (const stage of stages) {
                    try {
                        stage.fn(this);
                    } catch (error) {
                        console.error(`${LOG} ${stage.name} failed preparing ${this?.name}'s senses`, error);
                    }
                }
                return result;
            },
            { feature: "detection modes", type: "WRAPPER" },
        );
    },
};
