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
