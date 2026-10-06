/**
 * Which spells PF2e Assistant already automates, for the vanilla table to defer to.
 *
 * Its coverage lives in its bundled code — one block per automation, `path: ["Spells", "<rank>", "<name>"]`
 * followed by actions whose predicates name `item:<slug>` — so it cannot be read at runtime the way
 * pf2e-automations' `rules/config.json` can. This reads the installed bundle, keeps every candidate that is
 * a real pf2e spell slug (the index is the review: `item:rank`, `item:frightened` and spell-effect slugs fall
 * away), and writes `data/coverage/pf2e-assistant.json` with the version it came from. Re-run it when
 * PF2e Assistant updates:  npm run coverage:assistant
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(url.fileURLToPath(new URL(".", import.meta.url)), "..");
const DATA = process.env.FOUNDRY_DATA ?? path.join(process.env.LOCALAPPDATA ?? os.homedir(), "FoundryVTT", "Data");
const MODULE = path.join(DATA, "modules", "pf2e-assistant");
const OUT = path.join(ROOT, "data", "coverage", "pf2e-assistant.json");

const manifest = JSON.parse(fs.readFileSync(path.join(MODULE, "module.json"), "utf8"));
const source = manifest.esmodules.map((file) => fs.readFileSync(path.join(MODULE, file), "utf8")).join("\n");
const index = JSON.parse(fs.readFileSync(path.join(ROOT, "build", "data", "pf2e-index.json"), "utf8"));
const sluggify = (name) => name.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const starts = [...source.matchAll(/"Spells",\s*"[^"]+",\s*"([^"]+)"\s*\]/g)];
const slugs = new Set();
const unmatched = [];
starts.forEach((match, i) => {
    const block = source.slice(match.index, starts[i + 1]?.index ?? match.index + 4000);
    const candidates = [sluggify(match[1]), ...[...block.matchAll(/"item:([a-z0-9-]+)"/g)].map((m) => m[1])];
    const real = candidates.filter((slug) => index.spells[slug]);
    if (real.length === 0) unmatched.push(match[1]);
    for (const slug of real) slugs.add(slug);
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify({ module: manifest.id, version: manifest.version, slugs: [...slugs].sort() }, null, 4)}\n`);
console.log(`${manifest.id} ${manifest.version}: ${starts.length} spell automations → ${slugs.size} spell slugs → ${path.relative(ROOT, OUT)}`);
if (unmatched.length) console.log(`  no pf2e spell slug found for: ${unmatched.join(", ")}`);
