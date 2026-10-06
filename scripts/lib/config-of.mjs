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
        return { value, source: found.source, module: found.module, off: false, deferred: null, slug: found.slug };
    }
    return none();
}

/** An authored key's value: the item's own, else a registered entry's, else the vanilla table's. */
export function configOf(doc, key) {
    return sourceOf(doc, key).value;
}

function none() {
    return { value: undefined, source: null, module: null, off: false, deferred: null, slug: null };
}
