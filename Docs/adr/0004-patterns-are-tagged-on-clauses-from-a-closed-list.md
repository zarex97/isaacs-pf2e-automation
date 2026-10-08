# Patterns are tagged on clauses, from a closed list this library owns

Every clause row in every tracker — this library's and the homebrew's — carries a **Patterns** cell:
`facet:value` or `facet:value/variant` tags drawn from `data/patterns.json`, which only this library
edits. A lookup ranks past clauses by the patterns they share with a new one, so whoever automates the
next spell, feat or condition starts from the code that already does the same thing.

## Why

- **On the clause, not the item.** A lookup starts from one sentence of rule text. Grease is an area, an
  object, a lingering save and a prone; tagging the spell would make it a precedent for all four at once
  and for none of them precisely. The tracker row is already where a clause lives, with its verbatim text,
  its mark and the **Static check** that names its content and tests.
- **Not in the content JSON.** A JSON entry is per item, has no clause to hang a tag on, and does not exist
  for a clause that is pure GM ruling or not yet built — which is exactly when the lookup is wanted.
- **A closed list.** Free tags drift into synonyms, and a synonym is a precedent nobody finds. A new value
  needs one clause to point at, and a variant exists only where two variants are done by different code.
- **Owned here.** The homebrew's CI already checks out this library at its pinned tag; its tracker check
  reads the same list, so both repos speak one vocabulary and a homebrew word never enters it.

## Consequences

- Untracked content gets clause rows before it can be tagged: eleven vanilla spells, and the Saint, which
  had no tracker.
- `npm test` fails on a tag outside the list, and — once backfill is done — on a row with no tags.
- The vanilla trackers' old prose **Shape** column is renamed **Gist**; "shape" means an Area's shape only.
