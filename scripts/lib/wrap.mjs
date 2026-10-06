import { LIB_ID } from "../id.mjs";

/**
 * One place in the module that knows how to wrap a system method.
 *
 * This exists because of a bug that reached a release: two features registered a libWrapper wrapper for
 * `SpellcastingEntryPF2e#cast` under the same package id, libWrapper refused the second one by design, and
 * the throw took out the rest of the `setup` hook with it. The registry below turns that class of mistake
 * into an error naming *both* features at the moment it happens, and `build/test-riders.mjs` scans for it
 * statically so it never reaches a world at all.
 *
 * Two strategies, because the module genuinely needs both:
 *
 *  - `"auto"` (the default) uses libWrapper when it is installed and a plain prototype patch otherwise.
 *    libWrapper is the better neighbour — it chains with other modules wrapping the same method and reports
 *    conflicts — so it is used wherever it can be.
 *  - `"prototype"` always patches by hand, walking up to the prototype that actually declares the method.
 *    `ActorPF2e#applyDamage` needs this: it is declared once on the shared base and inherited by every
 *    actor type, and libWrapper would define the override on the one subclass it was given a path to,
 *    leaving NPCs — most of the things a Technique is aimed at — unwrapped.
 */

/** target path → the feature that claimed it, so a second claim can name the first. */
const claimed = new Map();

/**
 * Wrap a method. Returns true when the wrap took.
 *
 * `wrapper` is called libWrapper-style — `function (wrapped, ...args)`, with `this` bound to the document
 * — under either strategy, so a feature never has to know which one it got.
 *
 * @param {string} path       Dotted path to the method, e.g. `"CONFIG.PF2E.Item.documentClasses.x.prototype.y"`.
 *                            Must be a literal at the call site: the build scans for these.
 * @param {Function} wrapper  `function (wrapped, ...args)`.
 * @param {object} [options]
 * @param {string} options.feature    What breaks if this fails, for the log line and the conflict error.
 * @param {"MIXED"|"WRAPPER"|"OVERRIDE"} [options.type]  libWrapper type. Ignored by the plain patch.
 * @param {"auto"|"prototype"} [options.strategy]
 */
export function wrap(path, wrapper, { feature = path, type = "MIXED", strategy = "auto" } = {}) {
    const previous = claimed.get(path);
    if (previous) {
        throw new Error(
            `Isaac's Homebrew | ${path} is already wrapped by ${previous}; ${feature} cannot wrap it too. `
            + "Both belong in one wrapper — see scripts/cast-pipeline.mjs for how that is done.",
        );
    }

    const resolved = resolve(path, strategy);
    if (!resolved) {
        console.warn(`Isaac's Homebrew | could not find ${path}; ${feature} is off.`);
        return false;
    }

    if (strategy === "auto" && globalThis.libWrapper?.register) {
        libWrapper.register(LIB_ID, path, wrapper, type);
    } else {
        const { owner, name } = resolved;
        const original = owner[name];
        owner[name] = function (...args) {
            const wrapped = (...inner) => original.apply(this, inner);
            return wrapper.call(this, wrapped, ...args);
        };
    }

    claimed.set(path, feature);
    return true;
}

/** Test seam: the wraps a run has claimed, in the order they were claimed. */
export function wrappedTargets() {
    return [...claimed.keys()];
}

/**
 * Find the object that will be patched, or null if the method is not there.
 *
 * Under `"prototype"` the walk continues past objects that merely inherit the method until it reaches the
 * one that declares it — patching an inheriting object patches nothing for its siblings.
 */
function resolve(path, strategy) {
    const parts = path.split(".");
    const name = parts.pop();

    let owner = globalThis;
    for (const part of parts) {
        owner = owner?.[part];
        if (!owner) return null;
    }
    if (typeof owner[name] !== "function") return null;

    if (strategy === "prototype") {
        // The **shared base**, not the first prototype that happens to own the method.
        //
        // The walk used to stop at the first owner, which reads correctly — "climb past the objects that
        // merely inherit it" — and is wrong whenever the path names a subclass that overrides. pf2e's
        // `CharacterPF2e` declares its own `applyDamage`, so the walk stopped there and the patch went on
        // the character class alone. `NPCPF2e` inherits `ActorPF2e`'s, untouched.
        //
        // That is the exact failure this strategy exists to avoid, and it was total: **no damage rider in
        // the module had ever fired against an NPC**, which is almost everything a Technique is aimed at.
        // Driven live, a fire Strike took a dummy from 400 hit points to 368 and `applyDamage` was never
        // wrapped for it, so no `damage-applied` request was sent and nothing predicating on damage ran.
        //
        // So the walk continues to the **last** prototype that declares it and patches there. A subclass
        // override still runs — it calls `super`, which is the patched one.
        let base = null;
        for (let node = owner; node; node = Object.getPrototypeOf(node)) {
            if (Object.hasOwn(node, name)) base = node;
        }
        if (!base) return null;
        owner = base;
    }
    return { owner, name };
}
