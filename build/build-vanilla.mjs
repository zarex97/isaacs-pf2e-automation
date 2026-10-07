/** Write `data/vanilla.json` and `Docs/vanilla.md` from `content/vanilla/`. The tests fail when either is stale. */
import fs from "node:fs";
import path from "node:path";
import { BUNDLE, DOC, INDEX, ROOT, bundle, docs, serialise } from "./lib/vanilla.mjs";

const built = bundle();
fs.mkdirSync(path.dirname(BUNDLE), { recursive: true });
fs.writeFileSync(BUNDLE, serialise(built));
const index = JSON.parse(fs.readFileSync(INDEX, "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(ROOT, "lang", "en.json"), "utf8"));
fs.writeFileSync(DOC, docs(built, index, en));
console.log(`${Object.keys(built.entries).length} entries, ${Object.keys(built.aliases).length} aliases (pf2e ${built.pf2e}) → ${path.relative(ROOT, BUNDLE)}, ${path.relative(ROOT, DOC)}`);
