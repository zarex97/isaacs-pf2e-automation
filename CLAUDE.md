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

Run `npx gitnexus analyze --index-only` at the start of a session, before the first `impact`, `context` or
`query`, and again whenever a tool reports the index stale. Then `impact` before editing and
`detect_changes` before committing.

### Verifying a clause

Driven live in world `pf`, through the Claude-in-Chrome extension, as the homebrew is:

@Docs/tools/live-verification.md

@Docs/tools/foundry-traps.md
