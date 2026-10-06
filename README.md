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
- **Automate death effects** — whom a rider may kill outright: creatures without a player owner (default),
  anyone, or nobody (a whisper to the GM instead).

Hold **Ctrl** while casting to skip aiming and use the targets you picked by hand.

## For module authors

Everything is reached through `game.modules.get("isaacs-pf2e-automation").api`. The contract, with every
pipeline, registry and hook, is [`Docs/api.md`](Docs/api.md).

## Development

```sh
npm test               # offline checks, plain Node
npm run link:foundry   # link this folder into Foundry's Data/modules
```

Live verification is described in [`Docs/tools/live-verification.md`](Docs/tools/live-verification.md).

## License

MIT.
