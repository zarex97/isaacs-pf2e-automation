---
name: precedent
description: "Finds the clauses already automated that do what new rule text does, before any code is written. Use when about to automate or implement a spell, feat, action, condition or class feature, or when writing a clause tracker row."
---

# Precedent

Every rule we automate is mostly moves we have made before. A **precedent** is an implemented clause that
shares **patterns** with the one in front of you; its entry and modules are where the new code starts. The
vocabulary is `Docs/patterns.md` (generated from `data/patterns.json`); the terms are in `CONTEXT.md`.

Run this before reading any code. The lookup tells you which code to read.

## Steps

1. **Clausify.** Split the rule text into clauses: verbatim fragments, each one able to fail on its own,
   as the trackers in `Docs/clauses/` do. Done when every sentence that does something sits in exactly one
   clause, and pure GM rulings are set aside as `—`.

2. **Tag.** For each clause run

   ```sh
   npm run precedent -- --text "<the clause>"
   ```

   The suggested patterns come from key phrases, so treat them as a draft. Walk all eight facets —
   `when`, `reach`, `area`, `check`, `effect`, `ending`, `scaling`, `economy` — against `Docs/patterns.md`:
   keep what the clause does, drop what it only mentions, add what the phrases missed. A value with variants
   takes one (`reach:area/cone`, `effect:forced-move/pull`). Done when every clause has its tag set and
   every facet has been asked.

3. **Read the precedents.** Run the confirmed set:

   ```sh
   npm run precedent -- --tags "when:cast reach:area/line check:basic-save effect:damage"
   ```

   Read the top hits' entries and modules in score order. A ⚠️ or ❌ hit prints its gap: copy its approach,
   not its bug. Done when, for each clause, you can name the authored key or apply type that already
   expresses it — or say that none does.

4. **Write the row first.** Add the clause rows to the tracker with their **Patterns** cell filled, before
   the code exists. `npm test` checks every tag against the vocabulary.

5. **Name new ground.** A pattern on the **No precedent** line, or a clause no value fits, is new ground.
   Tell the user before writing it. New mechanisms are built generic, in this library (see `CLAUDE.md`). A
   new value goes into `data/patterns.json` once its first clause is ✅, with that clause as its precedent,
   then `npm run build:patterns`. From the homebrew, a missing value is an issue against the library.

## Report

Per clause: its tags, its best precedent (ID, entry, module), and whether it is new ground.
