import { LIB_ID } from "../id.mjs";

/**
 * Automation for content nobody authored for this module — pf2e's own spells, by slug.
 *
 * The table is the same config an item's flags would carry (`areaTargeting`, `riders`, …), kept beside the
 * module instead of on the item. Two sources fill it, read in this order after the item's own flags:
 *
 *  1. entries other modules **register** (`register(moduleId, { [slug]: entry })`), so a module can cover
 *     content in bulk without re-flagging every item;
 *  2. the module's own table, `data/vanilla.json`, built from `data/vanilla/<slug>.json`.
 *
 * Either may carry `variants: { [overlayId]: { …keys } }` for a spell variant whose config differs. The
 * bundle's `aliases` map a pre-remaster slug to the remaster one, so a character's legacy copy still matches.
 */

let table = { aliases: {}, entries: {} };
const registered = new Map();
let riderDeferral = () => null;

/** The package a compendium uuid comes from — `Compendium.<package>.<pack>.Item.<id>` — or null. */
function packageOf(uuid) {
    return /^Compendium\.([^.]+)\./.exec(String(uuid ?? ""))?.[1] ?? null;
}

/** The slug a document is known by: pf2e's own `slug`, or the source's. */
export function slugOf(doc) {
    return doc?.slug ?? doc?.system?.slug ?? null;
}

export const Vanilla = {
    /** Fetch the bundle. Every client, at `init`: the GM re-reads entries for relayed work as well. */
    async load() {
        try {
            const response = await fetch(`modules/${LIB_ID}/data/vanilla.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            Vanilla.setTable(await response.json());
        } catch (error) {
            console.warn("Isaac's PF2e Automation | the vanilla table could not be loaded; vanilla content runs unautomated.", error);
        }
    },

    /** For the tests, and for `load`. */
    setTable(bundle) {
        table = { aliases: bundle?.aliases ?? {}, entries: bundle?.entries ?? {} };
    },

    /**
     * Another module's entries: `{ [slug]: entry }`. A slug is taken once — a second module registering it
     * is refused, and says so, rather than one silently replacing the other.
     */
    register(moduleId, entries) {
        if (typeof moduleId !== "string" || !moduleId) throw new Error("Isaac's PF2e Automation | vanilla entries need the registering module's id.");
        for (const [slug, entry] of Object.entries(entries ?? {})) {
            if (!entry || typeof entry !== "object") continue;
            const taken = registered.get(slug);
            if (taken && taken.module !== moduleId) {
                console.warn(`Isaac's PF2e Automation | ${moduleId} cannot register "${slug}": ${taken.module} already has.`);
                continue;
            }
            registered.set(slug, { module: moduleId, entry });
        }
    },

    /** Everything registered, for the console: `{ [slug]: moduleId }`. */
    registered() {
        return Object.fromEntries([...registered].map(([slug, { module }]) => [slug, module]));
    },

    /** The slugs the module's own table covers. */
    covered() {
        return Object.keys(table.entries);
    },

    /**
     * Who decides whether a table rider defers to another module (step 3's coexistence setting):
     * `fn(slug)` → the id of the module that already covers it, or null.
     */
    setRiderDeferral(fn) {
        riderDeferral = typeof fn === "function" ? fn : () => null;
    },
    deferredTo(slug) {
        return riderDeferral(slug) ?? null;
    },

    /**
     * The entries for an item, in the order they are asked — a registered one, then the table's — each as
     * `{ entry, source: "registered" | "table", module, slug }`. Asked per key: a registered entry that says
     * nothing about `lingering` leaves the table's `lingering` standing.
     *
     * An item from another module's compendium never matches: a homebrew spell that happens to share a
     * vanilla slug is that module's content, authored (or not) on purpose. A registering module's own pack
     * items may match its own entries.
     */
    entriesFor(item) {
        const slug = slugOf(item);
        if (!slug) return [];
        const origin = packageOf(item._stats?.compendiumSource ?? item.flags?.core?.sourceId);
        const foreign = origin && origin !== "pf2e" && origin !== "world";
        const found = [];

        const mine = registered.get(slug);
        if (mine && (!foreign || origin === mine.module)) found.push({ ...mine, source: "registered", slug });
        if (foreign) return found;

        const canonical = table.entries[slug] ? slug : table.aliases[slug];
        if (canonical) found.push({ entry: table.entries[canonical], source: "table", module: LIB_ID, slug: canonical });
        return found;
    },
};
