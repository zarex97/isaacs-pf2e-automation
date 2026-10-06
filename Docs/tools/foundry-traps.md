# Foundry and pf2e traps

*Facts about Foundry 14 and pf2e 8.x that cost real time, none of them obvious from the code. Shared by
this module and the homebrew built on it. The live rig itself — how a clause is driven and what proof is
owed — is [`live-verification.md`](live-verification.md); this file is what the world and the system do
underneath it.*

## Loading the world

- **`CONFIG.PF2E` undefined, `game.pf2e` undefined, `CONFIG.Actor.documentClass` core `Actor`** reads
  exactly like a module having broken the system. It has at least three causes, none of them a module:
  - The window is under 1024×768 — Foundry never finishes initialising. Resize and reload.
  - The tab was **hidden** while it loaded. Chrome throttles a hidden tab's timers and animation frames,
    and a reload sits at "Connected to server socket" with `game.ready` false for ever; a world that did
    get to `ready` while hidden may have skipped the system's init. Make the tab visible, then reload.
    The extension's own `screenshot` action activates its tab; take one after every reload.
  - A **cached ES-module load failure**: `/game` loaded the instant a `launchWorld` POST returned, so
    `vendor.mjs` and `pf2e.mjs` lost the race with the world's boot, and the browser caches that failure
    for the life of the page. `fetch()` on both returns 200 while `import()` throws "Failed to fetch
    dynamically imported module". A hard reload (ignore cache) clears it.
  - Telling them apart in one call: `await import("/systems/pf2e/pf2e.mjs")`. A genuine error raises
    `SyntaxError`; a cached failure says "Failed to fetch dynamically imported module".
- **`net::ERR_CACHE_READ_FAILURE`** on a few resources wedges the load the same way. Reload ignoring cache.
- **`canvas.ready` can read false while the board is plainly drawn**, and calling `canvas.draw()` a second
  time throws "TokenRing UV generation failed because no spritesheet was loaded". Check
  `canvas.tokens.placeables.length` instead, and never redraw to "fix" a canvas that is up.
- **Unattended, with the display asleep**, Chrome reports the tab hidden even maximized and in front.
  A background `SetThreadExecutionState(-2147483645)` plus a 1-px mouse nudge every 15 s keeps it awake.

## Launch and join without the UI

```js
await fetch("/setup", { method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "launchWorld", world: "pf" }) });
await fetch("/join",  { method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "join", userid: "<id>", password: "" }) });
location.href = "/game";
```

The key is `world`, not `id`. Read the user id off `/join`'s `select[name="userid"]` (it is rendered after
load — read it once the page settles). Wait for the world to finish launching before going to `/game`.

## Scripting the page

- **A script call that times out keeps running in the page.** A second call starts a second run, and the
  two delete each other's documents. Start long work detached (result on `window`), poll in short calls.
- **A dialog blocks every `await` behind it** and surfaces as a protocol timeout, never as "a dialog is
  open". Check `foundry.applications.instances` for a `DialogV2` or `PickAThingPrompt` first.
- **A `ChoiceSet` with a `filter` defaults `itemType` to `"feat"`.** Filtering for weapons without
  `itemType: "weapon"` matches nothing and opens a prompt with **no buttons**, blocking for ever.
- **`toObject()` on a compendium document returns `rules` by reference.** Editing it poisons the cached
  pack for the session. `foundry.utils.deepClone` it.
- **Foundry writes into the options object you pass** (`parent` and more). Build a fresh one per call.

## Aiming on the canvas

- `canvas.regions.placeRegion` confirms on PIXI pointer input. A cone or a line on a square grid takes **two
  clicks**: the first fixes the apex, the pointer then sets the facing, the second confirms. The extension's
  `left_click_drag` is one burst and confirms a stale facing; its wheel reaches nothing.
- **At a device pixel ratio other than 1** (page zoom), what you see and where the pointer lands disagree.
  Aim by the stage: CSS = `canvas.stage.worldTransform.apply(point)`, screenshot coordinates = CSS ×
  (screenshot width / `innerWidth`). Hover first and read `canvas.mousePosition` before clicking; read
  `canvas.regions.preview.children[0].document.shapes[0]` (x, y, rotation, length) before the confirming click.
- `canvas.animatePan` never returns while a placement is standing; `canvas.pan` returns at once.
- A fresh tab's canvas can sit black at 1 FPS until one hover wakes it.

## pf2e 8.x: content that validates, builds and does nothing

- **The focus pool's max is derived and cannot be set by a rule.** pf2e's `Migration889RemoveFocusMaxIncreases`
  strips every `ActiveEffectLike` on `system.resources.focus.max` except four allow-listed slugs. The real model
  is +1 per non-cantrip `focus`-trait spell known, clamped to `focus.cap`. Write `cap`, or correct the max after
  preparation (`api.actorPreparation`).
- **Foreign compendium UUIDs must be ids, not names.** `Compendium.pf2e.classfeatures.Item.Alertness` resolves to
  null silently at runtime.
- **`updateActor` fires after the update** — `_source` already holds the new value. "Was this damage?" can only be
  asked in `preUpdateActor`. (The opposite of `TokenDocument#x`, where `_source` is the one you want.)
- **A class DC is looked up by its class trait** in `CONFIG.PF2E.classTraits`; a homebrew class trait is what makes
  a homebrew class DC exist at all.
- **A spell's `system.frequency` is inert.** pf2e spends only an ability's or feat's (`createUseActionMessage`) and
  refills only actions and feats (`Actor#recharge`). This module owns both halves for spells.
- **pf2e never rolls a spell attack's critical damage** (`getDamage` sets `outcome: "success"` for every attack
  spell). Doubling is the card's ×2 apply button; not a bug in the content.
- **`item.toMessage()` bypasses `spellcastingEntry.cast` for a spell** (no area targeting) and **spends no frequency**
  for an action. Drive a use from the sheet's `[data-action="use-action"]`.
- **`game.pf2e.Check.roll` re-tests every predicate** before the dice fall; a modifier switched off in a stage
  comes back. Lift the roll option instead.
- **Owned items are copies taken at grant time.** A flag added to the pack today never reaches a character granted
  yesterday.

## The pack lock

`npm run build` fails with `EPERM … rm packs` while a world that loads the packs is open. `game.shutDown()`
returns to Setup (a POST of `{action:"shutdown"}` to `/game` does not); retry the build — the lock clears a
second or two later.
