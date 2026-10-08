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
    let heading = "";
    for (const line of markdown.split(/\r?\n/)) {
        if (line.startsWith("#")) heading = line.replace(/^#+\s*/, "").trim();
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
        rows.push({ id: cells[0], source, heading, cells: row, tagged: "Patterns" in row, tags: tagsOf(row.Patterns) });
    }
    return rows;
}

/**
 * Every row of every tracker under `dir`, each file's rows marked with its path relative to `root` — and,
 * for another repo's trackers, with that repo's name, which is how the vocabulary cites its clauses
 * (`isaacsHBPF2e:SC-24`).
 */
export function readTrackers(dir = TRACKERS, root = ROOT, repo = null) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return readTrackers(full, root, repo);
        if (!entry.name.endsWith(".md")) return [];
        return trackerRows(fs.readFileSync(full, "utf8"), path.relative(root, full).replace(/\\/g, "/")).map((row) => ({ ...row, root, repo }));
    });
}

/** A precedent or a module as the vocabulary writes it: `VS-45e`, or `isaacsHBPF2e:SC-24` for another repo's. */
export function citation(text) {
    const m = /^([A-Za-z][\w-]*):(.+)$/.exec(text);
    return m ? { repo: m[1], ref: m[2] } : { repo: null, ref: text };
}

/** The mark a row stands at: its Status column (both trackers' name for it). */
export const markOf = (row) => row.cells.Status ?? "";

/**
 * What is wrong with the tags and the vocabulary, as sentences. `rows` are every clause row that may be a
 * precedent; `requireTags` makes an empty cell a problem; `root` resolves the modules a pattern names, and
 * `repos` another repo's (`{ isaacsHBPF2e: "../isaacsHBPF2e" }`).
 *
 * A precedent in a repo whose rows were not given, or a module in a repo whose root was not, is not checked
 * here: the homebrew's own check, which reads both repos, answers for it (Docs/adr/0004).
 */
export function problems(vocabulary, rows, { requireTags = vocabulary.requireTags, root = ROOT, repos = {} } = {}) {
    const found = [];
    const tags = allowedTags(vocabulary);
    const key = (repo, id) => (repo ? `${repo}:${id}` : id);
    const byId = new Map(rows.map((r) => [key(r.repo, r.id), r]));
    const known = new Set(rows.map((r) => r.repo ?? null));

    for (const [facet, { values }] of Object.entries(vocabulary.facets)) {
        for (const [value, entry] of Object.entries(values)) {
            if (entry.variants && entry.precedent) found.push(`${facet}:${value} has variants, so its precedents belong on them`);
        }
    }
    for (const [tag, { entry }] of tags) {
        if (!entry.meaning) found.push(`${tag} says nothing about what it means`);
        for (const module of entry.modules ?? []) {
            const { repo, ref } = citation(module);
            const base = repo ? repos[repo] : root;
            if (base && !fs.existsSync(path.join(base, ref))) found.push(`${tag} names ${module}, which does not exist`);
        }
        if (!entry.precedent) continue;
        const { repo, ref } = citation(entry.precedent);
        if (!known.has(repo)) continue;
        const row = byId.get(key(repo, ref));
        if (!row) found.push(`${tag}'s precedent ${entry.precedent} is not a clause row`);
        else if (!row.tags.includes(tag)) found.push(`${tag}'s precedent ${entry.precedent} does not carry it`);
        else if (markOf(row) !== "✅") found.push(`${tag}'s precedent ${entry.precedent} is ${markOf(row) || "unmarked"}, not ✅`);
    }

    for (const row of rows.filter((r) => r.tagged)) {
        // A — row is a GM ruling with nothing automated: no precedent for anything, so it may stay untagged.
        if (requireTags && row.tags.length === 0 && markOf(row) !== "—") found.push(`${row.id} (${row.source}) carries no patterns`);
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
        "needs a precedent clause that is ✅ — here, or in the homebrew, cited `isaacsHBPF2e:<ID>` (as its modules are).",
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

/* -------------------------------------------------------------------------------------------- */
/*  The lookup: rank the clauses already tagged by the patterns they share with a new one        */
/* -------------------------------------------------------------------------------------------- */

/** The order ties are broken in: a clause that works first, one that does nothing last. */
const MARK_ORDER = ["✅", "⚠️", "🔧", "☐", "❌", "—"];

/**
 * The patterns a piece of rule text suggests, by the key phrases each pattern lists: `[{ tag, phrases }]`,
 * matched without regard to case. A suggestion, never the answer — the `precedent` skill confirms it.
 */
export function suggest(vocabulary, text) {
    const haystack = text.toLowerCase();
    const found = [];
    for (const [tag, { entry }] of allowedTags(vocabulary)) {
        const phrases = (entry.phrases ?? []).filter((p) => haystack.includes(p.toLowerCase()));
        if (phrases.length > 0) found.push({ tag, phrases });
    }
    return found;
}

/** How much sharing a pattern says: `ln(N / n)` over the `N` tagged clauses, `n` of which carry it. */
export function weights(rows) {
    const tagged = rows.filter((r) => r.tags.length > 0);
    const counts = new Map();
    for (const row of tagged) for (const tag of new Set(row.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return { total: tagged.length, counts, of: (tag) => (counts.get(tag) ? Math.log(tagged.length / counts.get(tag)) : 0) };
}

const siblingOf = (tag) => (tag.includes("/") ? tag.slice(0, tag.indexOf("/") + 1) : null);

/**
 * Every tagged clause that shares a pattern with `tags`, best first. A shared pattern scores its weight; a
 * sibling variant (`effect:forced-move/push` for `/pull`) half the weight of the one the clause carries.
 * Ties go to the mark (✅ first), then to more patterns shared. `exclude` leaves out the clause asked about.
 */
export function rank(rows, tags, { exclude = null, top = 10 } = {}) {
    const w = weights(rows);
    const wanted = [...new Set(tags)];
    const scored = [];
    for (const row of rows) {
        if (row.tags.length === 0 || row.id === exclude) continue;
        const shares = wanted.filter((t) => row.tags.includes(t));
        const siblings = wanted.filter((t) => !row.tags.includes(t) && siblingOf(t)).flatMap((t) => row.tags.filter((r) => r !== t && siblingOf(r) === siblingOf(t)));
        const score = shares.reduce((s, t) => s + w.of(t), 0) + [...new Set(siblings)].reduce((s, t) => s + w.of(t) / 2, 0);
        if (shares.length === 0 && siblings.length === 0) continue;
        scored.push({ row, shares, siblings: [...new Set(siblings)], score: Math.round(score * 100) / 100 });
    }
    const markRank = (row) => {
        const i = MARK_ORDER.indexOf(markOf(row));
        return i === -1 ? MARK_ORDER.length : i;
    };
    scored.sort((a, b) => b.score - a.score || markRank(a.row) - markRank(b.row) || b.shares.length - a.shares.length);
    return { hits: scored.slice(0, top), unmatched: wanted.filter((t) => !w.counts.has(t)) };
}

/**
 * The content entries and modules a row's **Static check** names, as paths — or, for a clause whose cell
 * names none, the `content/vanilla/` entry of the spell it belongs to (`VS-58f` → the `VS-58` row's slug).
 */
export function entriesOf(row, rows = [], root = ROOT) {
    const text = row.cells["Static check"] ?? "";
    const named = [...new Set([...text.matchAll(/`([^`\s]+\/[^`\s]+\.(?:json|mjs))`/g)].map((m) => m[1]))];
    if (named.length > 0) return named;
    const parent = /^(.*\d)[a-z]$/.exec(row.id)?.[1];
    const slug = rows.find((r) => r.id === parent && r.source === row.source)?.cells.Spell?.replace(/`/g, "");
    const entry = slug && `content/vanilla/${slug}.json`;
    return entry && fs.existsSync(path.join(row.root ?? root, entry)) ? [entry] : [];
}

/** The lookup's report, as plain text. */
export function report(vocabulary, { hits, unmatched }, { suggested = null, rows = [], root = ROOT } = {}) {
    const tags = allowedTags(vocabulary);
    const lines = [];
    if (suggested) {
        lines.push("Suggested patterns (from key phrases — confirm them against Docs/patterns.md):");
        for (const { tag, phrases } of suggested) lines.push(`  ${tag.padEnd(32)} ← ${phrases.map((p) => `“${p}”`).join(", ")}`);
        lines.push("");
    }
    if (hits.length === 0) lines.push("No clause shares any of these patterns.");
    hits.forEach(({ row, shares, siblings, score }, i) => {
        const name = row.cells.Spell ? row.cells.Spell.replace(/`/g, "") : row.heading;
        lines.push(`${String(i + 1).padStart(2)}. ${row.id} ${markOf(row)} ${name}  ${row.cells.Clause ?? ""}`);
        lines.push(`    shares:  ${[...shares, ...siblings.map((s) => `${s} (sibling)`)].join(", ")}    score ${score.toFixed(1)}`);
        const entries = entriesOf(row, rows, root);
        if (entries.length > 0) lines.push(`    entry:   ${entries.join(", ")}`);
        const modules = [...new Set([...shares, ...siblings].flatMap((t) => tags.get(t)?.entry.modules ?? []))];
        if (modules.length > 0) lines.push(`    modules: ${modules.join(", ")}`);
        if (["⚠️", "❌", "🔧"].includes(markOf(row))) lines.push(`    gap:     ${(row.cells.Evidence ?? "").slice(0, 240)}`);
        lines.push(`    in:      ${row.source}`);
    });
    lines.push("", `No precedent: ${unmatched.length > 0 ? unmatched.join(", ") : "(none)"}`);
    if (unmatched.length > 0) lines.push("  New ground — nothing tagged yet does these. Say so before writing the code.");
    return lines.join("\n");
}
