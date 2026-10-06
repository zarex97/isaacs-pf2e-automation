# Vanilla content comes from a table, asked per key

From 1.2.0 the library automates content nobody authored for it — pf2e's own spells first — from a table
keyed by slug, in the same shape as item flags. Every authored read goes through `configOf(item, key)`:
the item's flags, then entries other modules register, then the library's own table.

## Why

The library already knows how to aim, ride, linger and overlap; what it lacked for vanilla content was the
config, which only an item's flags could carry. Writing flags into pf2e's compendium is not ours to do, and
re-flagging every owned copy would not reach the next one. A table beside the module reaches every copy.

- **Per key.** A homebrew can fix one aspect of a vanilla spell (its riders) and keep the rest (its area).
  Deep-merging rider arrays has no identity to merge on, so a key is the unit.
- **`false` is an answer.** An item saying `riders: false` turns the table's riders off for that copy — the
  only per-item switch, and the one the in-game panel writes.
- **The registered tier.** A table entry is this module asking for a spell, which is what the scope
  setting's `registered` choice means. "Only authored" keeps meaning hand-authored.
- **One door.** `configOf` is the only place a table can answer; `flagOf` stays flags-only, so receipts,
  markers and Region bookkeeping can never come from a table. A test fails on an authored key read with
  `flagOf`.
- **Other modules' content is theirs.** An item from another module's pack never takes an entry, so a
  homebrew spell that shares a vanilla slug is not silently automated.
- **Coexistence.** pf2e-automations and pf2e-assistant already apply conditions for some spells; a table
  rider for those defers by default, so a frightened target is not frightened twice.
