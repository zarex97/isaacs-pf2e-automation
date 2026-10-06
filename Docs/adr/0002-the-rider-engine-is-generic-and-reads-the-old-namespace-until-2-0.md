# The rider engine is generic, and reads the old namespace until 2.0.0

The rider engine — events, the apply types, receipts, the GM relay — moved here from the homebrew in
1.1.0, with the Regions it leaves behind (lingering areas, overlap, enemies-only terrain). It moved without
a single class's rule in it: every branch that named a class became a registration on
`api.riderExtensions`, and the homebrew registers them back.

## Why

`apply.mjs` had grown branches for each class that needed a word in it: Libra's Arms, a Soulbound's
charges, a Quincy's counteract refund, a Stargazer's stretched minute, a DC spelled `"cosmo"`. Copying it
across with those branches would have made this module carry four classes' rules forever, and every new
class a release of this one. The seams went in first, in the homebrew (registries for apply types, DCs,
statistics, counteract stages, save and duration modifiers, teleport refusals, follow-ups and anchors),
then the staged copy, then the move; each step was driven live before the next.

What the engine still needs when nothing is registered is what pf2e itself would reach for: a save with no
`dc` uses the origin's class DC, else its best spell DC; a counteract with no statistic uses the class DC
statistic, else the best spellcasting. Strings are localized and neutral — no "flames", "aspect" or
"Reiatsu Point" in the cards this module posts.

## The old namespace

Everything the engine writes was under `isaacs-hb-pf2e`: receipts on messages (what a reroll must take back),
ledgers on actors, the armed Strike marker, card buttons in chat history, Region behavior types and flags.
A world upgraded mid-session holds all of it.

- Writes go under this module's id from 1.1.0.
- Reads merge both namespaces once the homebrew registers its flag scope (`mergedFlag`), and clears reach
  both (`unsetFlagEverywhere`), so a cast made before the upgrade resolves after it.
- Card buttons answer to both the old `isaacs-hb-*` actions and the new `isaacs-automation-*` ones.
- Region behavior types and world settings are not dual-read: the homebrew's one-time GM migration rewrites
  them, because a Region type Foundry does not recognise cannot be read at all.

The dual reads are removed in 2.0.0.

## Consequences

- `npm test` fails if `Docs/riders.md` and the apply-type switch or `EVENTS` disagree, and if a string the
  engine shows is missing from `lang/en.json`.
- A class rule is never a branch in `scripts/riders/`; it is a registration in the module that owns the class.
- This module now uses a socket (`"socket": true`) for the GM relay, and declares the `lingering` and
  `enemyMovementCost` Region behavior types.
