import { wrap } from "./wrap.mjs";

/**
 * The one wrap on `applyDamage`, and the stages that hang off it.
 *
 * pf2e emits nothing when damage lands, so anything that must see it — the IWR bypass, the rider engine,
 * Libra's halved healing, the Soulbound's refused wound and suppressed Regeneración — has to sit inside a
 * wrap of `ActorPF2e#applyDamage`. `wrap.mjs` refuses a second claim on the same method by design (that
 * refusal is the fix for the one crash that reached a release), so there can only ever be one wrapper,
 * and for a while every new consumer was pasted into it as another `try` block. By the fifth, the rider
 * engine was importing Soulbound code to call it, and the Assimilator brings at least four more.
 *
 * So the wrapper owns nothing but the order, and each consumer registers a **stage**:
 *
 *  - `before(actor, params)` runs before the damage is applied and may return an **undo**, which is
 *    called in a `finally` whatever happens — the IWR bypass shadows a target's Hardness and resistances
 *    for exactly one application, and a throw must never leave them lowered.
 *  - `after(actor, params, before)` runs after it, with the target's hit points from before the call, so
 *    "reduced to 0" and "regained N" are readings rather than inferences.
 *
 * Stages run in ascending `priority`. Each one is isolated: a stage that throws is logged by name and the
 * others still run, so one broken feature costs that feature and not the damage. Leave gaps between
 * priorities, so a new stage can slot between two existing ones.
 */

const stages = { before: [], after: [] };

function add(list, name, priority, fn) {
    if (list.some((stage) => stage.name === name)) {
        throw new Error(`Isaac's Homebrew | the damage bus already has a stage called "${name}".`);
    }
    list.push({ name, priority, fn });
    list.sort((a, b) => a.priority - b.priority);
}

export const DamageBus = {
    /**
     * @param {string} name       What breaks if it throws, for the log line.
     * @param {number} priority   Ascending.
     * @param {(actor: object, params: object) => (void | (() => void))} fn
     */
    before(name, priority, fn) {
        add(stages.before, name, priority, fn);
    },

    /**
     * @param {string} name
     * @param {number} priority
     * @param {(actor: object, params: object, before: number) => Promise<void> | void} fn
     */
    after(name, priority, fn) {
        add(stages.after, name, priority, fn);
    },

    /** The stages in the order they run, for the console and the tests. */
    stages() {
        return {
            before: stages.before.map(({ name, priority }) => ({ name, priority })),
            after: stages.after.map(({ name, priority }) => ({ name, priority })),
        };
    },

    install() {
        // `applyDamage` is declared on ActorPF2e and inherited by every actor type, so this asks for the
        // plain prototype patch: libWrapper would define its override on the single subclass it was handed a
        // path to, leaving NPCs — most of what anything is aimed at — unwrapped. `strategy: "prototype"`
        // walks up to the prototype that declares it and patches there.
        wrap(
            "CONFIG.PF2E.Actor.documentClasses.character.prototype.applyDamage",
            async function (wrapped, params) {
                const before = this.hitPoints?.value ?? 0;

                const undo = [];
                for (const stage of stages.before) {
                    try {
                        const restore = stage.fn(this, params);
                        if (typeof restore === "function") undo.push(restore);
                    } catch (error) {
                        console.error(`Isaac's Homebrew | ${stage.name} failed before damage`, error);
                    }
                }

                let result;
                try {
                    result = await wrapped(params);
                } finally {
                    // Last in, first out: a later stage may have shadowed something an earlier one did.
                    for (const restore of undo.reverse()) {
                        try {
                            restore();
                        } catch (error) {
                            console.error("Isaac's Homebrew | a damage stage could not undo itself", error);
                        }
                    }
                }

                for (const stage of stages.after) {
                    try {
                        await stage.fn(this, params, before);
                    } catch (error) {
                        console.error(`Isaac's Homebrew | ${stage.name} failed after damage`, error);
                    }
                }
                return result;
            },
            { feature: "the damage bus", strategy: "prototype" },
        );
    },
};
