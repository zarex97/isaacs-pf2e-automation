# isaacs-pf2e-automation

A Foundry VTT module for the pf2e system: area targeting, one wrapper per intercepted method with stages
(`Docs/adr/0001-the-library-owns-every-wrap.md`), and the allowances pf2e writes down but never enforces.
Other modules build on it through `game.modules.get("isaacs-pf2e-automation").api`.

## The contract comes first

`Docs/api.md` is the public API. A change to anything another module calls lands there first, then in
`scripts/api.mjs`, and changes shape only in a major version. A new interception point is a new pipeline
here — never a `wrap()` in a module built on this one.

This module knows nothing about any homebrew. A class's word, a homebrew trait or a homebrew slug in
`scripts/` is a bug: it belongs in the homebrew, registered through a registry (`registerPreAim`,
`registerScopePredicate`, `FrequencyGuard.exempt`, a stage, …).

Every user-facing string lives in `lang/en.json` under `ISAACS_AUTOMATION` and is read with `t()` from
`scripts/i18n.mjs`. `npm test` fails on a missing or an unused key.

## Sibling repo

`../isaacsHBPF2e` — the homebrew (The Saint, The Soulbound, The Assimilator, The Stargazer) this module
was extracted from, and its first consumer. It reaches this module only through its own
`scripts/automation.mjs`. Its CI tests against the library tag named by its `compatibility.minimum`, so a
new API is released here before the homebrew uses it.

## Agent skills

### Issue tracker

Issues live as GitHub issues in `zarex97/isaacs-pf2e-automation`, via the `gh` CLI. See `Docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name. See `Docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `Docs/adr/` at the repo root. See `Docs/agents/domain.md`.

## Working method

### Refresh the graph before reading code

Run `node .gitnexus/run.cjs analyze --index-only` at the start of a session, before the first `impact`, `context` or
`query`, and again whenever a tool reports the index stale. Then `impact` before editing and
`detect_changes` before committing.

### Verifying a clause

Driven live in world `pf`, through the Claude-in-Chrome extension, as the homebrew is:

@Docs/tools/live-verification.md

@Docs/tools/foundry-traps.md

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **isaacs-pf2e-automation** (499 symbols, 1346 relationships, 41 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/isaacs-pf2e-automation/context` | Codebase overview, check index freshness |
| `gitnexus://repo/isaacs-pf2e-automation/clusters` | All functional areas |
| `gitnexus://repo/isaacs-pf2e-automation/processes` | All execution flows |
| `gitnexus://repo/isaacs-pf2e-automation/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
