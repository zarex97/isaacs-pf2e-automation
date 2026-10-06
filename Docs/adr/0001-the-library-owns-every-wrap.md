# The library owns every wrap

Every pf2e or Foundry method this module needs to intercept is wrapped exactly once, here, and every
feature that wants a word at that point — this module's or another module's — registers a **stage** on it.
No module that builds on this one wraps a method itself.

## Why

libWrapper refuses two wrappers on the same method from one package, and in the homebrew this module was
extracted from, that refusal threw inside `setup` and took every feature registered after it down with it:
the one crash that reached a release. The fix there was one wrapper per method with stages hanging off it
(`damage-bus.mjs` first, then the check and cast pipelines).

Splitting into two modules would have reopened it from the other side. Across packages libWrapper allows
two wrappers on one method — and then their order is libWrapper's, not anyone's design. A damage stage that
undoes a shadowed resistance and a damage stage that reads the result would run in whatever order the
packages loaded. So the rule is not "one wrapper per package" but **one wrapper per method, owned by this
module**, and stages with priorities, so the order is written down.

When the split was planned, three homebrew features wrapped methods this module did not yet touch
(character `prepareDerivedData`, a token's `_prepareDetectionModes`, `Check.rerollFromMessage`). The choice
was between "the library owns what it pipelines" and "the library owns every wrap"; the second was chosen,
and those three became pipelines here with the features as stages.

## Consequences

- A new interception point is a new pipeline in this module, with a stage API and a line in `Docs/api.md`,
  not a `wrap()` call somewhere else.
- `build/test-automation.mjs` counts every `wrap("…")` target: none twice, and the expected list exact.
- The homebrew's own tests assert it has no `wrap()` call at all.
