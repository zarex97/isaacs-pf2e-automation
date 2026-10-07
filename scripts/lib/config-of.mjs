import { Vanilla } from "../vanilla/table.mjs";
import { flagOf, flagScopes } from "./flags.mjs";

/**
 * The keys a piece of content is *authored* with — the ones a table entry may supply.
 *
 * Everything else read off a document is state the module wrote itself (receipts, markers, a Region's
 * bookkeeping) and goes through `flagOf` alone: no table can answer for it.
 */
export const AUTHORED_KEYS = Object.freeze([
    "areaTargeting",
    "areaTargetingShapes",
    "riders",
    "lingering",
    "overlap",
    "bypass",
    "counterThresholds",
    // What a spell needs before it is cast — *Weapon Storm*'s "a weapon you're holding" (`vanilla/requires.mjs`).
    "requires",
]);

/** The scope an item's own value for `key` was found in, or null. */
function scopeWith(doc, key) {
    return flagScopes().find((scope) => doc?.flags?.[scope]?.[key] !== undefined) ?? null;
}

/**
 * An authored key, with where it came from.
 *
 * `{ value, source, module, off, deferred }`:
 *  - `source` — `"flags"` (the item's own, in `module`'s scope), `"registered"` (an entry `module`
 *    registered), `"table"` (this module's vanilla table), or null;
 *  - `off` — the item says `false` for this key: nothing applies, not even a table entry;
 *  - `deferred` — a table rider left to `deferred`, a module that already covers this spell.
 *
 * Order: the item's flags, then registered entries, then the table; a cast variant's `variants[overlayId]`
 * keys over its entry's.
 */
export function sourceOf(doc, key) {
    const own = flagOf(doc, key);
    if (own === false) return { value: undefined, source: "flags", module: scopeWith(doc, key), off: true, deferred: null };
    if (own !== undefined) return { value: own, source: "flags", module: scopeWith(doc, key), off: false, deferred: null };
    if (!AUTHORED_KEYS.includes(key) || doc?.documentName !== "Item") return none();

    for (const found of Vanilla.entriesFor(doc)) {
        const variant = doc.variantId ? found.entry.variants?.[doc.variantId] : null;
        const value = variant && key in variant ? variant[key] : found.entry[key];
        if (value === undefined) continue;
        if (value === false) return none();

        if (key === "riders") {
            const deferred = Vanilla.deferredTo(found.slug);
            if (deferred) return { value: undefined, source: found.source, module: found.module, off: false, deferred };
        }
        return { value: localized(value), source: found.source, module: found.module, off: false, deferred: null, slug: found.slug };
    }
    return none();
}

/** An authored key's value: the item's own, else a registered entry's, else the vanilla table's. */
export function configOf(doc, key) {
    return sourceOf(doc, key).value;
}

/**
 * An entry's words, in the table's language.
 *
 * A table entry names its text by i18n key (`ISAACS_AUTOMATION.Vanilla.<slug>.…`) rather than in English, so
 * every string in it that is a key is translated as it is read, and the engine prints it as it would an
 * item's own text. Cached per value: riders are read on every event.
 */
const translated = new WeakMap();
function localized(value) {
    const i18n = globalThis.game?.i18n;
    if (!i18n?.has || value === null || typeof value !== "object") return typeof value === "string" && i18n?.has?.(value) ? i18n.localize(value) : value;
    if (translated.has(value)) return translated.get(value);
    const walk = (v) => {
        if (typeof v === "string") return i18n.has(v) ? i18n.localize(v) : v;
        if (Array.isArray(v)) return v.map(walk);
        if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
        return v;
    };
    const out = walk(value);
    translated.set(value, out);
    return out;
}

function none() {
    return { value: undefined, source: null, module: null, off: false, deferred: null, slug: null };
}
