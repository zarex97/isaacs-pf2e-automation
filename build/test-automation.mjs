/**
 * Offline checks for the automation: plain Node against the module's own sources, no Foundry.
 *
 * What can be checked without a world is checked here — the arithmetic, the order stages run in, what a
 * registry refuses, which strings exist, and the module's shape (one wrap per method, no import from
 * outside itself). What needs a world is driven live; see `Docs/tools/live-verification.md`.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { check, report } from "./lib/check.mjs";

const ROOT = path.resolve(url.fileURLToPath(new URL(".", import.meta.url)), "..");
const SCRIPTS = path.join(ROOT, "scripts");

/* -------------------------------------------------------------------------------------------- */
/*  Stubs                                                                                        */
/* -------------------------------------------------------------------------------------------- */

/** pf2e's Predicate, as far as these tests need it: strings, not/or/and, and numeric comparisons. */
class StubPredicate {
    constructor(statements) {
        this.statements = statements;
    }

    test(options) {
        const set = options instanceof Set ? options : new Set(options);
        return this.statements.every((statement) => evaluate(statement, set));
    }
}

function evaluate(statement, options) {
    if (typeof statement === "string") return options.has(statement);
    if ("not" in statement) return !evaluate(statement.not, options);
    if ("or" in statement) return statement.or.some((s) => evaluate(s, options));
    if ("and" in statement) return statement.and.every((s) => evaluate(s, options));
    const COMPARE = { gt: (a, b) => a > b, gte: (a, b) => a >= b, lt: (a, b) => a < b, lte: (a, b) => a <= b, eq: (a, b) => a === b };
    const op = Object.keys(COMPARE).find((k) => k in statement);
    const [key, value] = statement[op];
    return [...options].some((o) => o.startsWith(`${key}:`) && COMPARE[op](Number(o.slice(key.length + 1)), Number(value)));
}

globalThis.game = { pf2e: { Predicate: StubPredicate } };

const { testPredicate } = await import("../scripts/lib/roll-options.mjs");
const { degreeOf } = await import("../scripts/lib/degree.mjs");
const heightening = await import("../scripts/targeting/heightening.mjs");
const { intervalSeconds } = await import("../scripts/economy/recharge.mjs");
const { mayPost, FrequencyGuard } = await import("../scripts/economy/frequency-guard.mjs");
const { Extensions } = await import("../scripts/targeting/extensions.mjs");
const { CastPipeline, CAST_PRIORITY } = await import("../scripts/cast-pipeline.mjs");
const { DamageBus } = await import("../scripts/lib/damage-bus.mjs");
const { CheckPipeline } = await import("../scripts/lib/check-pipeline.mjs");
const { RerollPipeline } = await import("../scripts/lib/reroll-pipeline.mjs");
const { ActorPreparation } = await import("../scripts/lib/actor-preparation.mjs");
const { DetectionModes } = await import("../scripts/lib/detection-modes.mjs");
const { flagOf, flagScopes, registerFlagScope } = await import("../scripts/lib/flags.mjs");
const { describe, canRotate, feetOf } = await import("../scripts/targeting/config.mjs");
const { buildApi } = await import("../scripts/api.mjs");
const { LIB_ID } = await import("../scripts/id.mjs");

const throws = (fn) => {
    try {
        fn();
        return false;
    } catch {
        return true;
    }
};

/* -------------------------------------------------------------------------------------------- */
/*  Predicates and degrees                                                                        */
/* -------------------------------------------------------------------------------------------- */

check("an empty predicate passes", testPredicate([], new Set()), true);
check("a missing option fails", testPredicate(["a"], new Set(["b"])), false);
check("a present option passes", testPredicate(["a"], new Set(["a"])), true);

const degree = (dieValue, modifier, dc, adjustments = null) => degreeOf({ dieValue, modifier, dc, adjustments }).key;
check("ten under the DC is a critical failure", degree(10, 0, 20), "criticalFailure");
check("nine under the DC is a failure", degree(11, 0, 20), "failure");
check("exactly the DC is a success", degree(10, 10, 20), "success");
check("ten over the DC is a critical success", degree(10, 20, 20), "criticalSuccess");
check("a natural 20 raises a failure to a success", degree(20, -5, 20), "success");
check("a natural 1 lowers a success to a failure", degree(1, 25, 20), "failure");
check("a natural 20 cannot exceed a critical success", degree(20, 20, 20), "criticalSuccess");
check("a natural 1 cannot fall below a critical failure", degree(1, 0, 20), "criticalFailure");
const bump = { all: { label: "test", amount: 1 } };
check("an adjustment raises the degree", degree(10, 10, 20, bump), "criticalSuccess");
check("an adjustment naming another outcome does not apply", degree(10, 10, 20, { failure: { label: "t", amount: 1 } }), "success");
check("a named adjustment jumps straight to its degree", degree(10, 0, 20, { all: { label: "t", amount: "criticalSuccess" } }), "criticalSuccess");

/* -------------------------------------------------------------------------------------------- */
/*  Heightening                                                                                  */
/* -------------------------------------------------------------------------------------------- */

const { stepsFor, applyHeightening, applyThresholds, valueAtLevel, thresholdsCrossed, bonusStepsFrom, effectiveLevel, registerStepProvider } = heightening;

check("a cast at its base rank has taken no steps", stepsFor({ baseRank: 3, castRank: 3 }), 0);
check("each rank above the base is a step", stepsFor({ baseRank: 3, castRank: 6 }), 3);
check("an interval of two counts every second rank", stepsFor({ baseRank: 1, castRank: 6, interval: 2 }), 2);
check("steps are never negative", stepsFor({ baseRank: 5, castRank: 3 }), 0);
check("bonus steps add to the steps the rank earned", stepsFor({ baseRank: 1, castRank: 10, bonusSteps: 2 }), 11);

const grown = applyHeightening({ maxTargets: 1, range: 60, areas: 3, length: 15 }, { maxTargets: 1, range: 10, areas: 1, length: 5 }, { baseRank: 4, castRank: 6 });
check("per-step growth applies to every number the block grows", [grown.maxTargets, grown.range, grown.areas, grown.length, grown.steps], [3, 80, 5, 25, 2]);
check("steps are reported even with no block to apply", applyHeightening({}, undefined, { baseRank: 8, castRank: 10 }).steps, 2);
check("a number the base does not have does not grow", applyHeightening({ maxTargets: 0 }, { maxTargets: 1 }, { baseRank: 1, castRank: 5 }).maxTargets, 0);

const thresholds = applyThresholds({ maxTargets: 1, areas: 1, range: 0, length: 0 }, { at: { 12: { maxTargets: 1 }, 16: { maxTargets: 1 } } }, 16);
check("named-level growth arrives at each threshold reached", thresholds.maxTargets, 3);
check("a value ladder answers the highest threshold reached", [10, 13, 18, 20].map((level) => valueAtLevel({ base: 1, at: { 12: 2, 18: 3 } }, level)), [1, 2, 3, 3]);
check("a counter crosses each threshold once, on the way up", thresholdsCrossed([{ at: 5 }, { at: 8 }], 4, 8).map((t) => t.at), [5, 8]);
check("…and never on the way down", thresholdsCrossed([{ at: 5 }], 6, 4), []);

check("no providers, no bonus steps", bonusStepsFrom(["sky:zenith"]), 0);
registerStepProvider("the test sky", (options) => (options.has("sky:zenith") ? 4 : options.has("sky:ascendant") ? 2 : 0));
registerStepProvider("a test boon", (options) => (options.has("boon") ? 1 : 0));
check("providers' steps add up", [bonusStepsFrom([]), bonusStepsFrom(["sky:ascendant"]), bonusStepsFrom(["sky:zenith", "boon"])], [0, 2, 5]);
check("a provider answering nonsense or less than zero adds nothing", (() => {
    registerStepProvider("a broken provider", () => -3);
    return bonusStepsFrom(["boon"]);
})(), 1);
check("a step is worth two levels at a threshold", effectiveLevel({ level: 12, getRollOptions: () => ["sky:ascendant"] }), 16);
check("a provider's name is taken once", throws(() => registerStepProvider("a test boon", () => 0)), true);

/* -------------------------------------------------------------------------------------------- */
/*  Allowances                                                                                   */
/* -------------------------------------------------------------------------------------------- */

check("an hour is 3600 seconds", intervalSeconds("PT1H"), 3600);
check("ten minutes is 600", intervalSeconds("PT10M"), 600);
check("a day, a round and a week are left to pf2e", [intervalSeconds("day"), intervalSeconds("round"), intervalSeconds("P1W")], [0, 0, 0]);

const f = (value) => ({ value, max: 1, per: "PT10M" });
check(
    "a use card at zero is refused unless pf2e just counted that use; spells and frequency-less items pass",
    [
        mayPost({ type: "feat", slug: "x", frequency: f(1) }),
        mayPost({ type: "feat", slug: "x", frequency: f(0) }),
        mayPost({ type: "feat", slug: "x", frequency: f(0), justCounted: true }),
        mayPost({ type: "spell", slug: "x", frequency: f(0) }),
        mayPost({ type: "action", slug: "x", frequency: null }),
    ],
    [true, false, true, true, true],
);
check("an unregistered slug is not exempt", mayPost({ type: "feat", slug: "rewind", frequency: f(0) }), false);
FrequencyGuard.exempt("rewind");
check("a slug another module counts itself is left alone", mayPost({ type: "feat", slug: "rewind", frequency: f(0) }), true);

/* -------------------------------------------------------------------------------------------- */
/*  Area targeting's registries                                                                  */
/* -------------------------------------------------------------------------------------------- */

{
    const ran = [];
    Extensions.registerPreAim("second", 20, () => ran.push("second"));
    Extensions.registerPreAim("first", 10, () => ran.push("first"));
    check("pre-aim checks run in priority order and pass when nothing refuses", [await Extensions.preAim({}, {}), ran], [true, ["first", "second"]]);
    Extensions.registerPreAim("refuses", 15, () => false);
    ran.length = 0;
    check("a pre-aim check answering false refuses, and stops the ones after it", [await Extensions.preAim({}, {}), ran], [false, ["first"]]);

    check("no aimed handler: the review goes ahead", await Extensions.aimed({}, [], null), undefined);
    Extensions.registerAimed("not mine", 10, () => undefined);
    Extensions.registerAimed("a place, not people", 20, async (config) => (config.place ? true : undefined));
    check("an aimed handler that answers ends the run with its answer", [await Extensions.aimed({ place: true }, [], null), await Extensions.aimed({}, [], null)], [true, undefined]);

    const after = [];
    Extensions.registerAfterAim("b", 20, async () => after.push("b"));
    Extensions.registerAfterAim("a", 10, async () => after.push("a"));
    await Extensions.afterAim({}, [], null);
    check("after-aim steps are awaited in priority order", after, ["a", "b"]);

    check("no resolver: the caster's own token", Extensions.originFor({}, {}), null);
    Extensions.registerOriginResolver("elsewhere", 10, (_actor, item) => (item.elsewhere ? "the other token" : null));
    check("the first resolver to answer decides the origin", [Extensions.originFor({}, { elsewhere: true }), Extensions.originFor({}, {})], ["the other token", null]);

    check("no scope predicate: nothing unauthored is in scope", Extensions.inScope({ type: "spell" }), false);
    Extensions.registerScopePredicate("focus spells", (item) => item.traits?.includes("focus"));
    check("a registered scope predicate claims its items", [Extensions.inScope({ traits: ["focus"] }), Extensions.inScope({ traits: [] })], [true, false]);

    check("no area count: one area", await Extensions.areaCount({}, {}), 0);
    Extensions.registerAreaCount((cast) => (cast.pool === 0 ? false : cast.pool));
    check("the area count can name a number or refuse", [await Extensions.areaCount({ pool: 3 }, {}), await Extensions.areaCount({ pool: 0 }, {})], [3, false]);
    check("there is one area count per world", throws(() => Extensions.registerAreaCount(() => 1)), true);
    check("a registration's name is taken once", throws(() => Extensions.registerPreAim("first", 1, () => true)), true);
    check("a registration must be a function", throws(() => Extensions.registerAfterAim("nothing", 1, null)), true);
}

/* -------------------------------------------------------------------------------------------- */
/*  The pipelines                                                                                */
/* -------------------------------------------------------------------------------------------- */

{
    CastPipeline.registerDefaults();
    CastPipeline.before("a refusal", 30, (spell) => !spell.refuse);
    CastPipeline.before("a price", 60, () => true);
    check(
        "the cast pipeline's own stages sit at their priorities, others between",
        CastPipeline.stages().before.map((s) => `${s.priority} ${s.name}`),
        [`${CAST_PRIORITY.aim} area targeting`, "30 a refusal", `${CAST_PRIORITY.spellFrequency} spell frequency`, "60 a price"],
    );

    const seen = [];
    CastPipeline.after("second", 20, (cast, spell) => seen.push(["second", cast, spell]));
    CastPipeline.after("first", 10, (cast, spell) => seen.push(["first", cast, spell]));
    await CastPipeline.afterCast("the variant", "the original");
    check("after-cast stages see what was cast and what the caster owns, in order", seen, [
        ["first", "the variant", "the original"],
        ["second", "the variant", "the original"],
    ]);
    check("a stage's name is taken once", throws(() => CastPipeline.before("a price", 70, () => true)), true);
}

{
    // The cast pipeline refuses on anything falsy — a closed dialog answers null, and that must refuse.
    const { CastPipeline: Fresh } = await import(`../scripts/cast-pipeline.mjs?falsy`);
    Fresh.before("answers null", 10, () => null);
    Fresh.before("never reached", 20, () => {
        throw new Error("a refused cast ran a later stage");
    });
    check("a null answer refuses the cast", await Fresh.beforeCast({}, {}), false);
}

for (const [label, pipeline, register] of [
    ["the damage bus", DamageBus, (n, p) => DamageBus.after(n, p, () => {})],
    ["the check pipeline", CheckPipeline, (n, p) => CheckPipeline.before(n, p, () => {})],
    ["the reroll pipeline", RerollPipeline, (n, p) => RerollPipeline.before(n, p, () => true)],
    ["character preparation", ActorPreparation, (n, p) => ActorPreparation.after(n, p, () => {})],
    ["detection modes", DetectionModes, (n, p) => DetectionModes.after(n, p, () => {})],
]) {
    register("late", 30);
    register("early", 10);
    const names = (pipeline.stages().after ?? pipeline.stages()).map((s) => s.name);
    check(`${label} runs its stages in ascending priority`, names, ["early", "late"]);
    check(`${label} takes each stage name once`, throws(() => register("early", 5)), true);
}

{
    const { RerollPipeline: Fresh } = await import(`../scripts/lib/reroll-pipeline.mjs?fresh`);
    Fresh.before("throws", 5, () => {
        throw new Error("a broken stage");
    });
    // The broken stage logs every time it runs; that is the behaviour under test, not noise to read.
    const logged = console.error;
    console.error = () => {};
    try {
        check("a reroll stage that throws does not object", Fresh.allows({}, {}), true);
        Fresh.before("sentenced", 10, (message) => !message.sentenced);
        check("a reroll stage answering falsy refuses", [Fresh.allows({ sentenced: true }), Fresh.allows({})], [false, true]);
    } finally {
        console.error = logged;
    }
}

/* -------------------------------------------------------------------------------------------- */
/*  Flag scopes                                                                                  */
/* -------------------------------------------------------------------------------------------- */

check("this module's own scope is read first", flagScopes(), [LIB_ID]);
registerFlagScope("a-homebrew");
const doc = { flags: { "a-homebrew": { areaTargeting: "theirs" }, [LIB_ID]: { recharge: "ours" } } };
check("a registered scope is read when this module's has nothing", flagOf(doc, "areaTargeting"), "theirs");
check("this module's own value wins over a registered scope", flagOf({ flags: { "a-homebrew": { k: 1 }, [LIB_ID]: { k: 2 } } }, "k"), 2);
check("nothing in any scope is undefined", flagOf(doc, "missing"), undefined);
check("a scope is registered once", (registerFlagScope("a-homebrew"), flagScopes()), [LIB_ID, "a-homebrew"]);

/* -------------------------------------------------------------------------------------------- */
/*  Area config helpers                                                                          */
/* -------------------------------------------------------------------------------------------- */

check("only cones, lines and rectangles turn", ["cone", "line", "cube", "square", "burst", "emanation"].map(canRotate), [true, true, true, true, false, false]);
check("a range in words is its number, or no limit", [feetOf("120 feet"), feetOf("touch"), feetOf(undefined)], [120, 0, 0]);
check(
    "the rule a placement describes is built from translated parts",
    describe({ area: { type: "burst", value: 20 }, affects: "enemies", includesSelf: false, predicate: [], areas: 1, maxTargets: 0, range: 0 }),
    'ISAACS_AUTOMATION.Rule.Area {"size":20,"shape":"burst","who":"ISAACS_AUTOMATION.Rule.Enemies"}',
);

/* -------------------------------------------------------------------------------------------- */
/*  The rider engine, without Foundry                                                            */
/* -------------------------------------------------------------------------------------------- */

const { RiderExtensions, BUILT_IN_APPLY_TYPES } = await import("../scripts/riders/extensions.mjs");
const { collectRiders, riderAt, isAbilityUse, EVENTS } = await import("../scripts/riders/data.mjs");
const { mergedFlag } = await import("../scripts/lib/flags.mjs");
const { canOffer } = await import("../scripts/riders/reactions.mjs");
const { describeActor, describeDamage } = await import("../scripts/lib/roll-options.mjs");

{
    const throws = (fn) => { try { fn(); return false; } catch { return true; } };
    const fighter = { classDC: { slug: "fighter", dc: { value: 27 } }, spellcasting: [{ statistic: { dc: { value: 30 } } }] };
    const wizard = { classDC: null, spellcasting: [{ statistic: { dc: { value: 22 } } }, { statistic: { dc: { value: 25 } } }] };

    check("a rider save with no DC is the origin's class DC", RiderExtensions.resolveDC(undefined, { originActor: fighter }), 27);
    check("…else its best spell DC", RiderExtensions.resolveDC(undefined, { originActor: wizard }), 25);
    check("a numeric DC is itself", RiderExtensions.resolveDC(18, { originActor: fighter }), 18);
    check("a word nothing answers stays unresolved", RiderExtensions.resolveDC("cosmo", { originActor: fighter }), null);

    RiderExtensions.registerDcResolver("test-late", 20, (dc) => (dc === "cosmo" ? 99 : undefined));
    RiderExtensions.registerDcResolver("test-early", 10, (dc) => (dc === "cosmo" ? 31 : undefined));
    check("a registered DC resolver answers its own word, in priority order", RiderExtensions.resolveDC("cosmo", {}), 31);
    check("a DC resolver's name is taken once", throws(() => RiderExtensions.registerDcResolver("test-early", 0, () => 1)), true);

    check("a counteract with no statistic uses the class DC's", RiderExtensions.defaultStatistic(fighter), "fighter");
    check("…else spellcasting", RiderExtensions.defaultStatistic(wizard), "spellcasting");
    check("spellcasting is the origin's best entry", RiderExtensions.statistic(wizard, "spellcasting")?.dc?.value, 25);

    check("a built-in apply type cannot be registered over", BUILT_IN_APPLY_TYPES.map((type) => throws(() => RiderExtensions.registerApplyType(type, () => {}))).every(Boolean), true);
    RiderExtensions.registerApplyType("test-type", () => "ran");
    check("a registered apply type is found", RiderExtensions.applyType("test-type")?.(), "ran");
    check("an apply type is registered once", throws(() => RiderExtensions.registerApplyType("test-type", () => {})), true);

    const applySource = fs.readFileSync(path.join(ROOT, "scripts", "riders", "apply.mjs"), "utf8");
    const at = applySource.indexOf("async function applyOne(");
    const switched = [...applySource.slice(at, applySource.indexOf("\n}\n", at)).matchAll(/^\s*case "([a-z-]+)":/gm)].map((m) => m[1]);
    check("the built-in list is exactly applyOne's switch", [...BUILT_IN_APPLY_TYPES].sort(), switched.sort());
}

{
    const spell = (id, riders, extra = {}) => ({ id, type: "spell", system: { traits: { value: [] } }, flags: { [LIB_ID]: { riders } }, ...extra });
    const strikeRider = { event: "strike-resolved", apply: { type: "prompt" } };
    const saveRider = { apply: { type: "condition", slug: "frightened" } };
    const cloth = { id: "cloth", type: "equipment", flags: { "a-homebrew": { riders: [strikeRider] } } };
    const fist = { id: "fist", type: "weapon", flags: {} };
    const technique = spell("tech", [strikeRider]);
    const other = spell("other", [saveRider]);
    const actor = { items: [cloth, technique, other], flags: {} };

    const ids = (found) => found.map(({ item, index }) => `${item.id}#${index}`);
    check("a rider with no event is a save-rolled rider", ids(collectRiders({ event: "save-rolled", item: other, actor })), ["other#0"]);
    check("save-rolled reads only the item that forced the save", ids(collectRiders({ event: "save-rolled", item: technique, actor })), []);
    check("a Strike's riders are searched across the sheet, in any registered scope", ids(collectRiders({ event: "strike-resolved", item: fist, actor })), ["cloth#0"]);
    actor.flags[LIB_ID] = { strikeTechnique: { itemId: "tech" } };
    check("an armed spell's Strike rider joins that Strike", ids(collectRiders({ event: "strike-resolved", item: fist, actor })), ["cloth#0", "tech#0"]);

    const nested = spell("nested", [{ apply: { type: "save", riders: [saveRider, { apply: { type: "choice" } }] } }]);
    check("a nested rider is found by its address", riderAt(nested, [0, "riders", 1])?.apply?.type, "choice");
    check("every event the doc lists is one the engine knows", EVENTS.includes("ally-damaged") && EVENTS.includes("aura-tick"), true);

    check("a posted card is a use", isAbilityUse({ rolls: [], flags: { pf2e: { context: { type: "spell-cast" } } } }), true);
    check("a save the rider forced is not another use", isAbilityUse({ rolls: [{}], flags: { pf2e: { context: { type: "saving-throw" } } } }), false);
    check("an unknown context type is not a use", isAbilityUse({ rolls: [], flags: { pf2e: { context: { type: "something-new" } } } }), false);
}

{
    const message = { flags: { "a-homebrew": { ridersApplied: { a: "old", b: "old" } }, [LIB_ID]: { ridersApplied: { b: "new" } } } };
    check("a receipt is read from both namespaces, this module's winning", mergedFlag(message, "ridersApplied"), { a: "old", b: "new" });
    check("no receipt anywhere is undefined", mergedFlag({ flags: {} }, "ridersApplied"), undefined);

    check("a reaction is offered when everything allows it", canOffer({ hasReaction: true, alreadyOffered: false, ownerOnline: true, frequencyLeft: 1 }), true);
    check("…and not to an owner who is offline, or twice, or at zero uses", [
        canOffer({ hasReaction: true, alreadyOffered: false, ownerOnline: false, frequencyLeft: 1 }),
        canOffer({ hasReaction: true, alreadyOffered: true, ownerOnline: true, frequencyLeft: 1 }),
        canOffer({ hasReaction: true, alreadyOffered: false, ownerOnline: true, frequencyLeft: 0 }),
    ], [false, false, false]);

    const target = {
        itemTypes: {
            condition: [{ slug: "frightened", system: { value: { value: 2 } } }],
            effect: [{ slug: "needle", system: { badge: { type: "counter", value: 3 } } }],
        },
        hitPoints: { value: 10, max: 40 },
        items: [],
    };
    const options = describeActor(target);
    check("rider options say a condition, its value and every value it meets", ["rider:target:condition:frightened", "rider:target:condition:frightened:2", "rider:target:condition:frightened:1+", "rider:target:condition:frightened:2+"].every((o) => options.includes(o)), true);
    check("…a counter badge the same way", ["rider:target:effect:needle:3", "rider:target:effect:needle:3+"].every((o) => options.includes(o)) && !options.includes("rider:target:effect:needle:4+"), true);
    check("…and health", [options.includes("rider:target:hp-half-or-less"), options.includes("rider:target:hp-zero")], [true, false]);
    check("damage options name the type, that it landed, and the Strike's outcome", describeDamage({ types: ["cold"], total: 5, outcome: "success" }), ["rider:damage", "rider:damage:type:cold", "rider:damage:dealt", "rider:damage:outcome:success"]);
}

{
    // Two engines would register the same damage stages and both apply every rider.
    const saved = { Hooks: globalThis.Hooks, game: globalThis.game, foundry: globalThis.foundry };
    globalThis.Hooks ??= { once() {}, on() {}, callAll() {} };
    const newer = (a, b) => a.split(".").map(Number).reduce((r, x, i) => r || (x === Number(b.split(".")[i] ?? 0) ? 0 : x > Number(b.split(".")[i] ?? 0) ? 1 : -1), 0) > 0;
    globalThis.foundry = { ...(globalThis.foundry ?? {}), utils: { ...(globalThis.foundry?.utils ?? {}), isNewerVersion: newer } };
    const { homebrewRunsItsOwnEngine } = await import("../scripts/module.mjs");
    const homebrew = (active, minimum) => ({ get: (id) => (id === "isaacs-hb-pf2e" ? { active, relationships: { requires: new Set([{ id: LIB_ID, compatibility: { minimum } }]) } } : undefined) });
    const answers = [[true, "1.0.0"], [true, "1.1.0"], [true, "1.2.0"], [false, "1.0.0"]].map(([active, minimum]) => {
        globalThis.game = { modules: homebrew(active, minimum) };
        return homebrewRunsItsOwnEngine();
    });
    check("the engine stands down only for an active homebrew requiring this module below 1.1.0", answers, [true, false, false, false]);
    Object.assign(globalThis, saved);
}

/* -------------------------------------------------------------------------------------------- */
/*  The vanilla table: where authored config comes from                                          */
/* -------------------------------------------------------------------------------------------- */

const { Vanilla } = await import("../scripts/vanilla/table.mjs");
const { configOf, sourceOf, AUTHORED_KEYS } = await import("../scripts/lib/config-of.mjs");
const { configFor } = await import("../scripts/targeting/config.mjs");

{
    const fear = { riders: [{ apply: { type: "condition", slug: "frightened" } }], areaTargeting: { maxTargets: 1 } };
    Vanilla.setTable({
        aliases: { "magic-missile": "force-barrage" },
        entries: {
            fear,
            "force-barrage": { areaTargeting: { maxTargets: 3 } },
            heal: { areaTargeting: { affects: "allies" }, variants: { threeActions: { areaTargeting: { affects: "all" } } } },
        },
    });
    const spell = (slug, extra = {}) => ({ documentName: "Item", type: "spell", slug, flags: {}, ...extra });

    check("a table entry answers for a vanilla spell", configOf(spell("fear"), "riders"), fear.riders);
    check("…and says it was the table", [sourceOf(spell("fear"), "riders").source, sourceOf(spell("fear"), "riders").module], ["table", LIB_ID]);
    check("an item's own flag wins over the table", configOf(spell("fear", { flags: { [LIB_ID]: { riders: [] } } }), "riders"), []);
    check("…per key: the table still answers the keys the item does not", configOf(spell("fear", { flags: { [LIB_ID]: { riders: [] } } }), "areaTargeting"), { maxTargets: 1 });
    const off = sourceOf(spell("fear", { flags: { "a-homebrew": { riders: false } } }), "riders");
    check("false switches a key off, table and all, and names the scope that said so", [off.value, off.off, off.module], [undefined, true, "a-homebrew"]);
    check("a legacy slug reads its remaster entry", [configOf(spell("magic-missile"), "areaTargeting"), sourceOf(spell("magic-missile"), "areaTargeting").slug], [{ maxTargets: 3 }, "force-barrage"]);
    check("a variant's keys override its spell's", [configOf(spell("heal"), "areaTargeting").affects, configOf(spell("heal", { variantId: "threeActions" }), "areaTargeting").affects], ["allies", "all"]);

    const fromPack = (pack) => spell("fear", { _stats: { compendiumSource: `Compendium.${pack}.spells.Item.abc` } });
    check("a copy from pf2e's own compendium matches", configOf(fromPack("pf2e"), "riders"), fear.riders);
    check("another module's spell sharing the slug does not", configOf(fromPack("some-homebrew"), "riders"), undefined);
    check("state keys never come from the table", AUTHORED_KEYS.includes("ridersApplied") || configOf(spell("fear"), "ridersApplied") !== undefined, false);
    check("only Items are looked up", configOf({ documentName: "ChatMessage", slug: "fear", flags: {} }, "riders"), undefined);

    Vanilla.register("a-bestiary", { fear: { riders: [{ apply: { type: "prompt" } }] }, "own-thing": { riders: [] } });
    check("a registered entry ranks above the table", [configOf(spell("fear"), "riders")[0].apply.type, sourceOf(spell("fear"), "riders").module], ["prompt", "a-bestiary"]);
    check("a registering module's own pack items take its entries", sourceOf(spell("own-thing", { _stats: { compendiumSource: "Compendium.a-bestiary.x.Item.y" } }), "riders").source, "registered");
    Vanilla.register("someone-else", { fear: { riders: [] } });
    check("a slug is registered once; the second module is refused", Vanilla.registered().fear, "a-bestiary");

    Vanilla.setRiderDeferral((slug) => (slug === "fear" ? "pf2e-automations" : null));
    const deferred = sourceOf(spell("fear"), "riders");
    check("a table rider another module covers is deferred, and says to whom", [deferred.value, deferred.deferred], [undefined, "pf2e-automations"]);
    check("…its area is not", configOf(spell("fear"), "areaTargeting"), { maxTargets: 1 });
    check("…and an item's own riders are never deferred", configOf(spell("fear", { flags: { [LIB_ID]: { riders: [1] } } }), "riders"), [1]);
    Vanilla.setRiderDeferral(null);

    // The scope tiers: an authored flag always aims; a table entry is the `registered` tier.
    const saved = { game: globalThis.game, canvas: globalThis.canvas };
    let scope = "registered";
    globalThis.canvas = { ready: true };
    globalThis.game = { ...saved.game, settings: { get: (_m, key) => (key === "areaTargetingScope" ? scope : true) } };
    const burst = (extra) => spell("calm", { actor: { getRollOptions: () => [] }, system: { area: { type: "emanation", value: 30 } }, rank: 4, ...extra });
    Vanilla.setTable({ entries: { calm: { areaTargeting: { affects: "enemies" } } } });
    const tiers = (item) => ["authored", "registered", "all"].map((s) => ((scope = s), configFor(item)?.affects ?? null));
    check("a table area aims under registered and all, not authored-only", tiers(burst()), [null, "enemies", "enemies"]);
    check("an authored flag aims under all three", tiers(burst({ flags: { [LIB_ID]: { areaTargeting: { affects: "allies" } } } })), ["allies", "allies", "allies"]);
    check("areaTargeting: false keeps even 'every spell with an area' off it", tiers(burst({ flags: { [LIB_ID]: { areaTargeting: false } } })), [null, null, null]);
    Object.assign(globalThis, saved);
    Vanilla.setTable({ aliases: {}, entries: {} });
}

{
    // Every authored read goes through configOf: a table can only answer where it is asked.
    const authored = new Set(AUTHORED_KEYS);
    const bypassed = [];
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".mjs") ? [path.join(dir, e.name)] : []));
    for (const file of walk(SCRIPTS)) {
        const text = fs.readFileSync(file, "utf8");
        const flagConst = /(?:export )?const FLAG = "([A-Za-z]+)"/.exec(text)?.[1];
        for (const m of text.matchAll(/flagOf\(\s*([\w.]+)\s*,\s*("([A-Za-z]+)"|FLAG)\s*\)/g)) {
            const key = m[3] ?? flagConst;
            if (authored.has(key) && /item|source/i.test(m[1])) bypassed.push(`${path.relative(ROOT, file)}: flagOf(${m[1]}, ${m[2]})`);
        }
    }
    check("no authored key is read off an item with flagOf", bypassed, []);
}

/* -------------------------------------------------------------------------------------------- */
/*  The vanilla table's data: the bundle, and every entry checked against pf2e itself            */
/* -------------------------------------------------------------------------------------------- */

{
    const V = await import("./lib/vanilla.mjs");
    const { EVENTS, OUTCOMES } = await import("../scripts/riders/data.mjs");
    const { AREA_SHAPES, AFFECTS } = await import("../scripts/targeting/config.mjs");
    const index = JSON.parse(fs.readFileSync(V.INDEX, "utf8"));
    const en = JSON.parse(fs.readFileSync(path.join(ROOT, "lang", "en.json"), "utf8"));
    const flat = (obj, prefix = "") => Object.entries(obj).flatMap(([k, v]) => (typeof v === "object" ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
    const ctx = { index, authoredKeys: AUTHORED_KEYS, events: EVENTS, outcomes: OUTCOMES, applyTypes: BUILT_IN_APPLY_TYPES, areaShapes: AREA_SHAPES, affects: AFFECTS, i18nKeys: new Set(flat(en)) };

    const built = V.bundle();
    const carriageReturn = new RegExp(String.fromCharCode(13), "g");
    check("data/vanilla.json is what content/vanilla builds (npm run build:vanilla)", fs.readFileSync(V.BUNDLE, "utf8").replace(carriageReturn, ""), V.serialise(built));
    check("the bundle names the pf2e it was checked against", built.pf2e, index.pf2e);
    check("every vanilla entry is sound", Object.entries(built.entries).flatMap(([slug, entry]) => V.problemsWith(slug, entry, ctx)), []);
    check("every alias leads to an entry, and shadows no live slug", V.aliasProblems(built.aliases, built.entries, index), []);

    // The checks themselves, on fixtures: a sound entry passes, and each kind of mistake is named.
    const fearUuid = Object.values(index.effects)[0];
    const sound = {
        areaTargeting: { maxTargets: 2 },
        riders: [{ outcomes: ["failure"], apply: { type: "condition", slug: "frightened", value: 2 } },
            { event: "action-used", apply: { type: "effect", uuid: fearUuid } }],
    };
    check("a sound entry has no problems", V.problemsWith("fear", sound, ctx), []);
    const heal = Object.keys(index.spells.heal?.overlays ?? {})[0];
    const wrong = (slug, entry) => V.problemsWith(slug, entry, ctx).length;
    check("each mistake is caught", {
        slug: wrong("not-a-spell", {}),
        key: wrong("fear", { ridersApplied: {} }),
        variant: wrong("heal", { variants: { nope: { riders: [] } } }),
        variantOk: wrong("heal", { variants: { [heal]: { areaTargeting: { affects: "allies" } } } }),
        condition: wrong("fear", { riders: [{ apply: { type: "condition", slug: "terrified" } }] }),
        effect: wrong("fear", { riders: [{ apply: { type: "effect", uuid: "Compendium.pf2e.spell-effects.Item.xxxxxxxxxxxxxxxx" } }] }),
        event: wrong("fear", { riders: [{ event: "spell-landed", apply: { type: "prompt" } }] }),
        outcome: wrong("fear", { riders: [{ outcomes: ["fail"], apply: { type: "prompt" } }] }),
        type: wrong("fear", { riders: [{ apply: { type: "equip" } }] }),
        save: wrong("fear", { riders: [{ apply: { type: "save", statistic: "perception" } }] }),
        nested: wrong("fear", { riders: [{ apply: { type: "save", statistic: "will", riders: [{ apply: { type: "condition", slug: "terrified" } }] } }] }),
        literal: wrong("fear", { riders: [{ apply: { type: "prompt", text: "Run away." } }] }),
        missingKey: wrong("fear", { riders: [{ apply: { type: "prompt", text: "ISAACS_AUTOMATION.Vanilla.fear.Nope" } }] }),
        shape: wrong("calm", { areaTargeting: { area: { type: "blob", value: 10 } } }),
        affects: wrong("calm", { areaTargeting: { affects: "friends" } }),
    }, { slug: 1, key: 1, variant: 1, variantOk: 0, condition: 1, effect: 1, event: 1, outcome: 1, type: 1, save: 1, nested: 1, literal: 1, missingKey: 1, shape: 1, affects: 1 });
    check("an alias to nothing, or over a live slug, is caught", V.aliasProblems({ "magic-missile": "force-barrage", fear: "calm" }, { calm: {} }, index).length, 2);

    // The words a table entry names by key are read back translated; an item's own text is left alone.
    const savedGame = globalThis.game;
    globalThis.game = { ...savedGame, i18n: { has: (k) => k === "ISAACS_AUTOMATION.Vanilla.slow.Prompt", localize: () => "Run!" } };
    Vanilla.setTable({ entries: { slow: { riders: [{ apply: { type: "prompt", text: "ISAACS_AUTOMATION.Vanilla.slow.Prompt" } }] } } });
    const item = (flags = {}) => ({ documentName: "Item", slug: "slow", flags });
    check("a table entry's key is read as its words", configOf(item(), "riders")[0].apply.text, "Run!");
    check("an item's own text is not touched", configOf(item({ [LIB_ID]: { riders: [{ apply: { type: "prompt", text: "ISAACS_AUTOMATION.Vanilla.slow.Prompt" } }] } }), "riders")[0].apply.text, "ISAACS_AUTOMATION.Vanilla.slow.Prompt");
    Vanilla.setTable({ aliases: {}, entries: {} });
    globalThis.game = savedGame;

    // A newer pf2e installed here than the index was made from: say so, but do not fail CI over it.
    const local = path.join(process.env.FOUNDRY_DATA ?? path.join(process.env.LOCALAPPDATA ?? "", "FoundryVTT", "Data"), "systems", "pf2e", "system.json");
    if (fs.existsSync(local)) {
        const installed = JSON.parse(fs.readFileSync(local, "utf8")).version;
        if (installed !== index.pf2e) console.warn(`pf2e ${installed} is installed; the index is from ${index.pf2e}. Run npm run index:pf2e.`);
    }
}

/* -------------------------------------------------------------------------------------------- */
/*  Coexistence: a table rider steps aside for a spell another module already automates           */
/* -------------------------------------------------------------------------------------------- */

{
    const { Coexistence, RIDERS_OFF } = await import("../scripts/vanilla/coexistence.mjs");
    const index = JSON.parse(fs.readFileSync(path.join(ROOT, "build", "data", "pf2e-index.json"), "utf8"));
    const assistant = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "coverage", "pf2e-assistant.json"), "utf8"));
    check("PF2e Assistant's shipped list says which version it came from", [assistant.module, typeof assistant.version], ["pf2e-assistant", "string"]);
    check("…and names only real pf2e spells", assistant.slugs.filter((slug) => !index.spells[slug]), []);

    const saved = { game: globalThis.game, fetch: globalThis.fetch };
    let choice = "uncovered";
    const active = new Set(["pf2e-automations", "pf2e-assistant"]);
    globalThis.game = {
        ...saved.game,
        settings: { get: (_m, k) => (k === "vanillaRiders" ? choice : true), register() {} },
        modules: { get: (id) => ({ active: active.has(id) }) },
        packs: { get: (id) => (id === "pf2e.spells-srd" ? { getIndex: async () => [{ _id: "fearId0000000000", name: "Fear", system: { slug: "fear" } }] } : undefined) },
    };
    globalThis.fetch = async (url) => ({
        ok: true,
        json: async () => (url.includes("pf2e-automations")
            ? { groups: [
                { group: "spell", name: "Fear", isActive: true, source: ["Compendium.pf2e.spells-srd.Item.fearId0000000000"] },
                { group: "spell", name: "Slow", isActive: false, source: ["Compendium.pf2e.spells-srd.Item.slowId0000000000"] },
                { group: "spell", name: "Calm Down", isActive: true, source: [], baseRules: [{ predicate: ["origin:item:calm"] }] },
                { group: "feat", name: "Power Attack", isActive: true, source: [] },
            ] }
            : { slugs: ["daze"] }),
    });
    await Coexistence.gather();
    const covering = Coexistence.covered();
    check("PF2e Automations' active spell groups are read by the uuid they name, else their predicates", [covering.fear, covering.calm, covering.slow, covering["power-attack"]], ["pf2e-automations", "pf2e-automations", undefined, undefined]);
    check("PF2e Assistant's list is read from the shipped file", covering.daze, "pf2e-assistant");

    Vanilla.setRiderDeferral((slug) => Coexistence.deferredTo(slug));
    Vanilla.setTable({ entries: { fear: { riders: [{ apply: { type: "prompt" } }], areaTargeting: { maxTargets: 1 } }, synesthesia: { riders: [{ apply: { type: "prompt" } }] } } });
    const spellItem = (slug) => ({ documentName: "Item", slug, flags: {} });
    // `fear` was registered by a test module above; Synesthesia is the table's alone.
    const ridersFor = (slug) => { const s = sourceOf(spellItem(slug), "riders"); return s.deferred ?? (s.value ? "applies" : "none"); };
    check("uncovered (the default): a covered spell's table riders step aside, an uncovered one's apply", [ridersFor("fear"), ridersFor("synesthesia")], ["pf2e-automations", "applies"]);
    choice = "all";
    check("all: every table rider applies", [ridersFor("fear"), ridersFor("synesthesia")], ["applies", "applies"]);
    choice = "off";
    check("off: none do, and the setting is what says so", [ridersFor("fear"), ridersFor("synesthesia")], [RIDERS_OFF, RIDERS_OFF]);
    check("…while the table's areas still answer", configOf(spellItem("fear"), "areaTargeting"), { maxTargets: 1 });
    active.clear();
    choice = "uncovered";
    await Coexistence.gather();
    check("with neither module active, nothing is deferred", ridersFor("fear"), "applies");

    Vanilla.setRiderDeferral(null);
    Vanilla.setTable({ aliases: {}, entries: {} });
    Object.assign(globalThis, saved);
}

/* -------------------------------------------------------------------------------------------- */
/*  The contract                                                                                 */
/* -------------------------------------------------------------------------------------------- */

{
    const api = buildApi();
    check("the API names every pipeline", ["castPipeline", "damageBus", "checkPipeline", "actorPreparation", "detectionModes", "rerollPipeline"].every((k) => api[k]?.stages), true);
    check("the API offers the targeting registries", ["registerPreAim", "registerAimed", "registerAfterAim", "registerOriginResolver", "registerScopePredicate", "registerAreaCount"].every((k) => typeof api.targeting[k] === "function"), true);
    check("the API offers flag scopes, step providers and exemptions", [typeof api.flags.registerFlagScope, typeof api.heightening.registerStepProvider, typeof api.frequencyGuard.exempt], ["function", "function", "function"]);

    // Every `api.<key>` Docs/api.md names is on the object, so the contract cannot promise what is not there.
    const doc = fs.readFileSync(path.join(ROOT, "Docs", "api.md"), "utf8");
    const named = new Set([...doc.matchAll(/`api\.([a-zA-Z]+)/g)].map((m) => m[1]));
    check("every api key Docs/api.md names exists", [...named].filter((k) => !(k in api)).sort(), []);
    check("every registry Docs/api.md lists on riderExtensions exists", [...doc.matchAll(/^\| `(register[A-Za-z]*)\(/gm)].map((m) => m[1]).filter((k) => !(k in api.riderExtensions) && !(k in api.targeting)).sort(), []);
}

/* -------------------------------------------------------------------------------------------- */
/*  The module's shape                                                                           */
/* -------------------------------------------------------------------------------------------- */

const mjsUnder = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? mjsUnder(path.join(dir, e.name)) : e.name.endsWith(".mjs") ? [path.join(dir, e.name)] : []));
const sources = mjsUnder(SCRIPTS).map((file) => ({ file, rel: path.relative(ROOT, file).split(path.sep).join("/"), text: fs.readFileSync(file, "utf8") }));

/**
 * One wrap per method. libWrapper refuses two wrappers on the same method from one package, and the throw
 * once took every feature registered after it down with it. Every wrap goes through `wrap()` with the
 * target as a literal, so they can be counted.
 */
{
    const claims = sources.flatMap(({ rel, text }) => [...text.matchAll(/\bwrap\(\s*["']([^"']+)["']/g)].map((m) => [m[1], rel]));
    const targets = claims.map(([target]) => target);
    check("no method is wrapped twice", targets.filter((t, i) => targets.indexOf(t) !== i), []);
    check("every wrap the module owns is there", [...targets].sort(), [
        "CONFIG.PF2E.Actor.documentClasses.character.prototype.applyDamage",
        "CONFIG.PF2E.Actor.documentClasses.character.prototype.prepareDerivedData",
        "CONFIG.PF2E.Item.documentClasses.action.prototype.toMessage",
        "CONFIG.PF2E.Item.documentClasses.spellcastingEntry.prototype.cast",
        "CONFIG.Token.documentClass.prototype._prepareDetectionModes",
        "game.pf2e.Check.rerollFromMessage",
        "game.pf2e.Check.roll",
    ]);
}

/**
 * Where a `"prototype"` wrap actually lands.
 *
 * The strategy exists for one reason — `ActorPF2e#applyDamage` is declared on the shared base and
 * inherited by every actor type, so a wrapper defined on the one subclass the path names leaves NPCs
 * untouched — and for most of this code's life it did precisely that. The walk stopped at the **first**
 * prototype that owned the method, and pf2e's `CharacterPF2e` declares its own `applyDamage`, so the patch
 * went on the character class alone. **No damage rider in the module had ever fired against an NPC**,
 * which is almost everything an area is aimed at.
 *
 * Nothing here needs Foundry: the bug is a prototype-chain walk, and a three-class chain reproduces it
 * exactly. The second check is the other half — a subclass override must still run, reaching the patched
 * method through `super`.
 */
class WrapBase {
    hit() {
        return "base";
    }
}
class WrapSub extends WrapBase {
    hit() {
        return `sub(${super.hit()})`;
    }
}
class WrapSibling extends WrapBase {}

globalThis.__wrapProbe = { classes: { sub: WrapSub, sibling: WrapSibling } };
const { wrap: wrapMethod } = await import("../scripts/lib/wrap.mjs");
wrapMethod("__wrapProbe.classes.sub.prototype.hit", function (wrapped, ...args) {
    return `wrapped:${wrapped(...args)}`;
}, { feature: "the prototype-walk test", strategy: "prototype" });

check("a prototype wrap lands on the class that declares the method", new WrapSibling().hit(), "wrapped:base");
check("a subclass override still runs, reaching the wrap through super", new WrapSub().hit(), "sub(wrapped:base)");

{
    const escapes = [];
    for (const { file, rel, text } of sources) {
        for (const m of text.matchAll(/(?:from|import\()\s*["']([^"']+\.mjs)(?:\?[^"']*)?["']/g)) {
            const target = path.resolve(path.dirname(file), m[1]);
            if (!target.startsWith(SCRIPTS + path.sep)) escapes.push(`${rel} → ${m[1]}`);
        }
    }
    check("the module imports nothing from outside its own scripts", escapes, []);
}

/** Every key the code and the template ask for exists in the English file, and none of it is unused. */
{
    const en = JSON.parse(fs.readFileSync(path.join(ROOT, "lang", "en.json"), "utf8"));
    const flatten = (obj, prefix = "") => Object.entries(obj).flatMap(([k, v]) => (typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
    const defined = new Set(flatten(en));
    // A quoted key under any of the file's own top-level groups (`"Aim.Failed"`, `"Banish.Returns"`).
    const groups = Object.keys(en.ISAACS_AUTOMATION).join("|");
    const groupKey = new RegExp(`["'\`]((?:${groups})\\.[A-Z][A-Za-z]*(?:\\.[A-Za-z]+)*)["'\`]`, "g");
    const used = new Set();
    for (const { text } of sources) {
        // Any quoted key, wherever it is chosen — a ternary picks between two, a map names three.
        for (const m of text.matchAll(groupKey)) used.add(`ISAACS_AUTOMATION.${m[1]}`);
        // A key spelled from a value: every key under that prefix is one the value can name.
        for (const [spelled, prefix] of [["Frequency.Per.${per}", "Frequency.Per."], ["Outcome.${outcome}", "Outcome."]]) {
            if (text.includes(spelled)) for (const k of defined) if (k.startsWith(`ISAACS_AUTOMATION.${prefix}`)) used.add(k);
        }
    }
    for (const m of fs.readFileSync(path.join(ROOT, "templates", "area-targets.hbs"), "utf8").matchAll(/localize "([^"]+)"/g)) used.add(m[1]);
    // The vanilla table names its words by full key.
    const vanillaDir = path.join(ROOT, "content", "vanilla");
    for (const file of fs.existsSync(vanillaDir) ? fs.readdirSync(vanillaDir) : []) {
        for (const m of fs.readFileSync(path.join(vanillaDir, file), "utf8").matchAll(/"(ISAACS_AUTOMATION\.Vanilla\.[^"]+)"/g)) used.add(m[1]);
    }
    check("every string the module shows is in lang/en.json", [...used].filter((k) => !defined.has(k)).sort(), []);
    check("lang/en.json carries no string nothing shows", [...defined].filter((k) => !used.has(k)).sort(), []);
}

{
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "module.json"), "utf8"));
    check("the manifest's id is the one the code uses", manifest.id, LIB_ID);
    check("the manifest's files exist", [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map((l) => l.path)].filter((p) => !fs.existsSync(path.join(ROOT, p))), []);
}

/**
 * Docs/riders.md is a third copy of two lists the source already holds: the apply-type switch and EVENTS.
 * The homebrew's README drifted to seven of twenty-one types before a check like this caught it.
 */
{
    const doc = fs.readFileSync(path.join(ROOT, "Docs", "riders.md"), "utf8");
    const documentedIn = (heading, nextHeading) => {
        const start = doc.indexOf(heading);
        const names = new Set();
        for (const line of doc.slice(start, doc.indexOf(nextHeading, start)).split("\n")) {
            if (!line.startsWith("|")) continue;
            for (const [, name] of (line.split("|")[1] ?? "").matchAll(/`([a-z-]+)`/g)) names.add(name);
        }
        names.delete("type");
        names.delete("event");
        return names;
    };
    const applySource = fs.readFileSync(path.join(ROOT, "scripts", "riders", "apply.mjs"), "utf8");
    const dataSource = fs.readFileSync(path.join(ROOT, "scripts", "riders", "data.mjs"), "utf8");
    // Anchored to applyOne's switch: other switches in the file have lowercase-hyphen cases of their own.
    const at = applySource.indexOf("async function applyOne(");
    const body = applySource.slice(at, applySource.indexOf("\n}\n", at));
    const dispatched = new Set([...body.matchAll(/^\s*case "([a-z-]+)":/gm)].map((m) => m[1]));
    const eventsBlock = dataSource.slice(dataSource.indexOf("export const EVENTS"));
    const events = new Set([...eventsBlock.slice(0, eventsBlock.indexOf("]")).matchAll(/"([a-z-]+)"/g)].map((m) => m[1]));
    const types = documentedIn("### What a rider can do", "### Areas");
    const documentedEvents = documentedIn("### Events", "### What a rider can do");
    const missing = (a, b) => [...a].filter((x) => !b.has(x)).sort();
    check("Docs/riders.md documents every apply type the dispatcher handles", missing(dispatched, types), []);
    check("Docs/riders.md invents no apply type", missing(types, dispatched), []);
    check("Docs/riders.md documents every event", missing(events, documentedEvents), []);
    check("Docs/riders.md invents no event", missing(documentedEvents, events), []);
}

report("Automation tests");
