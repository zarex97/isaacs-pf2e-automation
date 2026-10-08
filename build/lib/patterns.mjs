/**
 * Patterns: the closed vocabulary clauses are tagged with, and the trackers that carry the tags.
 *
 * `data/patterns.json` is the vocabulary — facets, their values, a value's variants where two variants are
 * done by different code — and every value names its precedent clause, its modules and its key phrases.
 * A tracker row carries its tags in a **Patterns** column, `facet:value[/variant]` separated by ` · `.
 * `npm run build:patterns` writes `Docs/patterns.md` from the vocabulary, and the tests fail when it is
 * stale. The homebrew reuses `trackerRows` and `problems` against its own trackers (Docs/adr/0004).
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

export const ROOT = path.resolve(url.fileURLToPath(new URL(".", import.meta.url)), "..", "..");
export const VOCABULARY = path.join(ROOT, "data", "patterns.json");
export const DOC = path.join(ROOT, "Docs", "patterns.md");
export const TRACKERS = path.join(ROOT, "Docs", "clauses");

const SEPARATOR = "·";
const TAG = /^([a-z-]+):([a-z-]+)(?:\/([a-z-]+))?$/;

export const readVocabulary = (file = VOCABULARY) => JSON.parse(fs.readFileSync(file, "utf8"));

/** Every tag the vocabulary allows, with the entry that defines it: `facet:value`, or `facet:value/variant`. */
export function allowedTags(vocabulary) {
    const tags = new Map();
    for (const [facet, { values }] of Object.entries(vocabulary.facets)) {
        for (const [value, entry] of Object.entries(values)) {
            if (entry.variants) {
                for (const [variant, sub] of Object.entries(entry.variants)) tags.set(`${facet}:${value}/${variant}`, { facet, value, variant, entry: sub });
            } else tags.set(`${facet}:${value}`, { facet, value, variant: null, entry });
        }
    }
    return tags;
}

/** The tags in one Patterns cell. */
export const tagsOf = (cell) => (cell ?? "").split(SEPARATOR).map((t) => t.trim()).filter(Boolean);

/**
 * The clause rows of a tracker's tables, read by header rather than by position: a table whose first
 * header is `ID`, and whose rows are clause IDs. Only tables with a **Patterns** column carry tags.
 */
export function trackerRows(markdown, source = "") {
    const rows = [];
    let header = null;
    for (const line of markdown.split(/\r?\n/)) {
        if (!line.startsWith("|")) {
            header = null;
            continue;
        }
        const cells = line.split("|").slice(1, -1).map((c) => c.trim());
        if (cells[0] === "ID") {
            header = cells;
            continue;
        }
        if (!header || /^:?-+/.test(cells[0])) continue;
        const row = Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""]));
        rows.push({ id: cells[0], source, cells: row, tagged: "Patterns" in row, tags: tagsOf(row.Patterns) });
    }
    return rows;
}

/** Every row of every tracker under `dir`, each file's rows marked with its path relative to `root`. */
export function readTrackers(dir = TRACKERS, root = ROOT) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return readTrackers(full, root);
        if (!entry.name.endsWith(".md")) return [];
        return trackerRows(fs.readFileSync(full, "utf8"), path.relative(root, full).replace(/\\/g, "/"));
    });
}

/** The mark a row stands at: its Status column (both trackers' name for it). */
export const markOf = (row) => row.cells.Status ?? "";

/**
 * What is wrong with the tags and the vocabulary, as sentences. `rows` are every clause row that may be a
 * precedent; `requireTags` makes an empty cell a problem; `root` resolves the modules a pattern names.
 */
export function problems(vocabulary, rows, { requireTags = vocabulary.requireTags, root = ROOT } = {}) {
    const found = [];
    const tags = allowedTags(vocabulary);
    const byId = new Map(rows.map((r) => [r.id, r]));

    for (const [facet, { values }] of Object.entries(vocabulary.facets)) {
        for (const [value, entry] of Object.entries(values)) {
            if (entry.variants && entry.precedent) found.push(`${facet}:${value} has variants, so its precedents belong on them`);
        }
    }
    for (const [tag, { entry }] of tags) {
        if (!entry.meaning) found.push(`${tag} says nothing about what it means`);
        for (const module of entry.modules ?? []) {
            if (!fs.existsSync(path.join(root, module))) found.push(`${tag} names ${module}, which does not exist`);
        }
        if (!entry.precedent) continue;
        const row = byId.get(entry.precedent);
        if (!row) found.push(`${tag}'s precedent ${entry.precedent} is not a clause row`);
        else if (!row.tags.includes(tag)) found.push(`${tag}'s precedent ${entry.precedent} does not carry it`);
        else if (markOf(row) !== "✅") found.push(`${tag}'s precedent ${entry.precedent} is ${markOf(row) || "unmarked"}, not ✅`);
    }

    for (const row of rows.filter((r) => r.tagged)) {
        if (requireTags && row.tags.length === 0) found.push(`${row.id} (${row.source}) carries no patterns`);
        for (const tag of row.tags) {
            if (tags.has(tag)) continue;
            const parsed = TAG.exec(tag);
            const value = parsed && vocabulary.facets[parsed[1]]?.values[parsed[2]];
            if (!parsed) found.push(`${row.id}: "${tag}" is not written facet:value or facet:value/variant`);
            else if (!vocabulary.facets[parsed[1]]) found.push(`${row.id}: ${tag} — there is no facet "${parsed[1]}"`);
            else if (!value) found.push(`${row.id}: ${tag} — "${parsed[2]}" is not a value of ${parsed[1]}`);
            else if (value.variants && !parsed[3]) found.push(`${row.id}: ${tag} needs one of its variants (${Object.keys(value.variants).join(", ")})`);
            else if (!value.variants) found.push(`${row.id}: ${tag} — ${parsed[1]}:${parsed[2]} has no variants`);
            else found.push(`${row.id}: ${tag} — "${parsed[3]}" is not a variant of ${parsed[1]}:${parsed[2]}`);
        }
        if (new Set(row.tags).size !== row.tags.length) found.push(`${row.id} carries a pattern twice`);
    }
    return found;
}

/** `Docs/patterns.md`: the vocabulary, facet by facet. */
export function patternsDoc(vocabulary) {
    const cell = (text) => String(text ?? "").replace(/\|/g, "\\|");
    const list = (items) => (items ?? []).map((i) => `\`${i}\``).join(", ");
    const quoted = (items) => (items ?? []).map((p) => `“${p}”`).join(", ");
    const lines = [
        "# Patterns",
        "",
        "Generated by `npm run build:patterns` from `data/patterns.json` — do not edit by hand. A **pattern** is one",
        "reusable mechanical move a clause makes; every clause row in a tracker carries its patterns in a **Patterns**",
        "column, and a clause that shares patterns with the one being written is its **precedent**. Why tags live on",
        "clauses, from a closed list: `Docs/adr/0004-patterns-are-tagged-on-clauses-from-a-closed-list.md`.",
        "",
        "A tag is `facet:value`, or `facet:value/variant` where two variants are done by different code. A new value",
        "needs a precedent clause that is ✅.",
        "",
    ];
    for (const [facet, { question, values }] of Object.entries(vocabulary.facets)) {
        lines.push(`## \`${facet}\` — ${question}`, "", "| Pattern | Meaning | Precedent | Where | Authored as | Key phrases |", "| :-- | :-- | :-- | :-- | :-- | :-- |");
        for (const [value, entry] of Object.entries(values)) {
            const rows = entry.variants
                ? Object.entries(entry.variants).map(([variant, sub]) => [`${facet}:${value}/${variant}`, `${entry.meaning} ${sub.meaning}`, sub])
                : [[`${facet}:${value}`, entry.meaning, entry]];
            for (const [tag, meaning, e] of rows) {
                lines.push(`| \`${tag}\` | ${cell(meaning)} | ${e.precedent ?? ""} | ${cell(list(e.modules))} | ${cell(list(e.authored))} | ${cell(quoted(e.phrases))} |`);
            }
        }
        lines.push("");
    }
    return `${lines.join("\n").trimEnd()}\n`;
}
