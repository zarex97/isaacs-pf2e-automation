import { SpellFrequency } from "./economy/spell-frequency.mjs";
import { wrap } from "./lib/wrap.mjs";
import { configFor } from "./targeting/config.mjs";
import { AreaTargeting, VARIANT } from "./targeting/index.mjs";

/**
 * Where this pipeline's own stages fall. Leave gaps; a stage registered elsewhere slots between.
 *
 * Aiming comes first of the work so that backing out of a placement does not spend an allowance on a cast
 * that never happened, and the spell's own Frequency is spent last of the refusals: a spell that is going
 * to be turned away by any check before it must not have paid for it.
 */
export const CAST_PRIORITY = {
    aim: 10,
    spellFrequency: 50,
};

const stages = { before: [], after: [] };

function add(list, name, priority, fn) {
    if (typeof fn !== "function") throw new Error(`Isaac's Homebrew | cast stage "${name}" is not a function.`);
    if (list.some((stage) => stage.name === name)) {
        throw new Error(`Isaac's Homebrew | the cast pipeline already has a stage called "${name}".`);
    }
    list.push({ name, priority, fn });
    list.sort((a, b) => a.priority - b.priority);
}

/**
 * Everything the module does on the way to an ability reaching the table.
 *
 * Several features want a word before a spell is cast — the area is aimed, a caster who may not cast is
 * turned away, an allowance pays the Focus Point — and they all want it at `SpellcastingEntryPF2e#cast`,
 * which is where the point is spent. They used to register a wrapper each; libWrapper refuses two wrappers
 * for the same target from one package, so the second one threw and took the rest of `setup` with it.
 * There is one wrapper now, and the features are **stages** inside it, in ascending priority:
 *
 *  - `before(spell, options)` must resolve **truthy** for the cast to go ahead; anything falsy — `false`,
 *    or the `null` a closed dialog answers — refuses it. `options` is the object the system receives, so a
 *    stage may leave something on it for a later one.
 *  - `after(cast, spell)` runs once the spell has actually reached the table: `cast` is what was posted
 *    (a chosen variant, if there was one) and `spell` the one the caster owns.
 *
 * A stage that throws stops the cast, as it always did: a refusal that is skipped because it crashed would
 * let through a cast it existed to stop.
 */
export const CastPipeline = {
    /**
     * @param {string} name
     * @param {number} priority   Ascending; see `CAST_PRIORITY`.
     * @param {(spell: object, options: object) => Promise<unknown> | unknown} fn  Truthy to continue.
     */
    before(name, priority, fn) {
        add(stages.before, name, priority, fn);
    },

    /**
     * @param {string} name
     * @param {number} priority
     * @param {(cast: object, spell: object) => Promise<void> | void} fn
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

    /** This pipeline's own stages: aiming the area, and spending a spell's Frequency. */
    registerDefaults() {
        CastPipeline.before("area targeting", CAST_PRIORITY.aim, (spell, options) => AreaTargeting.run(spell, options));
        // pf2e never spends a *spell's* Frequency, so a spell that says "once per round" was limited by
        // nothing until this step existed.
        CastPipeline.before("spell frequency", CAST_PRIORITY.spellFrequency, (spell) => SpellFrequency.beforeCast(spell));
    },

    install() {
        // MIXED rather than WRAPPER: a cancelled placement returns without calling through.
        wrap(
            "CONFIG.PF2E.Item.documentClasses.spellcastingEntry.prototype.cast",
            async function (wrapped, spell, options = {}) {
                if (!(await CastPipeline.beforeCast(spell, options))) return;
                // A spell offered in two shapes decides which spell is actually cast: the line is a real
                // pf2e variant, and posting the original would announce the cone whatever was aimed.
                // `consume` already unwraps to `spell.original`, so the Focus Point still comes off the
                // spell the character owns.
                const cast = options[VARIANT] ?? spell;
                const result = await wrapped(cast, options);
                await CastPipeline.afterCast(cast, spell);
                return result;
            },
            { feature: "area targeting and free casts", type: "MIXED" },
        );

        // Actions never pass through `cast`; `toMessage` is where they reach the table instead, and the
        // Zenith activities are actions — a 60-foot emanation and a 60-foot line among them.
        //
        // Aimed at the ability class rather than at whichever prototype declares `toMessage`, because that
        // is `ItemPF2e` and patching there would put this guard in front of every weapon, consumable and
        // feat in the world for the sake of a handful of activities.
        wrap(
            "CONFIG.PF2E.Item.documentClasses.action.prototype.toMessage",
            async function (wrapped, event, options = {}) {
                if (configFor(this) && !(await AreaTargeting.run(this, {}))) return undefined;
                return wrapped(event, options);
            },
            { feature: "aiming an activity's area", type: "MIXED" },
        );
    },

    /** Resolves false when the cast should not go ahead. Mutates `options` — the system gets the same object. */
    async beforeCast(spell, options) {
        for (const stage of stages.before) {
            if (!(await stage.fn(spell, options))) return false;
        }
        return true;
    },

    /** After the spell has actually reached the table, never before. */
    async afterCast(cast, spell = cast) {
        for (const stage of stages.after) await stage.fn(cast, spell);
    },
};
