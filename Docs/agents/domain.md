# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo is **single-context**: one `CONTEXT.md` and one `Docs/adr/` at the root. There is no
`CONTEXT-MAP.md` and no per-context split.

Note the capital `D` in `Docs/`. The repo already tracked that directory before these skills were set
up, and Windows is case-insensitive while git is not — writing `docs/adr/` would land in the same
physical folder while recording a second path prefix, which splits into two directories on a
case-sensitive checkout. Always spell it `Docs/`.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root.
- **`Docs/adr/`**: read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest
creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and
`/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── CONTEXT.md
├── Docs/
│   ├── adr/
│   │   ├── 0001-….md
│   │   └── 0002-….md
│   └── agents/                        ← this file, and the tracker/label config
├── lang/                              ← every string the module shows
├── scripts/                           ← the module's runtime code
└── templates/, styles/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test
name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language
the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
