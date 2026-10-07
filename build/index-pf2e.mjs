/**
 * Index pf2e's own compendium, for checking the vanilla table offline.
 *
 * CI has no pf2e, and the system ships its packs as LevelDB only, so the table's slugs, effect uuids and
 * conditions cannot be checked against the real thing there. This reads the installed system's packs once
 * and writes what the checks need — small, stable, and committed — to `build/data/pf2e-index.json`, with the
 * pf2e version it came from. Re-run it when pf2e updates:
 *
 *     npm run index:pf2e                     # Foundry's default data folder
 *     FOUNDRY_DATA=D:/Foundry/Data npm run index:pf2e
 *
 * Foundry holds a lock on a pack while a world is open, so each pack is copied aside and read from there.
 */
import { ClassicLevel } from "classic-level";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import { plainText, trackedSlugs } from "./lib/spell-text.mjs";

const ROOT = path.resolve(url.fileURLToPath(new URL(".", import.meta.url)), "..");
const DATA = process.env.FOUNDRY_DATA ?? path.join(process.env.LOCALAPPDATA ?? os.homedir(), "FoundryVTT", "Data");
const SYSTEM = path.join(DATA, "systems", "pf2e");
const OUT = path.join(ROOT, "build", "data", "pf2e-index.json");
const TEXT_OUT = path.join(ROOT, "build", "data", "pf2e-spell-text.json");
const CLAUSES = path.join(ROOT, "Docs", "clauses");

const system = JSON.parse(fs.readFileSync(path.join(SYSTEM, "system.json"), "utf8"));
const packOf = (name) => system.packs.find((p) => p.name === name) ?? (() => { throw new Error(`pf2e has no pack "${name}"`); })();

/** Every top-level Item in a pack, read from a copy so a running world's lock does not matter. */
async function itemsOf(name) {
    const pack = packOf(name);
    const copy = fs.mkdtempSync(path.join(os.tmpdir(), `pf2e-${name}-`));
    // File by file, leaving LOCK behind: a running Foundry holds it open, and the copy needs its own.
    for (const file of fs.readdirSync(path.join(SYSTEM, pack.path))) {
        if (file !== "LOCK") fs.copyFileSync(path.join(SYSTEM, pack.path, file), path.join(copy, file));
    }
    const db = new ClassicLevel(copy, { valueEncoding: "json" });
    const items = [];
    try {
        for await (const [key, value] of db.iterator({ gte: "!items!", lt: "!items!~" })) {
            if (key.split("!").length === 3) items.push(value);
        }
    } finally {
        await db.close();
        fs.rmSync(copy, { recursive: true, force: true });
    }
    return { pack, items };
}

const uuid = (pack, id) => `Compendium.pf2e.${pack.name}.Item.${id}`;
const slugOf = (doc) => doc.system?.slug ?? null;

const spells = {};
const descriptions = {};
{
    const { pack, items } = await itemsOf("spells-srd");
    for (const doc of items) {
        const slug = slugOf(doc);
        if (!slug) continue;
        const s = doc.system;
        descriptions[slug] = s.description?.value ?? "";
        const overlays = Object.fromEntries(
            Object.entries(s.overlays ?? {}).map(([id, o]) => [id, { name: o.name ?? null, type: o.overlayType, area: o.system?.area ?? null }]),
        );
        spells[slug] = {
            uuid: uuid(pack, doc._id),
            name: doc.name,
            rank: s.level?.value ?? null,
            traits: [...(s.traits?.value ?? [])].sort(),
            save: s.defense?.save ? { statistic: s.defense.save.statistic, basic: !!s.defense.save.basic } : null,
            area: s.area?.type ? { type: s.area.type, value: s.area.value } : null,
            range: s.range?.value || null,
            target: s.target?.value || null,
            duration: s.duration?.value || null,
            ...(Object.keys(overlays).length ? { overlays } : {}),
        };
    }
}

/** Slug → uuid for a pack of effects or conditions. */
async function slugMap(name) {
    const { pack, items } = await itemsOf(name);
    return Object.fromEntries(items.filter(slugOf).map((doc) => [slugOf(doc), uuid(pack, doc._id)]).sort(([a], [b]) => a.localeCompare(b)));
}

const index = {
    pf2e: system.version,
    spells: Object.fromEntries(Object.entries(spells).sort(([a], [b]) => a.localeCompare(b))),
    effects: await slugMap("spell-effects"),
    conditions: await slugMap("conditionitems"),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(index, null, 1)}\n`);

// The words of every spell a clause tracker lists, for its clauses to be held to offline.
const tracked = new Set(fs.readdirSync(CLAUSES).filter((f) => f.endsWith(".md")).flatMap((f) => trackedSlugs(fs.readFileSync(path.join(CLAUSES, f), "utf8"))));
const text = { pf2e: system.version, spells: Object.fromEntries([...tracked].sort().filter((slug) => slug in descriptions).map((slug) => [slug, plainText(descriptions[slug])])) };
fs.writeFileSync(TEXT_OUT, `${JSON.stringify(text, null, 1)}\n`);
console.log(`${Object.keys(text.spells).length} tracked spells' text → ${path.relative(ROOT, TEXT_OUT)}`);
console.log(`pf2e ${index.pf2e}: ${Object.keys(index.spells).length} spells, ${Object.keys(index.effects).length} spell effects, ${Object.keys(index.conditions).length} conditions → ${path.relative(ROOT, OUT)}`);
