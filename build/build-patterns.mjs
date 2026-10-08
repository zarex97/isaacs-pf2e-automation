/** Write `Docs/patterns.md` from `data/patterns.json`. The tests fail when it is stale. */
import fs from "node:fs";
import path from "node:path";
import { DOC, ROOT, patternsDoc, readVocabulary } from "./lib/patterns.mjs";

const vocabulary = readVocabulary();
fs.writeFileSync(DOC, patternsDoc(vocabulary));
const count = Object.values(vocabulary.facets).reduce((n, { values }) => n + Object.values(values).reduce((m, v) => m + (v.variants ? Object.keys(v.variants).length : 1), 0), 0);
console.log(`${count} patterns in ${Object.keys(vocabulary.facets).length} facets → ${path.relative(ROOT, DOC)}`);
