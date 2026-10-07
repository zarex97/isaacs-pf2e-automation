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
        [`${CAST_PRIORITY.forbids} what a form forbids`, `${CAST_PRIORITY.requires} what a spell needs`, `${CAST_PRIORITY.weaponVariant} a variant from the weapon in hand`, `${CAST_PRIORITY.actionVariant} the actions spent`, `${CAST_PRIORITY.castChoice} a choice made as it is cast`, `${CAST_PRIORITY.aim} area targeting`, "30 a refusal", `${CAST_PRIORITY.spellFrequency} spell frequency`, "60 a price"],
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
    const web = { type: "spell", spellcasting: { statistic: { dc: { value: 31 } } } };
    check("\"spell\" is the spell's own DC, as no DC is", [RiderExtensions.resolveDC("spell", { originActor: fighter, item: web }), RiderExtensions.resolveDC(undefined, { originActor: fighter, item: web })], [31, 31]);

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
    check("damage options say how the blow came: blocked, melee, unarmed, from an adjacent attacker", describeDamage({ types: ["slashing"], total: 3, blocked: true, melee: true, adjacent: true }), ["rider:damage", "rider:damage:type:slashing", "rider:damage:dealt", "rider:damage:blocked", "rider:damage:melee", "rider:damage:adjacent"]);
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
    check("Docs/vanilla.md is what content/vanilla builds (npm run build:vanilla)", fs.readFileSync(V.DOC, "utf8").replace(carriageReturn, ""), V.docs(built, index, en));
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
    check("a shape choice that is not a shape or none is caught", wrong("grease", { areaTargetingShapes: [{ type: "blob", value: 10 }, { type: "none" }] }), 1);
    check("an anchor that is not self, free or caster is caught", wrong("lightning-bolt", { areaTargeting: { anchor: "hand" } }), 1);
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
    check("an area held while inside names real conditions and holds something", {
        sound: wrong("mist", { lingering: { inside: { conditions: ["concealed"] } } }),
        condition: wrong("mist", { lingering: { inside: { conditions: ["foggy"] } } }),
        empty: wrong("mist", { lingering: { inside: {} } }),
        rules: wrong("mist", { lingering: { inside: { rules: [{ value: 1 }] } } }),
        listed: wrong("mist", { lingering: [{ inside: { conditions: ["foggy"] } }] }),
        darkness: wrong("darkness", { lingering: { darkness: "yes" } }),
        darknessOk: wrong("darkness", { lingering: { darkness: true } }),
        webSave: wrong("web", { lingering: { save: { statistics: ["athletics", "reflex"], riders: [{ outcomes: ["failure"], apply: { type: "effect", label: "ISAACS_AUTOMATION.Vanilla.web.Slowed", rules: [{ key: "FlatModifier" }] } }] } } }),
        saveStatistic: wrong("web", { lingering: { save: { statistics: ["athletics", "luck"] } } }),
        saveNone: wrong("web", { lingering: { save: { riders: [] } } }),
        saveRider: wrong("web", { lingering: { save: { statistic: "reflex", riders: [{ apply: { type: "condition", slug: "stuck" } }] } } }),
        inlineNoLabel: wrong("web", { riders: [{ apply: { type: "effect", rules: [{ key: "FlatModifier" }] } }] }),
        replaces: wrong("scatter-scree", { lingering: { replacesPrevious: "yes" } }),
        follows: wrong("malediction", { lingering: { followsCaster: "yes" } }),
        sustainNoRadius: wrong("malediction", { lingering: { sustain: { saveNewcomers: true } } }),
        inlineNoKey: wrong("web", { riders: [{ apply: { type: "effect", label: "ISAACS_AUTOMATION.Vanilla.web.Slowed", rules: [{ value: -10 }] } }] }),
    }, { sound: 0, condition: 1, empty: 1, rules: 1, listed: 1, darkness: 1, darknessOk: 0, webSave: 0, saveStatistic: 1, saveNone: 1, saveRider: 1, inlineNoLabel: 1, replaces: 1, follows: 1, sustainNoRadius: 1, inlineNoKey: 1 });
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
/*  The vanilla spell tracker holds to pf2e and to the table                                    */
/* -------------------------------------------------------------------------------------------- */

{
    const file = path.join(ROOT, "Docs", "clauses", "vanilla-spells.md");
    const text = fs.readFileSync(file, "utf8");
    const index = JSON.parse(fs.readFileSync(path.join(ROOT, "build", "data", "pf2e-index.json"), "utf8"));
    const MARKS = ["☐", "✅", "⚠️", "❌", "🔧", "—"];
    const rows = text.split(/\r?\n/).filter((line) => /^\| VS-\d+ /.test(line)).map((line) => {
        const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
        return { id: cells[0], slug: cells[1].replace(/`/g, ""), staticCheck: cells[6], mark: cells[7] };
    });
    check("the tracker has forty rows, numbered once each", [rows.length, new Set(rows.map((r) => r.id)).size], [40, 40]);
    check("every tracked spell is a real pf2e spell", rows.filter((r) => !index.spells[r.slug]).map((r) => r.slug), []);
    check("no spell is tracked twice", rows.length - new Set(rows.map((r) => r.slug)).size, 0);
    check("every row carries one of the six marks", rows.filter((r) => !MARKS.includes(r.mark)).map((r) => `${r.id} ${r.mark}`), []);
    check("a ✅ row has a table entry behind it, or says why it needs none",
        rows.filter((r) => r.mark === "✅" && !fs.existsSync(path.join(ROOT, "content", "vanilla", `${r.slug}.json`)) && !r.staticCheck).map((r) => r.id), []);
    // VS-02: a spell pf2e already gives an area aims through the scope setting alone — an entry would
    // promote it to the registered tier and quietly change what the default scope means (Q27).
    check("VS-02 Fireball stays out of the table", fs.existsSync(path.join(ROOT, "content", "vanilla", "fireball.json")), false);
    const counted = Object.fromEntries(MARKS.map((mark) => [mark, rows.filter((r) => r.mark === mark).length]));
    const table = Object.fromEntries(MARKS.map((mark) => [mark, Number(new RegExp(`^\\| ${mark}[^|]*\\| (\\d+) \\|`, "m").exec(text)?.[1])]));
    check("the counts table is the rows counted", table, counted);
}

/* -------------------------------------------------------------------------------------------- */
/*  The third tracker: every clause is pf2e's own words                                         */
/* -------------------------------------------------------------------------------------------- */

{
    const { plainText, trackedSlugs } = await import("./lib/spell-text.mjs");
    check("a link reads as its label, a template as its size, a roll as its formula",
        plainText("<p>is @UUID[Compendium.pf2e.conditionitems.Item.Dazzled]{Dazzled} in a @Template[burst|distance:10] for [[/r 1d4 #rounds]]{1d4 rounds}, @Damage[2d6[fire]]</p>"),
        "is Dazzled in a 10-foot burst for 1d4 rounds, 2d6[fire]");
    check("a tracker's spells are read off its spell table", trackedSlugs("| VS-41 | `floating-flame` | 2 |\n| VS-41a | \"x\" |"), ["floating-flame"]);

    const file = path.join(ROOT, "Docs", "clauses", "vanilla-spells-3.md");
    const text = fs.readFileSync(file, "utf8");
    const index = JSON.parse(fs.readFileSync(path.join(ROOT, "build", "data", "pf2e-index.json"), "utf8"));
    const words = JSON.parse(fs.readFileSync(path.join(ROOT, "build", "data", "pf2e-spell-text.json"), "utf8")).spells;
    const MARKS = ["☐", "✅", "⚠️", "❌", "🔧", "—"];
    const spells = Object.fromEntries([...text.matchAll(/^\| (VS-\d+) \| `([a-z0-9-]+)` \|/gm)].map((m) => [m[1], m[2]]));
    const clauses = text.split(/\r?\n/).filter((line) => /^\| VS-\d+[a-z] /.test(line)).map((line) => {
        const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
        const [, spell, letter] = /^(VS-\d+)([a-z])$/.exec(cells[0]);
        return { id: cells[0], spell, letter, clause: cells[1].replace(/^"|"$/g, ""), mark: cells[4] };
    });
    check("the third tracker lists sixty spells, each once", [Object.keys(spells).length, new Set(Object.values(spells)).size], [60, 60]);
    check("…none of them already tracked in the second", Object.values(spells).filter((slug) => fs.readFileSync(path.join(ROOT, "Docs", "clauses", "vanilla-spells.md"), "utf8").includes(`\`${slug}\``)), []);
    check("…all real pf2e spells", Object.values(spells).filter((slug) => !index.spells[slug]), []);
    check("every clause belongs to a listed spell, and every spell has clauses",
        [clauses.filter((c) => !spells[c.spell]).map((c) => c.id), Object.keys(spells).filter((id) => !clauses.some((c) => c.spell === id))], [[], []]);
    check("clause IDs are numbered once each", clauses.length - new Set(clauses.map((c) => c.id)).size, 0);
    check("every clause carries one of the six marks", clauses.filter((c) => !MARKS.includes(c.mark)).map((c) => `${c.id} ${c.mark}`), []);
    // The point of clausifying: a paraphrase here, or pf2e rewording a spell, fails the build.
    check("every clause is a verbatim fragment of pf2e's own text",
        clauses.filter((c) => !(words[spells[c.spell]] ?? "").includes(c.clause)).map((c) => c.id), []);
    check("a spell with a ✅ clause has a table entry",
        [...new Set(clauses.filter((c) => c.mark === "✅").map((c) => spells[c.spell]))].filter((slug) => !fs.existsSync(path.join(ROOT, "content", "vanilla", `${slug}.json`))), []);
    const counted = Object.fromEntries(MARKS.map((mark) => [mark, clauses.filter((c) => c.mark === mark).length]));
    const table = Object.fromEntries(MARKS.map((mark) => [mark, Number(new RegExp(`^\\| ${mark}[^|]*\\| (\\d+) \\|`, "m").exec(text)?.[1])]));
    check("the third tracker's counts are its clauses counted", [table, Number(/\*\*Total\*\* \| \*\*(\d+)\*\*/.exec(text)?.[1])], [counted, clauses.length]);
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
/*  "An area or a target": the chosen shape rides on the card (VS-03)                            */
/* -------------------------------------------------------------------------------------------- */

{
    const { CastShape, shapeOptions } = await import("../scripts/targeting/cast-shape.mjs");
    const saved = globalThis.Hooks;
    let hook = null;
    globalThis.Hooks = { on: (name, fn) => { if (name === "preCreateChatMessage") hook = fn; }, once() {}, callAll() {} };
    CastShape.registerHooks();
    const card = (uuid) => { const m = { flags: { pf2e: { origin: { uuid } } }, updateSource(d) { for (const [k, v] of Object.entries(d)) foundry.utils.setProperty(m, k, v); } }; return m; };
    const savedFoundry = globalThis.foundry;
    globalThis.foundry = { ...(savedFoundry ?? {}), utils: { ...(savedFoundry?.utils ?? {}), setProperty: (o, k, v) => { const parts = k.split("."); let n = o; for (const p of parts.slice(0, -1)) n = n[p] ??= {}; n[parts.at(-1)] = v; } } };
    CastShape.expect({ uuid: "Actor.a.Item.grease" }, { type: "none" });
    const other = card("Actor.a.Item.fear");
    hook(other);
    check("another item's card is not stamped", shapeOptions(other), []);
    const greased = card("Actor.a.Item.grease");
    hook(greased);
    check("the chosen shape rides on its own card", shapeOptions(greased), ["rider:cast:shape:none"]);
    const later = card("Actor.a.Item.grease");
    hook(later);
    check("…once: the next card of the same spell is not", shapeOptions(later), []);
    CastShape.expect({ uuid: "Actor.a.Item.grease" }, { type: "square", value: 10 }, Date.now() - 61_000);
    const stale = card("Actor.a.Item.grease");
    hook(stale);
    check("a choice that waited over a minute is dropped", shapeOptions(stale), []);
    check("a save on its own message reads the shape the spell was last cast with", shapeOptions({ flags: {} }, { flags: { [LIB_ID]: { lastCastShape: { type: "square" } } } }), ["rider:cast:shape:square"]);
    check("…and the card's own stamp wins over it", shapeOptions({ flags: { [LIB_ID]: { castShape: { type: "none" } } } }, { flags: { [LIB_ID]: { lastCastShape: { type: "square" } } } }), ["rider:cast:shape:none"]);
    globalThis.Hooks = saved;
    globalThis.foundry = savedFoundry;
}

{
    // Lingering ground and overlap are this module's own after-aim steps — registered here, not only by a
    // homebrew — and a homebrew that already registered them keeps its own.
    const { registerAreaSteps } = await import("../scripts/main.mjs");
    const { Extensions } = await import("../scripts/targeting/extensions.mjs");
    const names = () => Extensions.registered().afterAim.map((s) => `${s.name}@${s.priority}`);
    registerAreaSteps();
    check("the library asks for lingering ground and overlap after aiming", ["lingering areas@20", "overlapping areas@30"].every((n) => names().includes(n)), true);
    let threw = false;
    try { registerAreaSteps(); } catch { threw = true; }
    check("…and steps aside for a step already registered under the same name", threw, false);
}

/* -------------------------------------------------------------------------------------------- */
/*  A spell that moves its caster (VS-05)                                                        */
/* -------------------------------------------------------------------------------------------- */

{
    const { occupants, needsSight } = await import("../scripts/targeting/move-caster.mjs");
    const self = { x: 0, y: 0, w: 100, h: 100, n: "self" };
    const other = { x: 300, y: 300, w: 100, h: 100, n: "other" };
    const large = { x: 500, y: 0, w: 200, h: 200, n: "large" };
    const names = (list) => list.map((t) => t.n);
    check("an empty square is unoccupied", names(occupants({ x: 100, y: 100, width: 100, height: 100 }, [self, other, large], self)), []);
    check("a square on another creature is occupied", names(occupants({ x: 300, y: 300, width: 100, height: 100 }, [self, other, large], self)), ["other"]);
    check("…including a Large creature's far corner", names(occupants({ x: 600, y: 100, width: 100, height: 100 }, [self, other, large], self)), ["large"]);
    check("the caster's own space never counts", names(occupants({ x: 0, y: 0, width: 100, height: 100 }, [self], self)), []);
    check("sight is needed below the waiving rank, not from it", [needsSight({ seeBelowRank: 5 }, 4), needsSight({ seeBelowRank: 5 }, 5), needsSight({}, 9)], [true, false, true]);
}

/* -------------------------------------------------------------------------------------------- */
/*  An area held while inside (VS-07)                                                            */
/* -------------------------------------------------------------------------------------------- */

{
    const { insideEffectSource, heldFrom } = await import("../scripts/targeting/inside.mjs");
    const ephemeral = { key: "EphemeralEffect", affects: "target", selectors: ["attack-roll"], uuid: "u" };
    const source = insideEffectSource({ name: "Mist", regionUuid: "Scene.s.Region.r", conditions: ["Compendium.pf2e.conditionitems.Item.c"], rules: [ephemeral] });
    check("a condition held inside is granted in memory, so it goes with the effect", source.system.rules[0], { key: "GrantItem", uuid: "Compendium.pf2e.conditionitems.Item.c", inMemoryOnly: true });
    check("…and the area's own rules follow it", source.system.rules[1], ephemeral);
    check("the effect lasts until it is taken off, and names its Region", [source.system.duration.unit, source.flags[LIB_ID].inside], ["unlimited", "Scene.s.Region.r"]);
    const actor = { itemTypes: { effect: [
        { id: "a", flags: { [LIB_ID]: { inside: "Scene.s.Region.r" } } },
        { id: "b", flags: { [LIB_ID]: { inside: "Scene.s.Region.other" } } },
        { id: "c", flags: {} },
    ] } };
    check("leaving one area takes off only what that area gave", heldFrom(actor, "Scene.s.Region.r").map((e) => e.id), ["a"]);
}

/* -------------------------------------------------------------------------------------------- */
/*  An Escape that removes everything the ability left (VS-10)                                   */
/* -------------------------------------------------------------------------------------------- */

{
    const { Escape } = await import("../scripts/riders/escape.mjs");
    const from = (id, source, type = "effect") => ({ id, type, flags: { [LIB_ID]: { rider: { source } } } });
    const deleted = [];
    const items = [from("penalty", "Spell.flora"), from("held", "Spell.flora"), from("other", "Spell.web"), { id: "own", type: "effect", flags: {} }];
    const actor = { items: Object.assign(items, { has: () => false, get: () => null }), deleteEmbeddedDocuments: async (_, ids) => deleted.push(...ids) };
    await Escape.release(actor, { id: "escape" }, { all: true, source: "Spell.flora", conditions: [] });
    check("an Escape from \"these effects\" takes off all that ability left, and nothing else", deleted, ["penalty", "held"]);
}

/* -------------------------------------------------------------------------------------------- */
/*  An effect that carries its own save, which shortens it (VS-18)                               */
/* -------------------------------------------------------------------------------------------- */

{
    const { carried, shortened } = await import("../scripts/riders/apply.mjs");
    const riders = carried([{ event: "turn-end", self: true, apply: { type: "save", statistic: "will", riders: [{ apply: { type: "shorten", rounds: 1 } }] } }], 34);
    check("a carried save takes the caster's DC with it", riders[0].apply.dc, 34);
    check("…and keeps a DC it already names", carried([{ apply: { type: "save", dc: 20 } }], 34)[0].apply.dc, 20);
    const { climbed, endsWithGone, growByStep, isHostileUse, castItemOf, decoyOdds, transferred } = await import("../scripts/riders/apply.mjs");
    const { isSpellEffect } = await import("../scripts/riders/apply.mjs");
    check("a spell's effect: from a spell, or pf2e's own Spell Effect", [isSpellEffect({ type: "effect", slug: "x" }, "spell"), isSpellEffect({ type: "effect", slug: "spell-effect-heroism" }), isSpellEffect({ type: "effect", slug: "effect-rage" }, "action"), isSpellEffect({ type: "condition", slug: "frightened" }, "spell")], [true, true, false, false]);
    const { deterVerdict, afterDeterSave, isAttack, turnKey } = await import("../scripts/riders/deters.mjs");
    check("a ward asks a new save each turn, and remembers this one", [deterVerdict(undefined, "c:1:0"), deterVerdict({ key: "c:1:0", allowed: true }, "c:1:0"), deterVerdict({ key: "c:1:0", allowed: false }, "c:1:0"), deterVerdict({ key: "c:1:0", allowed: true }, "c:1:1"), deterVerdict({ until: "spell" }, "c:2:0"), deterVerdict({ key: null, allowed: true }, null)], ["save", "allow", "refuse", "save", "refuse", "save"]);
    check("what a save against a ward earns", ["criticalSuccess", "success", "failure", "criticalFailure"].map((o) => afterDeterSave(o, "k")), [{ memo: null, allowed: true, ends: true }, { memo: { key: "k", allowed: true }, allowed: true, ends: false }, { memo: { key: "k", allowed: false }, allowed: false, ends: false }, { memo: { until: "spell" }, allowed: false, ends: false }]);
    check("an attack is an attack roll or the attack trait", [isAttack({ type: "attack-roll" }), isAttack({ type: "skill-check", traits: ["attack"] }), isAttack({ type: "saving-throw", traits: [] }), isAttack({ type: "attack-roll", isReroll: true })], [true, true, false, false]);
    check("a turn is a combat's round and turn", [turnKey({ started: true, id: "c", round: 2, turn: 1 }), turnKey({ started: false }), turnKey(null)], ["c:2:1", null, null]);
    const { tempHpFrom } = await import("../scripts/riders/apply.mjs");
    check("half the damage taken, rounded down", [tempHpFrom(21, 0.5), tempHpFrom(0, 0.5), tempHpFrom(7)], [10, 0, 7]);
    const { isSameItem } = await import("../scripts/riders/data.mjs");
    const owner = {}; const feast = { id: "vf", actor: owner }; const fist = { id: "fist", actor: owner };
    check("an own-item rider reads only its own item's blows", [isSameItem(feast, feast), isSameItem(feast, { id: "vf", actor: owner }), isSameItem(feast, fist), isSameItem(feast, { id: "x", original: feast, actor: owner })], [true, true, false, true]);
    const { healingWithheldBy } = await import("../scripts/lib/fast-healing.mjs");
    const linkEffect = { name: "spirit link", flags: { [LIB_ID]: { noTurnHealing: true } } };
    check("a link takes away the caster's fast healing", [healingWithheldBy({ items: [{ flags: {} }, linkEffect] })?.name, healingWithheldBy({ items: [{ flags: {} }] })], ["spirit link", null]);
    check("a link moves its amount, or only what the ally is missing", [transferred(6, 100, 200), transferred(6, 197, 200), transferred(6, 200, 200)], [6, 3, 0]);
    check("the images' odds are the spell's own table — 1 in 4, 1 in 3, 1 in 2", [decoyOdds(3), decoyOdds(2), decoyOdds(1), decoyOdds(0)], [{ dice: "1d4", you: 1 }, { dice: "1d6", you: 2 }, { dice: "1d6", you: 3 }, null]);
    const actor = {}, sheet = { id: "inv", actor, rank: 2 }, cast = { id: "inv", actor, rank: 4 }, other = { id: "bolt", actor, rank: 3 };
    check("a rider reads the spell as cast — the card's heightened copy — when the card names the same spell", [castItemOf({ item: sheet, messageItem: cast }).rank, castItemOf({ item: sheet, messageItem: other }).rank, castItemOf({ item: sheet }).rank, castItemOf({ messageItem: cast }).rank], [4, 2, 2, 4]);
    const me = { id: "me" }, foe = { isEnemyOf: () => true }, friend = { isEnemyOf: () => false };
    check("an attack, a damage roll, or an action aimed at an enemy is hostile; a heal for a friend, or a Stride, is not", [
        isHostileUse({ type: "attack-roll", actor: me }), isHostileUse({ type: "damage-roll", actor: me }),
        isHostileUse({ type: null, fromItem: true, targets: [foe], actor: me }), isHostileUse({ type: null, fromItem: true, targets: [friend], actor: me }),
        isHostileUse({ type: null, fromItem: false, targets: [foe], actor: me }),
    ], [true, true, true, false, false]);
    check("dice and a flat part both grow by the step", [growByStep("1d10+4", "1d10+4", 2), growByStep("1d10+4", "1d10+4", 0), growByStep("2d6", "1d6", 3), growByStep("1d8+1", "1d6+1", 2)], ["3d10+12", "1d10+4", "5d6", "1d8+1"]);
    const { durationSeconds, FOR_GOOD } = await import("../scripts/riders/banish.mjs");
    check("a banishment for good is a finite forever, which survives the JSON register", [durationSeconds({ unit: "unlimited" }), JSON.parse(JSON.stringify({ at: durationSeconds({ unit: "unlimited" }) })).at, durationSeconds({ value: 1, unit: "minutes" })], [FOR_GOOD, FOR_GOOD, 60]);
    check("persistent damage that ends with sickened ends when sickened goes, not with anything else", [endsWithGone(["sickened"], "sickened"), endsWithGone(["sickened"], "frightened"), endsWithGone(undefined, "sickened")], [true, false, false]);
    check("a climbing condition moves by its step, never past its top or below nothing", [climbed(1, 1, 3), climbed(2, 2, 3), climbed(1, -1, 3), climbed(0, -1, 3)], [2, 3, 0, 0]);
    check("a success takes a round off; the last round, or a critical success, ends it", [shortened({ value: 4 }, 1), shortened({ value: 1 }, 1), shortened({ value: 4 }, "all")], [3, null, null]);
}

/* -------------------------------------------------------------------------------------------- */
/*  Until the target's next turn begins (VS-17)                                                  */
/* -------------------------------------------------------------------------------------------- */

{
    const { forTargetsTurn } = await import("../scripts/riders/apply.mjs");
    const { combatOf } = await import("../scripts/lib/combat.mjs");
    const leo = { id: "leo" };
    const old = { id: "old", started: true, active: false, combatants: [{ actorId: "leo" }] };
    const fight = { id: "fight", started: true, active: true, combatants: [{ actorId: "leo" }] };
    check("a creature's encounter is the active one it is in, not the first or the viewed", [combatOf(leo, [old, fight], old)?.id, combatOf(leo, [old], null)?.id, combatOf(leo, [{ ...fight, started: false }], null)], ["fight", "old", null]);
    const combat = { started: true, turn: 1, turns: [{ id: "a" }, { id: "caster" }, { id: "b" }] };
    check("a target yet to act this round loses it at this round's turn", forTargetsTurn({ value: 1 }, combat, { id: "b", initiative: 5 }), { value: 0, initiative: 5 });
    check("…one that has acted, at next round's", forTargetsTurn({ value: 1 }, combat, { id: "a", initiative: 20 }), { value: 1, initiative: 20 });
    check("…and out of combat it is a round", forTargetsTurn({ value: 1 }, null, null), { value: 1, initiative: null });
}

/* -------------------------------------------------------------------------------------------- */
/*  Sustaining a spell that grows (VS-13)                                                        */
/* -------------------------------------------------------------------------------------------- */

{
    const { canSustain, sustainActionSource, roundFor } = await import("../scripts/riders/sustain.mjs");
    const caster = { id: "aries" };
    const other = { started: true, round: 27, combatants: [{ actorId: "ghoul" }] };
    const own = { started: true, round: 2, combatants: [{ actorId: "aries" }] };
    check("a Sustain is judged by the caster's own encounter, not whichever the GM is viewing", [roundFor(caster, [other, own]), roundFor(caster, [other]), roundFor(caster, [{ ...own, started: false }])], [2, null, null]);
    check("Sustained once per round, not in the round it was cast", [
        canSustain({ castRound: 3, lastRound: null }, 3),
        canSustain({ castRound: 3, lastRound: null }, 4),
        canSustain({ castRound: 3, lastRound: 4 }, 4),
        canSustain({ castRound: 3, lastRound: 4 }, 5),
    ], [false, true, false, true]);
    const { lapses } = await import("../scripts/riders/sustain.mjs");
    check("a sustained spell ends at a turn's end it was not Sustained in — never in its casting round or out of combat", [
        lapses({ castRound: 2, lastRound: null }, 2), lapses({ castRound: 2, lastRound: null }, 3), lapses({ castRound: 2, lastRound: 3 }, 3), lapses({ castRound: 2, lastRound: 3 }, 4), lapses({ castRound: null, lastRound: null }, null),
    ], [false, true, false, true, false]);
    check("…and freely out of combat, or when cast out of it", [canSustain({ castRound: 3, lastRound: 3 }, null), canSustain({ castRound: null, lastRound: null }, 1)], [true, true]);
    const action = sustainActionSource({ item: { name: "Bless" }, effectId: "e1", step: 1, castRound: 2 });
    check("the granted action is one concentrate action that fires its own rider", [action.system.actions.value, action.system.traits.value, action.flags[LIB_ID].riders[0].apply.type, action.flags[LIB_ID].sustain.effectId], [1, ["concentrate"], "sustain", "e1"]);
}

/* -------------------------------------------------------------------------------------------- */
/*  Fast healing and regeneration, applied (VS-36)                                               */
/* -------------------------------------------------------------------------------------------- */

{
    const { receivedLines, isTurnHealing, deactivates } = await import("../scripts/lib/fast-healing.mjs");
    check("acid or fire switches Regenerate's regeneration off; cold does not", [deactivates(["fire"], [{ deactivatedBy: ["acid", "fire"] }]), deactivates(["cold"], [{ deactivatedBy: ["acid", "fire"] }]), deactivates(["fire"], [{}])], [true, false, false]);
    const en = { "PF2E.Encounter.Broadcast.FastHealing.fast-healing.ReceivedMessage": "Received fast healing", "PF2E.Encounter.Broadcast.FastHealing.regeneration.ReceivedMessage": "Received regeneration" };
    const lines = receivedLines((k) => en[k] ?? k);
    check("pf2e's turn-start healing is known by its own words, in the current language", [isTurnHealing("<div>Received regeneration</div><div>Deactivated by acid or fire</div>", lines), isTurnHealing("Received fast healing", lines), isTurnHealing("Fortitude Saving Throw", lines), receivedLines((k) => k).length], [true, true, false, 0]);
}

/* -------------------------------------------------------------------------------------------- */
/*  A shield that ends when it blocks (VS-35)                                                    */
/* -------------------------------------------------------------------------------------------- */

{
    const { blockingEffect } = await import("../scripts/riders/shield-block.mjs");
    const spellShield = { id: "sh", flags: { [LIB_ID]: { endsOnBlock: { immunity: "x" } } } };
    const actor = { attributes: { shield: { itemId: "sh" } }, items: { get: (id) => (id === "sh" ? spellShield : null) } };
    check("a block with the spell's shield ends the spell; damage without a block, or another shield, does not", [blockingEffect(actor, { shieldBlockRequest: true }), blockingEffect(actor, {}), blockingEffect({ attributes: { shield: { itemId: "wood" } }, items: { get: () => ({ flags: {} }) } }, { shieldBlockRequest: true })], [spellShield, null, null]);
}

/* -------------------------------------------------------------------------------------------- */
/*  A push that walls stop (VS-12)                                                               */
/* -------------------------------------------------------------------------------------------- */

{
    const { stopShortOfWalls, compassVector, preselected } = await import("../scripts/riders/apply.mjs");
    const omen = [{ key: "ChoiceSet", flag: "illOmen", choices: [] }, { key: "RollTwice", keep: "lower" }];
    check("a ChoiceSet answered from the choice made as the spell was cast", preselected([{ key: "ChoiceSet", flag: "damageType" }], { damageType: "$cast" }, "failure", { damageType: "fire" })[0].selection, "fire");
    const { withCast, choiceValue } = await import("../scripts/riders/apply.mjs");
    const enlarge = { key: "ChoiceSet", choices: [{ value: { damage: 4, reach: 15, size: "huge" } }, { value: { damage: 2, reach: 10, size: "large" } }] };
    check("an answer names an object-valued choice by one of its values; a plain one is itself", [choiceValue(enlarge, "large"), choiceValue({ choices: [{ value: "fire" }] }, "fire"), choiceValue(enlarge, "tiny")], [{ damage: 2, reach: 10, size: "large" }, "fire", "tiny"]);
    check("riders an effect carries are bound to the cast: its choice, and a level that grows by rank",
        withCast([{ predicate: ["rider:damage:type:$cast:damageType"], apply: { type: "death", maxLevel: 7, maxLevelPerStep: 4 } }], { damageType: "cold" }, 1),
        [{ predicate: ["rider:damage:type:cold"], apply: { type: "death", maxLevel: 11 } }]);
    check("…and a formula that grows by its perStep — Fire Shield's 2d6, 3d6 at rank 6", withCast([{ apply: { type: "damage", formula: "2d6", perStep: "1d6" } }], {}, 1), [{ apply: { type: "damage", formula: "3d6" } }]);
    check("a weapon ChoiceSet answered with the one held weapon — and left to pf2e without one", [preselected([{ key: "ChoiceSet", flag: "weapon" }], { weapon: "$held" }, null, {}, { held: "abc" })[0].selection, preselected([{ key: "ChoiceSet", flag: "weapon" }], { weapon: "$held" }, null, {})[0].selection], ["abc", undefined]);
    check("…or one named only by its roll option", preselected([{ key: "ChoiceSet", rollOption: "tangle-vine" }], { "tangle-vine": "$outcome" }, "success")[0].selection, "success");
    check("a pf2e ChoiceSet is answered from the save, leaving other rules alone", [preselected(omen, { illOmen: "$outcome" }, "criticalFailure")[0].selection, preselected(omen, { illOmen: "$outcome" }, "criticalFailure")[1], preselected(omen, { other: "x" }, "failure")[0].selection], ["critical-failure", omen[1], undefined]);
    check("a chosen compass point is a direction on the grid, y downwards", [compassVector("n"), compassVector("se"), compassVector("up")], [{ x: 0, y: -1 }, { x: 1, y: 1 }, null]);
    const size = { w: 100, h: 100 };
    const wallAtX = (x) => (from, to) => (to.x > x && from.x < x ? { x, y: from.y } : null);
    check("a push with nothing in the way goes the whole distance", stopShortOfWalls({ x: 0, y: 0 }, { x: 600, y: 0 }, size, 100, () => null), { x: 600, y: 0 });
    check("…and stops half a square short of the first wall, measured from the token's centre", stopShortOfWalls({ x: 0, y: 0 }, { x: 600, y: 0 }, size, 100, wallAtX(400)), { x: 300, y: 0 });
    check("…which may be no distance at all", stopShortOfWalls({ x: 0, y: 0 }, { x: 600, y: 0 }, size, 100, wallAtX(90)), { x: 0, y: 0 });
}

/* -------------------------------------------------------------------------------------------- */
/*  A check the creature chooses (VS-09)                                                         */
/* -------------------------------------------------------------------------------------------- */

{
    const { bestStatistic } = await import("../scripts/riders/apply.mjs");
    const climber = { getStatistic: (slug) => ({ athletics: { mod: 18 }, reflex: { mod: 12 } })[slug] };
    const dancer = { getStatistic: (slug) => ({ athletics: { mod: 4 }, reflex: { mod: 15 } })[slug] };
    check("a creature that may choose rolls its better statistic", [bestStatistic(climber, ["athletics", "reflex"]), bestStatistic(dancer, ["athletics", "reflex"])], ["athletics", "reflex"]);
    check("…and one it lacks falls to the first named", bestStatistic({}, ["athletics", "reflex"]), "athletics");
}

/* -------------------------------------------------------------------------------------------- */
/*  Darkness that outshines light up to its rank (VS-08)                                         */
/* -------------------------------------------------------------------------------------------- */

{
    const { darknessSource, firstForMovement, followed } = await import("../scripts/targeting/lingering.mjs");
    const emanation = { type: "emanation", radius: 200, base: { type: "token", x: 3700, y: 1500, width: 1, height: 1 } };
    check("an emanation follows its caster by its base square", followed(emanation, { x: 3550, y: 1550 }, { x: 3500, y: 1500 }).base, { ...emanation.base, x: 3500, y: 1500 });
    const { sweptPath, overlaps, alreadyBurned, drifted, reachOf } = await import("../scripts/targeting/lingering.mjs");
    check("a vine reaches 15 ft beyond the creepers' edge", [reachOf({ x: 900, y: 0, width: 1, height: 1 }, { x: 0, y: 50, radius: 600 }, 100), reachOf({ x: 300, y: 0, width: 1, height: 1 }, { x: 0, y: 50, radius: 600 }, 100)], [300, 0]);
    const { tooClose } = await import("../scripts/targeting/index.mjs");
    const { withinOfAny } = await import("../scripts/targeting/zones.mjs");
    const { pullSteps, pullFeet } = await import("../scripts/riders/pull.mjs");
    const { snappedRun, borderSections, squareSections, crossesInterior, sectionHp, crossesAny } = await import("../scripts/targeting/barrier.mjs");
    check("an attack across a wall of squares crosses it; one beside it doesn't", [crossesAny({ x: 150, y: 50 }, { x: 150, y: 350 }, [{ x: 100, y: 100 }, { x: 200, y: 100 }], 100), crossesAny({ x: 50, y: 50 }, { x: 50, y: 350 }, [{ x: 100, y: 100 }, { x: 200, y: 100 }], 100)], [true, false]);
    const run = snappedRun({ x: 1010, y: 990 }, 2, 30, 100, 5, 90);
    check("a run of borders starts on a grid point and goes along a grid line", [run.a, run.b, run.steps], [{ x: 1000, y: 1000 }, { x: 1600, y: 1000 }, 6]);
    check("…cut into 10-ft sections", borderSections(run, 2, 100).map((s) => [s.a.x, s.b.x]), [[1000, 1200], [1200, 1400], [1400, 1600]]);
    const diag = snappedRun({ x: 1000, y: 1000 }, 44, 20, 100, 5, 45);
    check("a run of squares may go diagonally, a square a step", squareSections(diag, 2, 100), [[{ x: 1000, y: 1000 }, { x: 1100, y: 1100 }], [{ x: 1200, y: 1200 }, { x: 1300, y: 1300 }]]);
    check("a wall along a creature's edge doesn't pass through it; one across its middle does", [crossesInterior({ a: { x: 0, y: 100 }, b: { x: 300, y: 100 } }, { x: 100, y: 100, w: 100, h: 100 }), crossesInterior({ a: { x: 0, y: 200 }, b: { x: 300, y: 200 } }, { x: 100, y: 100, w: 200, h: 200 })], [false, true]);
    check("a section's Hit Points grow every two ranks", [sectionHp({ hp: 50, hpPerStep: 15, hpPerStepInterval: 2 }, 0), sectionHp({ hp: 50, hpPerStep: 15, hpPerStepInterval: 2 }, 1), sectionHp({ hp: 50, hpPerStep: 15, hpPerStepInterval: 2 }, 2)], [50, 50, 65]);
    const { movesCloser, barsApproach, centreAt } = await import("../scripts/targeting/repels.mjs");
    check("closing in is a move that ends nearer the caster; sideways and away are not", [movesCloser({ x: 500, y: 0 }, { x: 400, y: 0 }, { x: 0, y: 0 }), movesCloser({ x: 500, y: 0 }, { x: 500, y: 100 }, { x: 0, y: 0 }), movesCloser({ x: 400, y: 0 }, { x: 500, y: 0 }, { x: 0, y: 0 })], [true, false, false]);
    check("a failure or worse bars it; a success or better does not", ["criticalFailure", "failure", "success", "criticalSuccess", undefined].map(barsApproach), [true, true, false, false, false]);
    check("a token's centre at a position", centreAt({ x: 100, y: 200 }, { width: 2, height: 1 }, 100), { x: 200, y: 250 });
    const one = { w: 100, h: 100 };
    check("a pull walks square by square at the centre and never past it", [pullSteps({ x: 0, y: 0 }, one, { x: 550, y: 50 }, 3, 100), pullSteps({ x: 0, y: 0 }, one, { x: 250, y: 50 }, 6, 100), pullSteps({ x: 0, y: 0 }, one, { x: 350, y: 350 }, 6, 100)],
        [[{ x: 100, y: 0 }, { x: 200, y: 0 }, { x: 300, y: 0 }], [{ x: 100, y: 0 }, { x: 200, y: 0 }], [{ x: 100, y: 100 }, { x: 200, y: 200 }, { x: 300, y: 300 }]]);
    check("how far each degree pulls", ["criticalSuccess", "success", "failure", "criticalFailure"].map((o) => pullFeet({ success: 5, failure: 15, criticalFailure: 30 }, o)), [0, 5, 15, 30]);
    const tok = (id, x, y) => ({ id, center: { x, y } });
    check("the centre zone: creatures within 10 ft of any star's centre", withinOfAny([tok("a", 100, 0), tok("b", 250, 0), tok("c", 1000, 1050)], [{ x: 0, y: 0 }, { x: 1000, y: 1000 }], 10, 100, 5), ["a", "c"]);
    const { areaParts, typedTotals, keptInstances, worseDegree } = await import("../scripts/riders/apply.mjs");
    const { bakeCast } = await import("../scripts/riders/origin-action.mjs");
    const { conditionsAt } = await import("../scripts/riders/apply.mjs");
    const { counteractKinds, isAffliction } = await import("../scripts/riders/cleanse.mjs");
    const { fallTo, elevationAfter } = await import("../scripts/riders/fall.mjs");
    check("Levitate: 5 feet up, then 10 up or down a Sustain, never below the ground", [elevationAfter(0, { set: 5 }), elevationAfter(5, { by: 10 }), elevationAfter(5, { by: -10 })], [5, 15, 0]);
    check("a safe fall of up to 120 feet stops at the ground", [fallTo(60, 120), fallTo(200, 120), fallTo(0, 120)], [0, 80, 0]);
    check("Cleanse Affliction counteracts nothing at 2, a disease or poison at 3, a curse too at 4", [counteractKinds(2), counteractKinds(3), counteractKinds(4)], [[], ["disease", "poison"], ["disease", "poison", "curse"]]);
    check("an affliction is this module's, or an effect with the curse, disease or poison trait", [isAffliction({ type: "effect", flags: { [LIB_ID]: { affliction: {} } }, system: { traits: { value: [] } } }), isAffliction({ type: "effect", flags: {}, system: { traits: { value: ["curse"] } } }), isAffliction({ type: "effect", flags: {}, system: { traits: { value: ["fire"] } } })], [true, true, false]);
    const { resumedStart } = await import("../scripts/riders/set-aside.mjs");
    check("an effect set aside for 12 seconds comes back with its start 12 seconds later — its clock stopped", resumedStart(100, 200, 212), 112);
    const sound = { conditions: ["blinded", "sickened"], conditionsAtRank: { 4: ["drained", "slowed"], 6: ["petrified"], 8: ["stunned"] } };
    check("Sound Body's list grows by rank, each heightening as the 4th plus its own", [conditionsAt(sound, 2), conditionsAt(sound, 4), conditionsAt(sound, 6), conditionsAt(sound, 8)],
        [["blinded", "sickened"], ["blinded", "sickened", "drained", "slowed"], ["blinded", "sickened", "drained", "slowed", "petrified"], ["blinded", "sickened", "drained", "slowed", "petrified", "stunned"]]);
    const { nextStage } = await import("../scripts/riders/affliction.mjs");
    const { tallyState } = await import("../scripts/riders/aftermath.mjs");
    const { wouldDie, leavesNothing } = await import("../scripts/riders/sources.mjs");
    const pc = (dying) => ({ type: "character", attributes: { dying: { max: 4 } }, getCondition: () => (dying ? { value: dying } : null) });
    const npc = (hp) => ({ type: "npc", hitPoints: { value: hp } });
    check("a creature would die: a character at its dying maximum, anything else brought to 0", [wouldDie(pc(4), 0), wouldDie(pc(3), 0), wouldDie(npc(0), 12), wouldDie(npc(0), 0), wouldDie(npc(5), 12)], [true, false, true, false, false]);
    check("a death effect, or Disintegrate, leaves nothing to save", [leavesNothing({ system: { traits: { value: ["death"] } } }), leavesNothing({ slug: "disintegrate", system: { traits: { value: [] } } }), leavesNothing({ slug: "fireball", system: { traits: { value: ["fire"] } } })], [true, true, false]);
    check("a cast's tally is read once nobody is left to answer, and knows whether anybody died",
        [tallyState({ awaiting: new Set(["a"]), died: new Set() }), tallyState({ awaiting: new Set(), died: new Set() }), tallyState({ awaiting: new Set(), died: new Set(["b"]) })],
        [{ done: false, died: false }, { done: true, died: false }, { done: true, died: true }]);
    check("a save moves an affliction's stage: two down, one down, one up, two up, cured below 1, capped at the last",
        [nextStage(2, "criticalSuccess", 2), nextStage(2, "success", 2), nextStage(1, "failure", 2), nextStage(1, "criticalFailure", 3), nextStage(2, "criticalFailure", 2)],
        [0, 1, 2, 3, 2]);
    check("an action granted from a cast keeps the cast's rank and DC",
        bakeCast([{ apply: { type: "area-damage", parts: [{ formula: "7d6", perStep: "1d6", type: "acid" }] } }], { steps: 2, dc: 31 }),
        [{ apply: { type: "area-damage", parts: [{ formula: "9d6", type: "acid" }], dc: 31 } }]);
    check("a critical hit worsens the save one degree, never past a critical failure", ["criticalSuccess", "success", "failure", "criticalFailure"].map(worseDegree), ["success", "failure", "criticalFailure", "criticalFailure"]);
    check("a miss keeps only the damage types it still deals",
        [keptInstances([{ type: "slashing", _formula: "1d4[slashing]" }, { type: "electricity", _formula: "1d4[electricity]" }], ["electricity"]), keptInstances([{ type: "slashing", _formula: "1d4[slashing]" }], ["electricity"])],
        ["{1d4[electricity]}", null]);
    const { dieAsHeld, heldWeapons, weaponDamageTypes } = await import("../scripts/riders/weapon.mjs");
    const { actionChoices } = await import("../scripts/vanilla/requires.mjs");
    check("a ray per action: never fewer actions than creatures targeted, never more than three",
        [actionChoices(["1", "2", "3"], 0, true), actionChoices(["1", "2", "3"], 2, true), actionChoices(["1", "2", "3"], 4, true), actionChoices(["3", "1"], 2, false)],
        [[1, 2, 3], [2, 3], [], [1, 3]]);
    check("a versatile weapon deals its own type or the one its trait adds", [weaponDamageTypes({ system: { damage: { damageType: "slashing" }, traits: { value: ["versatile-p"] } } }), weaponDamageTypes({ system: { damage: { damageType: "bludgeoning" }, traits: { value: [] } } })], [["slashing", "piercing"], ["bludgeoning"]]);
    const sword = { system: { damage: { die: "d8" }, traits: { value: ["two-hand-d12"] }, equipped: { carryType: "held", handsHeld: 1 } } };
    check("a two-hand weapon uses its two-hand die only when held in both hands", [dieAsHeld(sword), dieAsHeld({ ...sword, system: { ...sword.system, equipped: { carryType: "held", handsHeld: 2 } } })], ["d8", "d12"]);
    check("only weapons in hand are held", heldWeapons({ itemTypes: { weapon: [sword, { system: { equipped: { carryType: "worn", handsHeld: 0 } } }] } }).length, 1);
    const parts = [{ total: 30, type: "bludgeoning", zone: "centre" }, { total: 48, type: "fire", zone: null }];
    check("a part with a zone reaches only that zone; a part without reaches everyone", [areaParts(parts, { centre: ["a"] }, "a").length, areaParts(parts, { centre: ["a"] }, "b").map((p) => p.type), areaParts(parts, undefined, "a").map((p) => p.type)], [2, ["fire"], ["fire"]]);
    check("several typed totals are one roll of several instances", [typedTotals(parts), typedTotals([parts[1]])], ["{30[bludgeoning],48[fire]}", "48[fire]"]);
    check("areas kept apart: two 20-ft clouds 40 ft apart pass, 35 ft apart don't", [tooClose([{ x: 0, y: 0 }, { x: 800, y: 0 }], 40, 100, 5), tooClose([{ x: 0, y: 0 }, { x: 700, y: 0 }], 40, 100, 5), tooClose([{ x: 0, y: 0 }], 40, 100, 5)], [false, true, false]);
    const { lapses: lapsesTurn } = await import("../scripts/riders/sustain.mjs");
    check("a sustained area lapses on a later turn left unsustained, not in its casting round", [lapsesTurn({ castRound: 1, lastRound: null }, 1), lapsesTurn({ castRound: 1, lastRound: null }, 2), lapsesTurn({ castRound: 1, lastRound: 2 }, 2)], [false, true, false]);
    check("a drifting cloud moves its step away from its caster, onto a grid intersection", [drifted({ x: 1000, y: 500 }, { x: 500, y: 500 }, 200, 100), drifted({ x: 1000, y: 1000 }, { x: 500, y: 500 }, 200, 100), drifted({ x: 500, y: 500 }, { x: 500, y: 500 }, 200, 100)],
        [{ x: 1200, y: 500 }, { x: 1100, y: 1100 }, { x: 500, y: 500 }]);
    check("a flight visits every square on its way, both ends included", [sweptPath({ x: 0, y: 0 }, { x: 200, y: 0 }, 100), sweptPath({ x: 0, y: 0 }, { x: 100, y: 100 }, 100), sweptPath({ x: 5, y: 5 }, { x: 5, y: 5 }, 100)],
        [[{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }], [{ x: 0, y: 0 }, { x: 100, y: 100 }], [{ x: 5, y: 5 }]]);
    check("a creature shares the flame's space when their squares overlap, not when they touch", [overlaps({ x: 100, y: 0, w: 100, h: 100 }, { x: 100, y: 0 }, 100), overlaps({ x: 200, y: 0, w: 100, h: 100 }, { x: 100, y: 0 }, 100), overlaps({ x: 0, y: 0, w: 200, h: 200 }, { x: 100, y: 100 }, 100)], [true, false, true]);
    check("once per round: burned this round is skipped; out of combat nobody is", [alreadyBurned({ a: 3 }, "a", 3), alreadyBurned({ a: 2 }, "a", 3), alreadyBurned({ a: 3 }, "a", null)], [true, false, false]);
    check("…a circle by its centre, and anything else stays put", [followed({ type: "circle", x: 0, y: 0, radius: 50 }, { x: 10, y: 20 }, { x: 0, y: 0 }), followed({ type: "rectangle", x: 0, y: 0, width: 1 }, { x: 10, y: 20 }, { x: 0, y: 0 })], [{ type: "circle", x: 10, y: 20, radius: 50 }, { type: "rectangle", x: 0, y: 0, width: 1 }]);
    const moved = (id, chain = []) => ({ data: { token: { id: "t" }, movement: { id, chain } } });
    check("one move action is one check, however many events it makes", [firstForMovement("R", moved("m1"), 0), firstForMovement("R", moved("m1"), 1), firstForMovement("R", moved("m2", ["m1"]), 2)], [true, false, false]);
    check("…a new move, another area, or a turn starting each count again", [firstForMovement("R", moved("m3"), 3), firstForMovement("R2", moved("m1"), 4), firstForMovement("R", { data: { token: { id: "t" } } }, 5)], [true, true, true]);
    check("…and a move is forgotten after a minute", firstForMovement("R", moved("m1"), 120_000), true);
    const burst = darknessSource({ x: 3000, y: 1600, width: 800, height: 800 }, 2, 100, 5);
    check("a 20-ft burst of darkness is a 20-ft darkness source at its centre", [burst.x, burst.y, burst.config.negative, burst.config.bright, burst.config.dim], [3400, 2000, true, 20, 20]);
    check("its priority is the cast rank, so light of that rank or lower is put out", [burst.config.priority, darknessSource({ x: 0, y: 0, width: 100, height: 100 }, 5, 100, 5).config.priority], [2, 5]);
    check("a darkness with no rank still puts out ordinary light", darknessSource({ x: 0, y: 0, width: 100, height: 100 }, undefined, 100, 5).config.priority, 0);
}

/* -------------------------------------------------------------------------------------------- */
/*  Targets that form a chain (VS-04)                                                            */
/* -------------------------------------------------------------------------------------------- */

{
    const { chainOrder } = await import("../scripts/targeting/chain.mjs");
    const at = (name, x) => ({ name, x });
    const d = (a, b) => Math.abs(a.x - b.x);
    const names = (order) => order?.map((p) => p.name) ?? null;
    check("picked out of order, the chain is found", names(chainOrder([at("c", 60), at("a", 0), at("b", 30)], d, 30)), ["c", "b", "a"]);
    check("a gap wider than the link breaks it", chainOrder([at("a", 0), at("b", 30), at("c", 65)], d, 30), null);
    check("it starts where the caster can reach", names(chainOrder([at("a", 0), at("b", 30), at("c", 60)], d, 30, (p) => p.x >= 60)), ["c", "b", "a"]);
    check("…and a chain whose only start is out of reach is no chain", chainOrder([at("a", 0), at("b", 30), at("c", 60)], d, 30, (p) => p.x === 30), null);
    check("one target is a chain of one, if it can be reached", [names(chainOrder([at("a", 0)], d, 30)), chainOrder([at("a", 0)], d, 30, () => false)], [["a"], null]);
    check("a branch the path cannot walk is no chain", chainOrder([at("hub", 0), at("l", -30), at("r", 30), at("far", -65)], d, 30), null);
}

/* -------------------------------------------------------------------------------------------- */
/*  A line or cone from the caster (VS-01)                                                       */
/* -------------------------------------------------------------------------------------------- */

{
    const { fromCaster, pinnedToCaster } = await import("../scripts/targeting/place.mjs");
    const token = { center: { x: 1000, y: 1000 }, w: 100, h: 100 };
    const round = (p) => ({ x: Math.round(p.x), y: Math.round(p.y), rotation: Math.round(p.rotation) });
    check("aimed east, it starts on the east edge of the caster's square", round(fromCaster(token, { x: 2000, y: 1000 })), { x: 1050, y: 1000, rotation: 0 });
    check("aimed north, the north edge", round(fromCaster(token, { x: 1000, y: 0 })), { x: 1000, y: 950, rotation: 270 });
    check("aimed on the diagonal, the corner", round(fromCaster(token, { x: 2000, y: 2000 })), { x: 1050, y: 1050, rotation: 45 });
    const large = { center: { x: 1000, y: 1000 }, w: 200, h: 200 };
    check("a Large caster's edge is a square further out", round(fromCaster(large, { x: 0, y: 1000 })), { x: 900, y: 1000, rotation: 180 });
    check("a snapped direction is honoured: due west, from the west edge", round(fromCaster(token, { x: 0, y: 1040 }, 180)), { x: 950, y: 1000, rotation: 180 });
    check("only lines and cones are pinned to the caster", ["line", "cone", "burst", "emanation"].map((type) => pinnedToCaster({ anchor: "caster", area: { type } })), [true, true, false, false]);
    check("…and only when the anchor says so", pinnedToCaster({ anchor: "free", area: { type: "line" } }), false);
}

/* -------------------------------------------------------------------------------------------- */
/*  What the pilot needed from the engine                                                        */
/* -------------------------------------------------------------------------------------------- */

{
    const { applyHeightening } = await import("../scripts/targeting/heightening.mjs");
    const fearAt = (castRank) => applyHeightening({ maxTargets: 1 }, { atRank: { 3: { maxTargets: 4 } } }, { baseRank: 1, castRank }).maxTargets;
    check("Heightened (3rd): Fear targets one creature, then five from rank 3 on", [fearAt(1), fearAt(2), fearAt(3), fearAt(9)], [1, 1, 5, 5]);
    const barrage = (castRank) => applyHeightening({ maxTargets: 3 }, { interval: 2, maxTargets: 3 }, { baseRank: 1, castRank }).maxTargets;
    check("Heightened (+2): Force Barrage's shards grow every other rank", [barrage(1), barrage(2), barrage(3), barrage(5)], [3, 3, 6, 9]);

    const { scaledDamage } = await import("../scripts/targeting/lingering.mjs");
    const storm = { formula: "2", type: "cold", perStep: "1" };
    check("Ice Storm's flat tick grows by a flat 1 per step", [0, 1, 3].map((steps) => scaledDamage(storm, steps).formula), ["2", "3", "5"]);
    check("…and dice still grow as dice", scaledDamage({ formula: "1d6", perStep: "1d6" }, 2).formula, "3d6");

    const wizard = { classDC: { slug: "wizard", dc: { value: 20 } }, spellcasting: [{ statistic: { dc: { value: 24 } } }] };
    const fearSpell = { type: "spell", spellcasting: { statistic: { dc: { value: 23 } } } };
    check("a save with no DC on a spell is against that spell's own DC", RiderExtensions.resolveDC(undefined, { originActor: wizard, item: fearSpell }), 23);
    check("…and on anything else, the class DC as before", RiderExtensions.resolveDC(undefined, { originActor: wizard, item: { type: "feat" } }), 20);
}

{
    // A receipt is what the engine itself created (#6): every place a rider pass creates an item on a
    // creature has to say so, or a reroll will not take it back — and diffing the sheet instead takes back
    // other modules' items too. `inflictPersistent` and `Escape.grant` return what they made; their
    // callers record it.
    const unrecorded = [];
    for (const file of ["apply.mjs", "encasement.mjs"]) {
        const lines = fs.readFileSync(path.join(SCRIPTS, "riders", file), "utf8").split(/\r?\n/);
        lines.forEach((line, i) => {
            // `createEmbeddedDocuments(` with any type on the same line or the next — a call wrapped over lines
            // put "Item" one line down and slipped past a narrower pattern.
            const call = /createEmbeddedDocuments\(/.test(line) && /"Item"/.test(`${line}${lines[i + 1] ?? ""}`);
            if (!call && !/\.increaseCondition\(/.test(line)) return;
            const near = lines.slice(Math.max(0, i - 2), i + 5).join("\n");
            if (!/record\(|context\.created|return created|async function increaseRecorded/.test(near)) unrecorded.push(`${file}:${i + 1}`);
        });
    }
    check("every item a rider pass creates is recorded on its receipt", unrecorded, []);
}

{
    // pf2e's own reroll deletes the save's message and posts another; the first roll's receipt crosses over (#8).
    const { RerollCarry, signatureOf } = await import("../scripts/riders/reroll-carry.mjs");
    const save = (extra = {}, receipts = undefined) => ({
        speaker: { token: "tok1", actor: "act1" },
        flags: {
            pf2e: { context: { type: "saving-throw", origin: { actor: "Actor.caster", item: "Item.fear" }, dc: { value: 34 }, domains: ["will"], outcome: "failure", ...extra } },
            ...(receipts ? { [LIB_ID]: { ridersApplied: receipts } } : {}),
        },
    });
    const receipt = { outcome: "failure", itemIds: ["frightened2"] };
    RerollCarry.clear();
    RerollCarry.keep(save({}, { "save-rolled:a:b:c": receipt }), 1000);

    check("a reroll is the same save: everything pf2e copies but the result", signatureOf(save({ isReroll: true, outcome: "success", options: ["check:reroll"] })), signatureOf(save()));
    check("a fresh save of the same kind takes nothing — only a reroll inherits", RerollCarry.take(save({ outcome: "success" }), "save-rolled:a:b:c", 2000), null);
    check("a save against another DC takes nothing", RerollCarry.take(save({ isReroll: true, dc: { value: 30 } }), "save-rolled:a:b:c", 2000), null);
    check("the reroll takes its first roll's receipt", RerollCarry.take(save({ isReroll: true, outcome: "success" }), "save-rolled:a:b:c", 2000), receipt);
    check("…once: the same receipt cannot be undone twice", RerollCarry.take(save({ isReroll: true }), "save-rolled:a:b:c", 3000), null);
    RerollCarry.keep(save({}, { "save-rolled:a:b:c": receipt }), 10_000);
    check("a receipt waits a minute and no longer", RerollCarry.take(save({ isReroll: true }), "save-rolled:a:b:c", 10_000 + 61_000), null);
    RerollCarry.keep(save({ type: "attack-roll" }, { k: receipt }), 0);
    check("only saves are kept", RerollCarry.take(save({ isReroll: true, type: "attack-roll" }), "k", 1), null);
    RerollCarry.clear();
}

/* -------------------------------------------------------------------------------------------- */
/*  The indicator: what is automated, from where, and what the GM may switch                     */
/* -------------------------------------------------------------------------------------------- */

{
    const { rowsFor, isAutomated, describeRiders } = await import("../scripts/vanilla/describe.mjs");
    {
        // Every key an item may author has a row on the panel: one without a summary threw on render.
        const { AUTHORED_KEYS } = await import("../scripts/lib/config-of.mjs");
        const describeText = fs.readFileSync(path.join(ROOT, "scripts", "vanilla", "describe.mjs"), "utf8");
        const summaries = /const SUMMARIES = \{([\s\S]*?)\n\};/.exec(describeText.replaceAll("\r\n", "\n"))?.[1] ?? "";
        const en = JSON.parse(fs.readFileSync(path.join(ROOT, "lang", "en.json"), "utf8"));
        check("every authored key has a summary and a label on the panel",
            AUTHORED_KEYS.filter((key) => !new RegExp(`^\\s+${key}:`, "m").test(summaries) || !en.ISAACS_AUTOMATION.Indicator.Key[key]), []);
    }
    const { RIDERS_OFF } = await import("../scripts/vanilla/coexistence.mjs");
    Vanilla.setTable({ entries: { slow: { areaTargeting: { maxTargets: 1 }, riders: [{ outcomes: ["failure"], apply: { type: "condition", slug: "slowed", value: 1 } }] } } });
    const spellItem = (slug, flags = {}) => ({ documentName: "Item", slug, flags, system: {} });
    const byKey = (item) => Object.fromEntries(rowsFor(item).map((row) => [row.key, row]));

    check("an item with nothing automated has no mark", isAutomated(spellItem("magic-weapon")), false);
    const slow = byKey(spellItem("slow"));
    check("a table spell shows its area and riders, each from the table", [Object.keys(slow), slow.riders.source], [["areaTargeting", "riders"], "ISAACS_AUTOMATION.Indicator.Source.Table"]);
    check("…and the GM may switch both", [slow.areaTargeting.switchable, slow.riders.switchable], [true, true]);
    check("a rider is described by what it does and when", describeRiders([{ outcomes: ["failure", "criticalFailure"], apply: { type: "condition", slug: "slowed", value: 1 } }]),
        ['ISAACS_AUTOMATION.Indicator.RiderOn {"what":"slowed 1","on":"ISAACS_AUTOMATION.Outcome.failure / ISAACS_AUTOMATION.Outcome.criticalFailure"}']);

    const off = byKey(spellItem("slow", { [LIB_ID]: { riders: false } }));
    check("a key this module switched off shows as off, and can be switched back", [off.riders.applies, off.riders.switchable, off.riders.lines], [false, true, []]);
    const authored = byKey(spellItem("slow", { "a-homebrew": { riders: [{ apply: { type: "prompt" } }] } }));
    check("an item's own authored config is shown but never switchable", [authored.riders.source, authored.riders.switchable], ['ISAACS_AUTOMATION.Indicator.Source.Flags {"module":"a-homebrew"}', false]);
    const theirsOff = byKey(spellItem("slow", { "a-homebrew": { riders: false } }));
    check("…nor is another module's false", theirsOff.riders.switchable, false);

    Vanilla.setRiderDeferral(() => "pf2e-automations");
    const deferred = byKey(spellItem("slow"));
    check("a deferred rider says to whom, and is the setting's to decide", [deferred.riders.source, deferred.riders.applies, deferred.riders.switchable], ['ISAACS_AUTOMATION.Indicator.Source.Deferred {"module":"pf2e-automations"}', false, false]);
    Vanilla.setRiderDeferral(() => RIDERS_OFF);
    check("riders off by the setting say so", byKey(spellItem("slow")).riders.source, "ISAACS_AUTOMATION.Indicator.Source.SettingOff");
    Vanilla.setRiderDeferral(null);
    Vanilla.setTable({ aliases: {}, entries: {} });
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
        "CONFIG.Token.objectClass.prototype._getMovementCostFunction",
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
        for (const [spelled, prefix] of [["Frequency.Per.${per}", "Frequency.Per."], ["Outcome.${outcome}", "Outcome."], ["Indicator.Key.${key}", "Indicator.Key."]]) {
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

{
    const { shieldHp, shieldRules, shieldDamage, blowHas } = await import("../scripts/riders/spell-shield.mjs");
    const fire = { raise: true, hp: 40, hpPerStep: 10, immune: ["fire"], halvedAgainst: ["water"] };
    check("a spell shield's Hit Points grow by step: Fire Shield 40, 50 at rank 6", [shieldHp(fire, 0), shieldHp(fire, 1)], [40, 50]);
    const rules = shieldRules(fire, 40);
    check("a raisable spell shield is lowered until pf2e's Raise a Shield effect is on", [rules[0].path, rules[0].value, rules[0].predicate], ["system.attributes.shield.raised", false, [{ not: "self:effect:raise-a-shield" }]]);
    check("…and carries its own Hit Points", rules.slice(1).map((r) => [r.path, r.value]), [["system.attributes.shield.hp.max", 40], ["system.attributes.shield.hp.value", 40]]);
    check("a blocked blow costs the shield what got past its Hardness", shieldDamage({ landed: 8, instances: [{ type: "slashing", total: 18 }], immune: ["fire"] }), 8);
    check("…none of it fire, when it is immune to fire", [shieldDamage({ landed: 8, instances: [{ type: "fire", total: 18 }], immune: ["fire"] }), shieldDamage({ landed: 12, instances: [{ type: "fire", total: 15 }, { type: "slashing", total: 7 }], immune: ["fire"] })], [0, 7]);
    check("a blow has a trait from its item or its roll options", [blowHas({ item: { system: { traits: { value: ["water"] } } } }, ["water"]), blowHas({ rollOptions: new Set(["origin:item:trait:water"]) }, ["water"]), blowHas({ rollOptions: new Set(["item:trait:fire"]) }, ["water"])], [true, true, false]);
}

{
    const { splitDamage, splittable } = await import("../scripts/riders/share-damage.mjs");
    check("shared damage: the target's altered part, the caster the remainder", [splitDamage(15, 7), splitDamage(15, 8), splitDamage(4, 9)], [{ own: 7, rest: 8 }, { own: 8, rest: 7 }, { own: 4, rest: 0 }]);
    const roll = { total: 12, alter: () => null };
    check("only a rolled blow is split — not a final number, healing, or one past IWR", [splittable({ damage: roll }), splittable({ damage: 12 }), splittable({ damage: { total: -5, alter: () => null } }), splittable({ damage: roll, final: true }), splittable({ damage: roll, skipIWR: true })], [true, false, false, false, false]);
}

{
    const { interposed, isStrikeHit } = await import("../scripts/targeting/barrier.mjs");
    check("a tree takes the blow first, up to its Hit Points; the rest goes on", [interposed(7, 10), interposed(15, 10), interposed(4, 0)], [{ taken: 7, left: 0 }, { taken: 10, left: 5 }, { taken: 0, left: 4 }]);
    const strike = { isOfType: (...types) => types.includes("weapon") };
    const roll = { total: 9, alter: () => null };
    check("only a Strike that hit is caught", [isStrikeHit({ item: strike, outcome: "success", damage: roll }), isStrikeHit({ item: strike, outcome: "failure", damage: roll }), isStrikeHit({ item: { isOfType: () => false }, outcome: "success", damage: roll }), isStrikeHit({ item: strike, outcome: "criticalSuccess", damage: 9 })], [true, false, false, false]);
}

{
    const { statusBonusCounts, NUDGE_PREDICATE } = await import("../scripts/riders/nudge.mjs");
    check("a retroactive +1 status bonus counts unless an enabled status bonus is already there", [statusBonusCounts([{ type: "item", modifier: 2, enabled: true }]), statusBonusCounts([{ type: "status", modifier: 1, enabled: true }]), statusBonusCounts([{ type: "status", modifier: 1, enabled: false }]), statusBonusCounts([{ type: "status", modifier: -1, enabled: true }])], [true, false, true, true]);
    check("a nudge applies one point short of success, or of failure — not where a natural 20 or 1 undoes it", NUDGE_PREDICATE, [{ or: [{ and: ["check:total:delta:-1", { not: "check:total:natural:20" }] }, { and: ["check:total:delta:-10", { not: "check:total:natural:1" }] }] }]);
}

report("Automation tests");
