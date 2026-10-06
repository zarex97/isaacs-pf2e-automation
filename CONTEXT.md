# Isaac's PF2e Automation

Automation for the Pathfinder Second Edition system on Foundry VTT: aiming areas, a single wrapper per
intercepted method with stages hanging off it, and the allowances pf2e writes down but does not enforce.
Other modules — the homebrew this was extracted from first — build on it through its API.

## Language

### Area targeting

**Area**:
The shape an ability affects — burst, cone, cube, cylinder, emanation, line, ring or square — and its size.
Either the system's own `system.area`, or authored in the item's flags (a **synthetic area**, for "creatures
within 30 feet").

**Placement**:
One area put on the board as a Scene Region, aimed, and confirmed. An ability may make several.

**Origin**:
The token a cast is measured from — range, line of effect, where a self-anchored area sits. The caster's own
token unless a registered **origin resolver** names another.

**Catch**:
Who a placement contains, each judged by the ability's rule: caught (targetable) or rejected with a reason.
Never "hit" — nothing has been rolled yet.

**Review**:
The dialog after a placement that lists who was caught and who was rejected, and lets the caster confirm,
re-aim or call it off.

**Authored**:
Written for area targeting — the item carries `areaTargeting` config in a **flag scope**. An authored item
always aims; the scope setting governs everything else.

**Scope predicate**:
A registered rule that puts an unauthored item in scope under the `registered` setting.
_Avoid_: "Technique" — that is one homebrew's word for its own focus spells.

**Flag scope**:
A module id whose flags this module reads authored config from — its own first, then each registered one.

### Pipelines

**Pipeline**:
The one wrapper on an intercepted method, plus its ordered stages.
_Avoid_: "hook" for a stage — a Foundry hook cannot be awaited, ordered, or made to refuse.

**Stage**:
One registered step on a pipeline, with a name and a priority. Lower priority runs first.

**Refuse**:
What a `before` stage does to stop the cast, the reroll or the use. A refusal says why itself.

**Step provider**:
A registered source of heightening steps the cast rank cannot express.

### Allowances

**Allowance**:
An item's frequency — uses per interval. pf2e counts some and refills some; this module enforces and refills
the rest.

**Period**:
A named interval another module turns over itself (a homebrew's "Zenith day"); `refillPeriod` refills it.

### Riders

**Rider**:
What an item does to a creature *besides* damage, authored in its `riders` flag: an **event**, the
outcomes it fires on, a predicate, and what it applies.

**Event**:
What a rider keys off — a save rolled, a Strike resolved, damage applied, a turn starting or ending, an
aura ticking. Each names whose items are read.

**Apply type**:
What a rider does — `condition`, `save`, `counteract`, `prompt`… A built-in one, or one a module registered.

**Origin** (of a rider):
The creature whose item the rider is on; it is the origin of the DC, the area and anything `self`.

**Snapshot**:
The world as it was before a pass applied anything. Riders are chosen against it, so an escalation ladder
advances one step per hit; a `live` rider is chosen against the world as the pass leaves it.

**Receipt**:
What a pass applied, kept on the message, so a reroll can take back exactly that and nothing else.

**Relay**:
The socket path from whoever saw the event to the active GM, who is the only one who may write to every
sheet. No GM online: the caster is told, once per cast.

**Extension**:
A registration on `api.riderExtensions` that answers a question the engine asks — a DC, a statistic, a
duration — on behalf of content the engine knows nothing about.
_Avoid_: "branch" — the engine has none for any one class.

**Lingering area**:
A Region a cast leaves behind, expiring with world time.

**Enemy terrain**:
Difficult terrain that only slows the origin's opponents.

### Vanilla content

**Vanilla table**:
Config for content nobody authored for this module, by slug, in the shape item flags carry — this module's
own (`data/vanilla.json`), plus entries other modules **register**.

**Authored key**:
A flag key content is written with (`areaTargeting`, `riders`, …), which a table entry may supply. Every
other flag is state the module wrote itself.
_Avoid_: "flag" for a table entry's key — it is not on the item.

**Deferred**:
A table rider left to another active module that already covers the spell.
