/** Write `data/vanilla.json` from `content/vanilla/`. The tests fail when the committed bundle is stale. */
import fs from "node:fs";
import path from "node:path";
import { BUNDLE, ROOT, bundle, serialise } from "./lib/vanilla.mjs";

const built = bundle();
fs.mkdirSync(path.dirname(BUNDLE), { recursive: true });
fs.writeFileSync(BUNDLE, serialise(built));
console.log(`${Object.keys(built.entries).length} entries, ${Object.keys(built.aliases).length} aliases (pf2e ${built.pf2e}) → ${path.relative(ROOT, BUNDLE)}`);
