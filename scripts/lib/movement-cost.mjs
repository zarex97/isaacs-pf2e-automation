import { wrap } from "./wrap.mjs";

/**
 * The one wrap on a token's movement cost, and the stages that hang off it.
 *
 * Foundry prices a move one grid step at a time — `Token#_getMovementCostFunction` returns `(from, to, distance,
 * segment) → cost` — and a Region's terrain behaviors price it by where the step lands, not by which way it goes.
 * *Repulsion* is the case that needs the direction: "the creature treats each square in the area as difficult
 * terrain **when moving closer to you**." So each step is offered to the stages after Foundry has priced it, and a
 * stage may return a new cost. `from` and `to` are grid offsets (`{ i, j }`); `canvas.grid.getCenterPoint` turns
 * them into points. Stages are isolated: one that throws is logged and the step keeps its price.
 */

const stages = [];

export const MovementCost = {
    /**
     * @param {string} name
     * @param {number} priority   Ascending.
     * @param {(token: object, step: { from, to, distance, segment }, cost: number) => number | void} fn
     */
    after(name, priority, fn) {
        if (stages.some((stage) => stage.name === name)) {
            throw new Error(`Isaac's PF2e Automation | the movement cost already has a stage called "${name}".`);
        }
        stages.push({ name, priority, fn });
        stages.sort((a, b) => a.priority - b.priority);
    },

    stages() {
        return stages.map(({ name, priority }) => ({ name, priority }));
    },

    install() {
        wrap(
            "CONFIG.Token.objectClass.prototype._getMovementCostFunction",
            function (wrapped, ...args) {
                const priced = wrapped(...args);
                if (stages.length === 0) return priced;
                const token = this;
                return (from, to, distance, segment) => {
                    let cost = typeof priced === "function" ? priced(from, to, distance, segment) : distance;
                    for (const stage of stages) {
                        try {
                            const next = stage.fn(token, { from, to, distance, segment }, cost);
                            if (Number.isFinite(next)) cost = next;
                        } catch (error) {
                            console.error(`Isaac's PF2e Automation | ${stage.name} failed pricing a step`, error);
                        }
                    }
                    return cost;
                };
            },
            { feature: "movement cost", type: "WRAPPER" },
        );
    },
};
