# Isaac's PF2e Automation

Automation for the [Pathfinder Second Edition](https://github.com/foundryvtt/pf2e) system on Foundry VTT.

- **Area targeting.** Casting an ability with an area puts the area on the board as a Region. You aim it,
  review who it caught and why the rest were left out, and the creatures it caught become your targets
  before the chat card is posted. With [PF2e Toolbelt](https://github.com/reonZ/pf2e-toolbelt)'s Target
  Helper, that is a row per target for saves and damage.
- **Frequencies that hold.** A spell's frequency is spent and enforced (pf2e records it and never reads it);
  a feat or action at zero uses is refused instead of posted; ten-minute and hourly allowances refill as
  world time passes.
- **One wrapper per method.** Casting, damage, checks, rerolls, character preparation and detection modes
  each have a single wrapper with ordered stages, so modules that build on this one add stages instead of
  competing wrappers.
- **Riders.** What an ability does *besides* damage, applied when it happens: a save rolled, a Strike
  landed, damage applied, a turn ending. Conditions, effects, counteracts, forced movement, a choice
  whispered to the caster — on the right creature's own sheet, and taken back on a reroll. Authoring
  reference: [`Docs/riders.md`](Docs/riders.md). Needs a GM online.
- **Vanilla spells.** pf2e's own spells are automated from a table — areas, target limits, riders by degree
  of success, lingering ground — listed in [`Docs/vanilla.md`](Docs/vanilla.md). A spell PF2e Automations or
  PF2e Assistant already automates keeps their riders, not ours; a mark on the sheet and chat card says
  what is automated and from where.
- **Areas left behind.** Ground that lingers after a cast, penalties for being caught by two placements at
  once, and difficult terrain that slows only the caster's enemies.

## Install

Manifest URL:

```
https://github.com/zarex97/isaacs-pf2e-automation/releases/latest/download/module.json
```

Foundry VTT 14, pf2e 8.3 or later.

## Settings

- **Place areas as Regions when casting** — on by default.
- **Area targeting applies to** — abilities written for area targeting always aim; choose whether that is
  all, whether abilities other modules ask for are added (default), or whether every spell with an area aims.
- **Enforce range** — refuse a placement out of reach, with a question that lets you place it anyway.
- **Review targets before casting** — per user.
- **Apply riders automatically** — on by default.
- **Riders for vanilla spells** — the conditions this module applies for pf2e's own spells: off, only for
  spells PF2e Automations and PF2e Assistant do not already automate (default), or all of them.
- **Automate death effects** — whom a rider may kill outright: creatures without a player owner (default),
  anyone, or nobody (a whisper to the GM instead). It also decides who dying at its maximum kills.
- **Automate conditions** — on by default: pf2e's conditions do what their text says where pf2e leaves it to
  the table. Frightened drops at the end of each turn; stunned counts down and the turn's actions are
  announced; dying rolls its recovery check, worsens when hurt, ends on healing (with wounded) and kills at its
  maximum; a character knocked to 0 Hit Points gains dying; healing wakes the unconscious, who drop what they
  hold; Speed penalties stop at 5 feet; a blinded creature's every square is difficult terrain; paralyzed,
  stunned, unconscious, petrified, immobilized, restrained, prone, fleeing and confused refuse what they
  forbid; deafened, grabbed and stupefied ask their flat checks; attacks on hidden, undetected and invisible
  creatures ask DC 11 and a dazzled attacker DC 5; persistent damage is taken and its recovery rolled; Treat
  Wounds ends wounded. What each clause does, and what is still open, is `Docs/clauses/pf2e-conditions.md`.

Hold **Ctrl** while casting to skip aiming and use the targets you picked by hand.

## For module authors

Everything is reached through `game.modules.get("isaacs-pf2e-automation").api`. The contract, with every
pipeline, registry and hook, is [`Docs/api.md`](Docs/api.md).

## Development

```sh
npm test               # offline checks, plain Node
npm run link:foundry   # link this folder into Foundry's Data/modules
npm run index:pf2e     # re-index the installed pf2e compendium (build/data/pf2e-index.json)
npm run build:vanilla  # bundle content/vanilla/*.json into data/vanilla.json
npm run build:patterns # write Docs/patterns.md from data/patterns.json
npm run precedent -- --text "<rule text>"   # which clauses already do what this one does
npm run coverage:assistant  # refresh which spells PF2e Assistant automates (data/coverage/)
```

Vanilla table entries are one file per spell in `content/vanilla/<slug>.json`, in the shape item flags carry
([`Docs/api.md`](Docs/api.md#vanilla-content--since-120)); `npm test` checks each against the pf2e index.

Live verification is described in [`Docs/tools/live-verification.md`](Docs/tools/live-verification.md).

## License

MIT.
