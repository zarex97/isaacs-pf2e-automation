/**
 * The vanilla table's sources, its bundle, and the checks every entry must pass.
 *
 * Sources: `content/vanilla/<slug>.json`, one spell each, in the shape item flags carry, plus
 * `content/vanilla/_aliases.json` (`{ legacySlug: remasterSlug }`). The bundle, `data/vanilla.json`, is what
 * the module fetches; `npm run build:vanilla` writes it and the tests fail when it is stale.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

export const ROOT = path.resolve(url.fileURLToPath(new URL(".", import.meta.url)), "..", "..");
export const SOURCES = path.join(ROOT, "content", "vanilla");
export const BUNDLE = path.join(ROOT, "data", "vanilla.json");
export const INDEX = path.join(ROOT, "build", "data", "pf2e-index.json");

const ALIASES = "_aliases.json";

/** The bundle the sources make: deterministic, so a stale one is a byte-for-byte difference. */
export function bundle() {
    const index = JSON.parse(fs.readFileSync(INDEX, "utf8"));
    const files = fs.existsSync(SOURCES) ? fs.readdirSync(SOURCES).filter((f) => f.endsWith(".json") && f !== ALIASES).sort() : [];
    const entries = Object.fromEntries(files.map((f) => [f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(SOURCES, f), "utf8"))]));
    const aliasFile = path.join(SOURCES, ALIASES);
    const aliases = fs.existsSync(aliasFile) ? JSON.parse(fs.readFileSync(aliasFile, "utf8")) : {};
    return { pf2e: index.pf2e, aliases: Object.fromEntries(Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b))), entries };
}

export const serialise = (value) => `${JSON.stringify(value, null, 4)}\n`;

/**
 * Everything wrong with one entry, as readable lines; empty when it is sound.
 *
 * `ctx`: `{ index, authoredKeys, events, outcomes, applyTypes, areaShapes, affects, i18nKeys }` — the facts
 * the checks lean on, passed in so the tests can hand the same function a fixture.
 */
export function problemsWith(slug, entry, ctx) {
    const problems = [];
    const at = (where, what) => problems.push(`${slug}${where ? ` ${where}` : ""}: ${what}`);
    const spell = ctx.index.spells[slug];
    if (!spell) at("", "no pf2e spell has this slug");
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return at("", "an entry is an object"), problems;

    const keysOf = (where, object) => {
        for (const key of Object.keys(object)) {
            if (key === "variants" && where === "") continue;
            if (!ctx.authoredKeys.includes(key)) at(where, `"${key}" is not an authored key`);
        }
    };
    keysOf("", entry);
    for (const [id, variant] of Object.entries(entry.variants ?? {})) {
        if (spell && !spell.overlays?.[id]) at(`variants.${id}`, "the spell has no overlay with this id");
        keysOf(`variants.${id}`, variant ?? {});
        checkKeys(`variants.${id}`, variant ?? {});
    }
    checkKeys("", entry);
    return problems;

    function checkKeys(where, object) {
        const area = object.areaTargeting;
        if (area !== undefined && area !== false) {
            if (area.area && !ctx.areaShapes.includes(area.area.type)) at(`${where} areaTargeting.area`, `unknown shape "${area.area.type}"`);
            if (area.area && !(Number(area.area.value) > 0)) at(`${where} areaTargeting.area`, "a size in feet");
            if (area.affects && !ctx.affects.includes(area.affects)) at(`${where} areaTargeting.affects`, `"${area.affects}" is not one of ${ctx.affects.join(", ")}`);
            for (const n of ["maxTargets", "range"]) if (area[n] !== undefined && !(Number(area[n]) > 0)) at(`${where} areaTargeting.${n}`, "a positive number");
        }
        if (object.riders !== undefined && object.riders !== false) {
            if (!Array.isArray(object.riders)) at(`${where} riders`, "a list");
            else object.riders.forEach((rider, i) => checkRider(`${where} riders[${i}]`.trim(), rider));
        }
        walkText(where, object);
    }

    function checkRider(where, rider) {
        if (!rider || typeof rider !== "object") return at(where, "a rider is an object");
        if (rider.event !== undefined && !ctx.events.includes(rider.event)) at(where, `unknown event "${rider.event}"`);
        for (const outcome of rider.outcomes ?? []) if (!ctx.outcomes.includes(outcome)) at(where, `unknown outcome "${outcome}"`);
        const apply = rider.apply ?? {};
        if (!ctx.applyTypes.includes(apply.type)) at(`${where}.apply`, `"${apply.type}" is not a built-in apply type`);
        if (apply.type === "condition" && !ctx.index.conditions[apply.slug]) at(`${where}.apply`, `no pf2e condition "${apply.slug}"`);
        if (apply.type === "effect" && !Object.values(ctx.index.effects).includes(apply.uuid)) at(`${where}.apply`, `no pf2e spell effect ${apply.uuid}`);
        if (apply.type === "save" && !["fortitude", "reflex", "will"].includes(apply.statistic)) at(`${where}.apply`, `a save is fortitude, reflex or will, not "${apply.statistic}"`);
        for (const list of ["riders", "onAllHit"]) (apply[list] ?? []).forEach((r, i) => checkRider(`${where}.apply.${list}[${i}]`, r));
        (apply.options ?? []).forEach((o, i) => (o.riders ?? []).forEach((r, j) => checkRider(`${where}.apply.options[${i}].riders[${j}]`, r)));
    }

    /** Words in an entry are i18n keys under ISAACS_AUTOMATION.Vanilla, and each must exist. */
    function walkText(where, value, field = null) {
        if (typeof value === "string" && ["text", "prompt", "label", "title", "note"].includes(field)) {
            if (!value.startsWith("ISAACS_AUTOMATION.Vanilla.")) at(where, `${field} must be an i18n key under ISAACS_AUTOMATION.Vanilla, not "${value}"`);
            else if (!ctx.i18nKeys.has(value)) at(where, `${value} is not in lang/en.json`);
        } else if (Array.isArray(value)) value.forEach((v) => walkText(where, v, field));
        else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walkText(where, v, k);
    }
}

/** Problems with the alias map: every target is an entry, and no alias shadows a real pf2e slug. */
export function aliasProblems(aliases, entries, index) {
    const problems = [];
    for (const [legacy, remaster] of Object.entries(aliases)) {
        if (!entries[remaster]) problems.push(`alias ${legacy} → ${remaster}: no entry for ${remaster}`);
        if (index.spells[legacy]) problems.push(`alias ${legacy}: pf2e still has a spell with this slug`);
    }
    return problems;
}
