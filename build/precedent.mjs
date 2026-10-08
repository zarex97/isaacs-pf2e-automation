/**
 * The precedent lookup: which clauses already do what this one does.
 *
 *   npm run precedent -- --text "<rule text>"    key phrases suggest the patterns
 *   npm run precedent -- --tags "a:b c:d/e"      these patterns
 *   npm run precedent -- --clause VS-45a         that clause's own patterns
 *
 * `--trackers <dir>` (repeatable) adds another repo's trackers to this library's, `--vocabulary <file>`
 * reads another copy of the list, and `--top <n>` changes how many are shown (10).
 */
import path from "node:path";
import { TRACKERS, allowedTags, rank, readTrackers, readVocabulary, report, suggest, tagsOf } from "./lib/patterns.mjs";

const args = process.argv.slice(2);
const option = (name) => {
    const i = args.indexOf(`--${name}`);
    return i === -1 ? null : args[i + 1];
};
const many = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));

const vocabulary = readVocabulary(option("vocabulary") ?? undefined);
const rows = [TRACKERS, ...many("trackers")].flatMap((dir) => readTrackers(path.resolve(dir), path.resolve(dir, "..", "..")));
const top = Number(option("top") ?? 10);

let tags;
let suggested = null;
let exclude = null;
if (option("clause")) {
    const row = rows.find((r) => r.id === option("clause"));
    if (!row) throw new Error(`No clause ${option("clause")} in the trackers.`);
    tags = row.tags;
    exclude = row.id;
    console.log(`${row.id}: ${row.cells.Clause ?? ""}\n  ${tags.join(" · ") || "(no patterns yet)"}\n`);
} else if (option("tags")) {
    tags = tagsOf(option("tags").replace(/\s+/g, " · "));
} else if (option("text")) {
    suggested = suggest(vocabulary, option("text"));
    tags = suggested.map((s) => s.tag);
} else {
    console.log("Usage: npm run precedent -- --text \"<rule text>\" | --tags \"facet:value …\" | --clause <ID>");
    process.exit(1);
}

const unknown = tags.filter((t) => !allowedTags(vocabulary).has(t));
if (unknown.length > 0) {
    console.error(`Not in the vocabulary: ${unknown.join(", ")} — see Docs/patterns.md.`);
    process.exit(1);
}
console.log(report(vocabulary, rank(rows, tags, { exclude, top }), { suggested, rows }));
