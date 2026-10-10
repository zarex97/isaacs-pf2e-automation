# Live verification

*How a clause is driven: the rig, the world, and what counts as proof. Written so neither a human nor
an agent has to remember any of it again.*

> Shared by this module and the homebrew built on it (`zarex97/isaacsHBPF2e`), and kept here because this is
> the more general of the two. Both are driven in the same world, `pf`. `npm run live`, the class rigs
> (`api.rig`) and the clause trackers live in the homebrew repo. Facts about Foundry and pf2e themselves —
> loading, aiming, the pack lock — are in [`foundry-traps.md`](foundry-traps.md).

The standard is stated in `Docs/soulbound-verification-checklist.md` §0 and it is short: **every
sentence in the guide should happen by itself.** "It is on the sheet" is not a pass. A row passes when
the number, the condition, the area, the frequency and the cost all arrive without a human remembering
them — which is why this is driven in a live world rather than read out of the JSON.

Filing rules — one finding per issue, one tracker per tier — live in `Docs/agents/issue-tracker.md`
and are not restated here.

---

## 1. Bring it up

```sh
npm run live            # starts Foundry if it is not already up, then reports
npm run live:status     # reports only, starts nothing
npm run live -- --devtools   # …and the debug Chrome, for the fallback driver only
```

`build/live-session.mjs` is idempotent: it starts the Foundry desktop app only if nothing answers on
`:30000`. Readiness is a real HTTP GET, because **a CDP client reports "connected" even when no debug
Chrome is listening** and that lie has cost hours.

**It deliberately does not start a browser.** See §2 for why the one it used to start was the wrong one.

## 2. The driver

### Primary — the Claude-in-Chrome extension

Open Foundry in a tab of **your own Chrome, on the profile signed in as `zarexlibertad@gmail.com`**.
That profile is the one carrying the extension, and the extension is the driver.

This matters more than it looks. `canvas.regions.placeRegion` registers its listeners on
`canvas.stage` and waits for `pointerdown`; a placement is confirmed by pointer input reaching PIXI's
federated event system. A browser started by a script gets a throwaway profile, and a throwaway profile
has no extension — which is exactly the trap `npm run live` used to set by starting one every time.

**Calibrate the pointer before using it.** The extension's coordinates are the **screenshot's**, not the
page's. A screenshot of a 2400-wide viewport comes back 1568 wide, so a CSS position has to be scaled:

```js
const K = { sx: 1568 / window.innerWidth, sy: 743 / window.innerHeight };
const ext = (worldX, worldY) => {
    const p = canvas.stage.worldTransform.apply({ x: worldX, y: worldY });
    return { x: Math.round(p.x * K.sx), y: Math.round(p.y * K.sy) };
};
```

Read the screenshot's own dimensions from the tool's result rather than hard-coding 1568×743; they
follow the window. Hovering at an uncalibrated coordinate lands the cursor hundreds of feet from where
you meant, and the only symptom is an area that catches the wrong tokens.

### Fallback — chrome-devtools MCP

For an unattended run, where no window is in focus and no real pointer exists:

```sh
npm run live -- --devtools
claude mcp add --transport stdio chrome-devtools -- npx -y chrome-devtools-mcp@latest --browserUrl=http://127.0.0.1:9222
```

Run that through a POSIX shell. PowerShell swallows the `--` separator and `claude mcp add` then fails
with `unknown option '-y'`.

**The debug window is started at 1600×1000 on purpose.** Below 1024×768 Foundry never finishes
initialising, and the symptom is not a size warning — `CONFIG.PF2E` and `game.pf2e` come back
`undefined` and `CONFIG.Actor.documentClass` is core `Actor`, which reads exactly like this module
having broken the system.

## 3. Reach the world

**Unattended, on the VPS:** `npm run live:launch` (or `npm run live:launch -- <world>`) closes whatever world is
open, logs the headless debug Chrome into Setup, launches `pf` and joins as Gamemaster. It reads the admin password
from `FOUNDRY_ADMIN`, else from `~/.config/isaacs-automation/foundry.env` (`FOUNDRY_ADMIN=...`, mode 600), and never
prints it. A GitHub secret cannot stand in: nothing outside Actions can read one back.

By hand:

If another world is already running you land on `/join`, not `/setup`. Get to `/setup` with the page's
own **Return to Setup** form, then launch the world by clicking its play control:

```js
document.querySelector('[data-package-id="pf"] a.control.play').click();
```

That control is a bare `<a>` with no text, so it does **not** appear in an accessibility snapshot;
selecting it by attribute is the reliable route. Then on `/join`, pick **Gamemaster** (world `pf` has
no password) and submit.

Both halves are also a POST, which is faster from a script and survives a page that will not render:

```js
await fetch("/setup", { method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "launchWorld", world: "pf" }) });
await fetch("/join",  { method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "join", userid: "<id>", password: "" }) });
```

The key is `world`, not `id` — `{action: "launchWorld", id: "pf"}` answers *"The requested world
undefined does not exist"*. Read the user id off `/join`'s own `select[name="userid"]`. If `/setup`
answers **403**, the admin session has lapsed: reload `/setup` in the tab and try again.

## 4. Sanity-check before trusting anything

```js
({ world: game.world.id, system: game.system.version, ready: game.ready,
   automation: game.modules.get("isaacs-pf2e-automation")?.active,
   homebrew: game.modules.get("isaacs-hb-pf2e")?.active,
   pf2e: !!CONFIG.PF2E })
```

`pf2e: false` means the window is too small. Resize and reload; do not start debugging content.

## 5. What a drive owes

The six marks are `Docs/soulbound-verification-checklist.md` §0's, and every clause tracker restates
them:

| Mark | Meaning |
| :-- | :-- |
| ☐ | Not yet driven |
| ✅ | Driven live; the clause happened by itself |
| ⚠️ | Driven live; partially happens — the gap is named in **Evidence** |
| ❌ | Driven live; does not happen |
| 🔧 | Was ❌ or ⚠️, a fix has landed, awaiting re-drive |
| — | Nothing to automate (pure roleplaying / GM ruling) |

### A control that cannot fail proves nothing

Every ✅ owes a **control**: the same measurement with the cause removed, showing the effect gone. An
observation on its own is compatible with the mechanism under test doing nothing at all.

Three from one week, each of which read as a pass until its control was run:

- **Zangetsu S-11a.** *"The damage die does not increase."* It did not — and the control showed Full
  Release's die step was not applying either, so the clause was satisfied by an accident. It took
  lifting the Shikai form as well before the two states separated: Full Release alone → d10, Full
  Release with Tensa → d8.
- **Senbonzakura S-07f.** The Senkei cage dropped a target outside it. It also dropped every target
  inside it, because `testPoint` was being called with two arguments and answering false for the whole
  board. A guard that refuses everyone looks exactly like a guard that works.
- **Ryūjin Jakka S-29b.** The ash grabbed nobody at the caster's turn end, which was the fix. It also
  grabbed nobody at the enemy's, which was not.

Write the control into the Evidence cell beside the result. *"D2 with `spirit 10` lost 32; the identical
dummy with no resistance lost 32; the same cast from a caster without Refined lost 0"* is evidence.
*"D2 lost 32"* is a number.

### A fix that reports itself as working

Prefer the measurement the rules actually consume over the one that is easy to read. Setting `ignored`
on a modifier inside `Check.roll` looked right, stamped its roll option on the message, and changed no
total — pf2e re-tests every predicate before the dice fall. The roll option said the feature had
worked. Only the DC said whether it had.

## 6. Traps

### The rig

| Trap | What it looks like |
| :-- | :-- |
| The extension's coordinates are the **screenshot's** | The cursor lands far from the target; an area catches the wrong tokens. See §2 |
| The extension's own click does not confirm a Region placement | The preview follows the cursor and never commits. Dispatch a synthetic `PointerEvent` at `canvas.app.view` instead — see §10 |
| `evaluate_script` has a **60-second** protocol timeout | Anything that opens a dialog blocks every `await` behind it and surfaces as a timeout, never as "a dialog is open". See §7 |
| `canvas.animatePan` never returns while a placement is standing | The script channel times out. `canvas.pan` returns immediately and is the one to use |
| A **hidden** tab never finishes loading the world | After a launch or reload `game.ready` stays `undefined` and the page is black for minutes. Chrome throttles a background tab's timers, and Foundry's startup waits on them. Bring the window forward from PowerShell — `SetForegroundWindow` alone is refused, a synthetic Alt press first gets past Windows' focus lock — and it loads in seconds. The same throttling makes long `setTimeout` waits inside one script time out the channel: drive in short calls |
| A plain reload runs **yesterday's scripts** | After an edit to the module, `location.reload()` can serve Chrome's cached copies of its `.mjs` files and of `data/vanilla.json`: the new hint text is missing, an entry reads its old value, and a fix looks broken. Check by fetching the file with `{ cache: "no-store" }` and comparing; hard-reload (Ctrl+Shift+R) after any code change before trusting a drive |
| pf2e **replaces** a placement's `onMove` | `RegionLayerPF2e#placeRegion` overwrites the `onMove`/`onRotate`/`preConfirm` it is handed whenever the Region measures and highlights coverage, with its own two-click aim (place the apex, click, turn it). A placement that must control the shape itself calls `foundry.canvas.layers.RegionLayer.prototype.placeRegion` directly |
| A sheet's header button does nothing when clicked at once | Application V1 binds header-button listeners **500 ms** after render, on a timer a hidden tab throttles further. Click it on a later call, not in the call that rendered the sheet |
| A rig check "hangs" in a hidden tab, with nothing standing | It is not hung: Chrome's **intensive throttling** holds a hidden page's *chained* timers — a timer set from a timer, five deep — to **one wake-up a minute**. A polling loop of forty 250 ms waits took forty minutes; a database round-trip breaks the chain, which is why only the pure polling loops stalled. Measure it: twelve chained 250 ms timers delivered six in 20 s. The Assimilator rig's `wait()` runs on a Web Worker's clock, which is exempt (#100). A helper written with a bare `setTimeout` loop will stall the same way |

### The world

World `pf` is not a clean room. It is a working world with years of fixtures in it.

| Trap | What it looks like |
| :-- | :-- |
| Token `x`/`y` and `disposition` writes are **silently reverted** | A token you moved is back where it was, and an area you aimed catches the wrong creatures. `system.details.alliance` on the *actor* holds |
| An actor created by a GM defaults to `alliance: "opposition"` | Every `affects: "enemies"` area catches nothing **and silently clears targets set by hand**. Always `actor.update({"system.details.alliance": "party"})` |
| Fixtures carry state from the last drive | A "clean" heal that gives back nothing because the target is still wounded; a save that does not fire because the target still has last week's immunity marker. Strip what you are about to measure |
| **World state saved in the page dies with a reload** | A drive that changes a world setting — the Sky above all — and saves the original in `globalThis` to restore later loses it at the first reload, and the "restore" writes `undefined`, which the setting reads as its default. It happened: the Sky went to day 1, Starless, until the original was put back from the transcript. Save it to disk (the tool's `filePath`) or print it before the first change, and restore from that |
| A Saint's **Shelter of the Cloth** softens everyone within 30 feet | A Stargazer's Forewarned control read one step milder, the same as the briefed creatures, because the fixtures stood beside a Saint. `SkyTracker.isSheltered(actor)` before trusting any sky reading |
| A heightening clause needs a caster above 14th | Clone one rather than editing a level in place: re-levelling reopens every `ChoiceSet` the class ever asked |
| Test actors are misnamed | `ZZ Sev — Ryūjin Jakka` is an Arrogante. Check the spell list, not the name |
| pf2e's own items are **translated** | The world runs `foundryvtt-es`, so `Effect: Cover` is *Efecto: Cobertura* on the sheet. A filter by English name deletes nothing, stale copies stack, and the reading is three cover levels at once. Match a system item by `sourceId` |
| The pack LevelDB is locked while a world is open | `npm run build` fails with `EPERM … rm packs`. See §8 |

### Foundry

| Trap | What it looks like |
| :-- | :-- |
| `Region#testPoint` takes **one** argument, `{x, y, elevation}` | A second argument is not ignored, it is *missing*: the elevation test reads `undefined` and the region answers false for every point on the board |
| A flag key containing a dot is a **path** | `setFlag(id, "k", {"abc.0": v})` stores `{abc: {0: v}}`, and the next read of `ledger["abc.0"]` is `undefined`. A counter that writes and never reads |
| `TokenDocument#x` is the **animated** position in v14 | Read `_source.x` for real coordinates |
| A compendium UUID needs the `_id`, not the name | `Compendium.pack.Item.Effect: Foo` does not resolve at runtime; the build rewrites names to ids at pack time, so content may say the name and a live patch may not |
| `toObject()` on a **compendium** document returns `rules` by reference | Editing it poisons the cached pack for the session. `foundry.utils.deepClone` it |
| Region creation validates the behavior subtype | A module subtype must be declared in `module.json` under `documentTypes.RegionBehavior` or creation throws `DataModelValidationError` |

### pf2e

| Trap | What it looks like |
| :-- | :-- |
| **Owned items are copies taken at grant time** | A content flag added today never reaches a character granted yesterday. Hit twice in one week — sync the owned copy by hand for the drive, and rebuild the pack before believing a negative |
| `damage-dice-faces` with `mode: "upgrade"` **latches** | `if (item.flags.pf2e.damageFacesUpgraded) return` — a second upgrade is a no-op, on the same effect or another. Two steps cannot be written as a rule element |
| `bypass.immunity.ignore` is a field pf2e **never reads** | `applyIWR` consults `resistance.ignore`, `resistance.redirect` and `immunity.redirect`, then settles immunity separately via `isAffectedBy`. Ignoring immunity has to shadow the target |
| An `Aura`'s `events` list is read **once** | Only to default `removeOnExit`. Effects are granted on contact, not at turn start or turn end — the module times those itself |
| `game.pf2e.Check.roll` re-tests every predicate | A modifier switched off before the call is switched back on before the dice fall. Correct the DC instead |
| `save-rolled` riders come from `pf2e-toolbelt.rollSave` | Which fires only from a **target row on the chat card**. An ad-hoc `actor.saves.reflex.roll()` fires nothing |
| `item.toMessage()` bypasses `spellcastingEntry.cast` | A *spell* posted that way skips area targeting; an *action* does not |
| `item.toMessage()` also **spends no frequency** | pf2e decrements `system.frequency.value` in `createUseActionMessage`, which only the two character sheets call. Driving an action by `toMessage()` leaves a once-per-day allowance untouched, and reads exactly like the class failing to count. Click `[data-action="use-action"]` on the sheet's own row instead |
| A **counted** frequency is not an **enforced** one | `createUseActionMessage` stops decrementing at zero and posts the card anyway. pf2e never refuses. `economy/frequency-guard.mjs` now refuses a feat's or action's use card at 0 unless pf2e just counted that use (#123) |
| A predicate on a tag matches nothing on an **old** sheet | `otherTags` is copied at grant time like everything else, so a tag added to the pack later is absent — and a predicate that matches nothing does not complain, it simply never fires. `Release.repair` unions them back; run it before believing a rule element did nothing |
| `showCheckDialogs` / `showDamageDialogs` user flags | Block scripted rolls |
| `game.user.updateTokenTargets` does not exist | Use `token.object.setTarget(true, { user, releaseOthers })` |
| A damage card has **two** apply buttons | `data-action="applyDamage"` applies to the **selected** token; `data-action="target-applyDamage"` applies to the card's target. Driving a Strike leaves the *attacker* selected, so the first one damages the attacker and the target's hit points never move — which reads exactly like a resistance bypass that failed |
| A combatant ends its turn **once per round** | pf2e's `_onEndTurn` skips everything when `roundOfLastTurnEnd === context.round`, so `pf2e.endTurn` does not fire and nothing measured in turns advances. A rig that jumps `combat.turn` back and forth inside one round will watch a one-turn window never close. Advance the **round** first |
| A creature's persistent roll option reaches rolls against it only if it begins `self:` | `getSelfRollOptions("target")` keeps `self:` keys and renames them `target:`. An option written as `flags.pf2e.rollOptions.all.damaged-this-encounter` is on the creature and never in a Strike's context — the mark was set and Red's doubling still did not fire |
| A **negated** predicate on a Speed modifier is shown and not added | `{not: "x"}` on a `FlatModifier` to `speed` came back `enabled: true`, `ignored: false`, printed in the breakdown — and excluded from the total, while a plain positive predicate on the same effect summed correctly. Author two positive rules that stack rather than one negated and one positive |
| A frequency is only spent through the sheet's **use** button | `item.toMessage()` posts the card without calling `createUseActionMessage`, so a drive by API leaves `frequency.value` untouched. Read a frequency's behaviour from `[data-action="use-action"]`, not from `toMessage` |
| A penalty of a type the target already has is **swallowed** | pf2e keeps only the worst modifier of each type. A −2 **circumstance** penalty to AC vanishes against a target that is already off-guard, and the reading looks exactly like a rule that failed. Probe with an `untyped` modifier first to tell the two apart |
| A rider fires only for the item that was **used** | `onActionUsed` reads `ridersOn(item)`, so a rider on feat A can never answer the use of item B. A permission that modifies another action belongs **on that action**, predicated on the feat — which is how Ghost Step went from never firing to firing |
| `context.rollTwice` is `"keep-higher"` / `"keep-lower"` in pf2e 8 | Not `"higher"` / `"lower"`, which is what the `RollTwice` rule element's own `keep` field says. A check-pipeline stage comparing against the rule's spelling matched nothing, and Sentence Passed let a fortune roll through |
| To lift a predicated modifier, lift the **roll option** | `Check.roll` re-tests predicates against `context.options`, so a modifier switched off in a stage comes back. The Announcement's `Unintelligible −4` only went once `action:demoralize:unintelligible` was deleted from the options |
| `getActiveTokens(true, true)` returns **TokenDocuments** | Their scene is `.parent`, not `.document.parent`, and they have no `setTarget` (that is `getActiveTokens(true, false)`). Tapestry read every token's scene as `undefined` and found nobody |
| `SubstituteRoll` takes **one** selector string | An array is stringified to `"check,saving-throw,…"`, which matches no domain, and the roll goes by untouched. `all` reaches every check |
| A spell has **no tradition** roll option | `item:trait:occult` and `item:tradition:occult` both match nothing, so a ChoiceSet filter cannot ask for "an occult cantrip". Write the list out |
| A ChoiceSet's answer lives in the **rule** | pf2e stores it as the rule's own `selection` and derives `flags.pf2e.rulesSelections` from it on every prepare. Updating the flag reverts; a copy of the owned item re-grants the old answer without asking. Change the rule, or start from the compendium |
| A familiar has **no traits** | pf2e 8's familiar schema stores none, and an `ActorTraits` rule on it is ignored. `flags.pf2e.rollOptions.all["self:trait:x"]` is what predicates can see |
| A secret check needs the **`secret` trait** | A `rollMode: "blindroll"` alone was posted in the open; with `traits: ["secret"]` pf2e whispers it to the GM |
| A roll option an effect sets is the **creature's** | A `RollOption` on one effect lights predicates on every other effect on the sheet. Two sky effects each carrying all twelve signs' rules, gated on `sky:sign:<id>`, lit each other's domains — a Retrograde Leo read +1 from the Benefic Aquarius beside it. Strip what does not belong before the item is created |
| A bare `20` is still a natural 20 | With a +0 modifier a substituted roll's formula is just `20`, but pf2e still steps the degree: 20 against DC 30 is a critical failure by 10, raised to a failure. Do the arithmetic before calling it a bug |
| Foundry writes into the **options** you pass | A create or update adds `parent` (and more) to its options object. Reuse one object across calls and a later actor update is sent to the scene the last token write used — "Actor is not a valid embedded Document within the Scene". Build a fresh options object every call |
| A turn starts **once per round** | pf2e records `roundOfLastTurn` on the combatant and will not start that turn again in the same round. Rewinding the combat into a round already played needs the combatant's flags put back too, or no start-of-turn hook fires |
| `actor.isDead` wants the **death overlay** | A character at 0 Hit Points and dying 4 reads `isDead: false` until the token shows the dead status. Read dying against `attributes.dying.max` instead |
| An initiative roll is a **Perception** check | Its domains include `perception` and `check`, so a modifier selected on either is spent by initiative. Its roll options carry `check:type:initiative` — predicate on that, with `removeAfterRoll: "if-enabled"` |
| A damage roll caches its total **twice** | Changing a die on a pf2e `DamageRoll` needs each `DamageInstance`'s `_total` re-evaluated **and** the `InstancePool`'s own `results[i]` updated, then the roll's `_total` — and the message `content`, which prints the total too. Miss one and the card shows the new dice over the old number |
| pf2e's **Refocus** does nothing | The action from `actionspf2e` is text: posting it, or its sheet row, restores no Focus Point. Whatever a class says Refocus does has to be done by the module |
| A cast asks **"Confirm targets"** first | The area-targeting flow opens a `DialogV2` before any of the spell's own prompts. A scripted answer queue must put an OK for it first, or the spell's dialog takes the wrong answer and waits for ever |
| An emanation **replaces** your targets | A spell with an area and a `maxTargets` catches the first creatures in the area up to the cap, whatever the user targeted. Target counts are checked against that list |
| A token in the scene's **padding** is out of everyone's sight | The inner bounds are a sight edge: a fixture standing below the map's bottom row (the `pf` foe at y 3800) is refused by every "that you can see" check, as Foundry's own vision would hide it. Stand fixtures on the map |
| An effect has no `disabled` field | A pf2e Effect item's `system.expired` is derived in `prepareBaseData`, so writing either one is overwritten or ignored. To switch an effect off without deleting it, move its rules aside — see `soulbound/suppression.mjs` |

## 7. Running long jobs

Start detached and poll, because of the 60-second timeout above:

```js
globalThis.__sb.run("name", async (rec) => { /* … rec.log.push(…) … */ return value; });
globalThis.__sb.peek("name");   // { state, error, log, value }
```

`build/live-session.mjs` does not install that helper — paste it once per session, or use the rig,
which owns the same problem:

```js
const api = game.modules.get("isaacs-hb-pf2e").api;
api.rig.installResolver(["Spirit Weapon (Blade)", "Soul Reaper", "Senbonzakura"]);  // answers ChoiceSets
await api.rig.run({ lineage: "Soul Reaper", spirit: "Senbonzakura" });
api.rig.clearResolver();
```

**Always install the ChoiceSet resolver before creating or levelling a Soulbound, and keep it installed
for as long as you keep changing the level.** The class opens a `PickAThingPrompt` for the spirit-weapon
profile, the Lineage, the Spirit and every chosen kidō, and each one blocks the levelling `await`
indefinitely. `rig.run` cleans up its own resolver, so a later `actor.update({level: 9})` outside it hits
"Kidō Learned (9th)" with nobody answering and the job simply stops — with no error, which reads exactly
like a hang. If one is already standing:

```js
[...foundry.applications.instances.values()]
    .find(a => a.constructor.name === "PickAThingPrompt")
    ?.element.querySelector("button.select-button")?.click();
```

**There are two prompt shapes, and the newer one has no `select-button`.** A Svelte `PickAThingPrompt`
carries a `button.sv-btn-indicator` per choice and a plain **Save** — a resolver written against the
older selector answers nothing there and the job hangs exactly as though none were installed. Worse, a
detached prompt (`rendered: false`) ignores both, and the only way out is
`close({force: true})` followed by `element.remove()`.

Nine of them stacked up in one session from a single `actor.update({level: 20})` on a clone, and every
symptom was somewhere else: three CDP timeouts, a world that would not finish launching, and a cast
that resolved `pending` forever with no error and no notification. **Check for a standing prompt before
believing any of those.**

```js
[...foundry.applications.instances.values()].filter((a) => a.constructor.name === "PickAThingPrompt")
```

**The selector is `button.select-button`.** `button[data-choice]` looks right and matches nothing — the
choices are Svelte-rendered buttons carrying no dataset at all, so a resolver written against
`data-choice` silently answers nothing and the job hangs exactly as though no resolver were installed.

A `DialogV2` that will not submit to a click will submit to its own form:

```js
const btn = dialog.querySelector('button[data-action="confirm"]');
btn.closest("form").requestSubmit(btn);
```

**Reset the release ledger before measuring anything that Releases repeatedly.** The first Release each
encounter is free and the next costs a Reiatsu Point, so after a dozen scripted cycles `release()` starts
returning `false` on an empty pool — correct behaviour that reads as a broken ladder:

```js
await actor.update({ "flags.isaacs-hb-pf2e.releaseLedger": { encounter: null, releases: 0 } });
```

## 8. Rebuilding content mid-session

`npm run build` fails with `EPERM … rm packs` while a world is open — the pack LevelDB is locked.

```js
game.shutDown();      // returns to /setup; a POST of {action:"shutdown"} to /game does NOT
```

…then retry the build a couple of times, because the lock clears a second or two after the world
closes. Relaunching the world re-registers `module.json`'s homebrew traits and its
`documentTypes`, with no Foundry server restart needed — which is the only way to pick up a new
one, so a trait or a RegionBehavior subtype added today will not exist until the world has been
relaunched.

**`check:roundtrip` reports hundreds of false differences after a session.** Every document comes back
"differs at `folder`, `sort`, `ownership`" — 529 of them, with no content change behind any of them.
Foundry normalises those fields into the LevelDB when a world loads an unlocked pack, so the check is
comparing the content against a pack the *application* last wrote. A plain `npm run build` restores it.
Rebuild before believing a round-trip failure that names fields nobody authored.

## 9. Casting without aiming

**An emanation needs no click.** It is centred on the caster's own space, so `placeArea` builds it and
returns; all you answer is the "Confirm targets" `DialogV2`:

```js
const dlg = [...foundry.applications.instances.values()]
    .find(a => a.constructor.name === "DialogV2" && /Confirm targets/i.test(a.title ?? ""));
dlg?.element.querySelector('button[data-action="confirm"]')?.click();
```

For everything else, the cheapest honest route is to skip aiming and target by hand through the
module's own setting:

```js
globalThis.__castOn = async (spell, tokens) => {
    const was = game.settings.get("isaacs-hb-pf2e", "areaTargeting");
    await game.settings.set("isaacs-hb-pf2e", "areaTargeting", false);   // configFor returns null
    try {
        [...game.user.targets].forEach(t => t.setTarget(false, { releaseOthers: false }));
        for (const t of tokens) t.setTarget(true, { user: game.user, releaseOthers: false });
        await spell.spellcasting.cast(spell, { message: true });
        await new Promise(r => setTimeout(r, 2500));
    } finally { await game.settings.set("isaacs-hb-pf2e", "areaTargeting", was); }
};
```

That splits the work honestly: **area targeting itself is proven on emanations**, which need no click,
and everything downstream of it — the Reiatsu cost, the charge spend, the save, the riders, the
damage — is proven this way on every shape. It is the right route whenever the clause under test is
downstream of the aim.

### Landing a save in one outcome band

Tuning a creature's Reflex into a nine-point band under the DC is fragile, and it once took four attempts.
Fix the die instead, for the one roll, with Foundry's own hook, and read the die back off the result:

```js
const orig = CONFIG.Dice.randomUniform;
CONFIG.Dice.randomUniform = () => 0.475;          // came back as an 11 on a d20 in v13 — read it, don't assume
try { card.querySelector('[data-action="roll-save"]').click(); await wait(3000); }
finally { CONFIG.Dice.randomUniform = orig; }
```

Pair it with an **untyped** modifier effect named for what it is, removed afterwards, so the total is the
die plus a number you chose. The save must still come from the card's target row (see §6).

## 10. Aiming a line, a cone or a placed burst

When the clause *is* the aim, it can be driven. This section used to say it could not; four things were
tried and the fourth works.

| Attempt | Result |
| :-- | :-- |
| `canvas.animatePan` to the target, then synthetic pointer events | The pan is **refused while a placement is standing**, so the click lands wherever the view already was |
| The extension's own `left_click` at the target | The preview follows the cursor and the placement never commits |
| Stub `canvas.regions.placeRegion` to return the region immediately | Turns `AreaTargeting.run`'s re-aim loop into an **infinite** one: the loop `continue`s whenever the range check fails, and with an instant stub it never yields |
| **A synthetic `PointerEvent` dispatched at `canvas.app.view`** | Commits the placement |

`placeRegion` registers `pointermove` and `pointerdown` on `canvas.stage`, and PIXI federates those
from DOM events on the canvas element. So the event has to be constructed and dispatched there:

```js
const view = canvas.app.view;
const send = (type, x, y) => view.dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: y, button: 0, buttons: type === "pointerdown" ? 1 : 0,
    pointerId: 1, pointerType: "mouse", isPrimary: true, bubbles: true, cancelable: true, view: window,
}));
send("pointermove", cssX, cssY);   // let canvas.mousePosition settle before confirming
await new Promise(r => setTimeout(r, 250));
send("pointerdown", cssX, cssY);
send("pointerup",   cssX, cssY);
```

Those are **CSS** pixels — `canvas.stage.worldTransform.apply(...)` straight through, with no screenshot
scaling, because they go to the DOM rather than to the extension. Check `canvas.mousePosition` against
the world point you meant before sending `pointerdown`; if it is wrong the aim is wrong and the
placement will be too.

Two more things about the placement loop:

- **The Regions layer must be active.** `canvas.regions.activate()` first; a click that lands on the
  token layer does nothing, and activating the layer *during* a placement cancels it.
- **Unpause.** A placement confirmed while the game is paused behaves inconsistently.

**If a placement does get stuck**, Escape usually clears it; reloading the page always does. A stuck
placement makes the *next* cast look broken, so check `canvas.regions.preview.children.length` before
believing a failure.

### A cone or a line takes two clicks, and the extension can make both

The table above predates reading pf2e's own override. `RegionLayerPF2e#placeRegion` gives an **aimable**
shape — a cone or a line, on a square grid — a two-step protocol:

1. The first click **fixes the apex** where the pointer is and starts *aiming*. It does not confirm.
2. While aiming, the pointer sets the **facing**: the angle from the apex to the pointer, snapped to 45° for
   a cone and 5° for a line.
3. The second click confirms.

So the extension's real pointer drives it with no synthetic events at all: `hover` the apex, `left_click`,
`hover` a point along the facing you want, `left_click`. Read `canvas.regions.preview.children[0]
.document.shapes[0]` between the steps — `x`, `y` and `rotation` say exactly what will be placed. Driven this
way the Gland's cone and the Discharge's line (Assimilator, NI-1f and AM-4a) caught what they should.

Three things that looked like bugs and are not:

- **A single click leaves the preview up at 270°.** That is step 1 with the pointer on the apex, where there
  is no angle to take. Moving the pointer fixes it.
- **The extension's `left_click_drag` confirms a wrong facing.** Down, move and up arrive as one burst, so
  the release lands before the move has been processed, and the area is placed at whatever it faced before.
  pf2e then posts "Nothing in the area. Aim again?". Use two clicks, not a drag.
- **The extension's wheel reaches nothing.** It neither rotates the preview (Shift) nor zooms. When a
  rotation has to be set without the pointer, `canvas.regions._onMouseWheel(new WheelEvent("wheel",
  { deltaY: 100, shiftKey: true }))` is Foundry's own handler and steps it 45°.

**The canvas may not render at all until it gets pointer input.** A freshly loaded tab in the extension's
window sat at 1 FPS with a black board, and `canvas.clientCoordinatesFromCanvas` returned coordinates from a
stage transform that had never been updated — thousands of pixels off-screen. One `hover` over the board
woke it. Take coordinates only after that, and check they fall inside the viewport.

**The extension's window can stop loading Foundry altogether.** Late in a long session, the Foundry tab in the
Claude-in-Chrome extension's own window sat on a black page with `game.ready` never true, through reloads and
pointer nudges. The same world loaded normally in the debug Chrome's first window. Treat it as a known outage
rather than a module fault: run the rig from the debug window, and leave real-pointer aims for a fresh session.
