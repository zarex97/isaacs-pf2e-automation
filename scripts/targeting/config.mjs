import { flagOf } from "../lib/flags.mjs";
import { testPredicate } from "../lib/roll-options.mjs";
import { LIB_ID } from "../id.mjs";
import { Extensions } from "./extensions.mjs";
import { applyHeightening, applyThresholds, bonusStepsFrom, effectiveLevel } from "./heightening.mjs";

/** The effect-area shapes pf2e knows how to build a Region from (`EFFECT_AREA_SHAPES`). */
export const AREA_SHAPES = ["burst", "cone", "cube", "cylinder", "emanation", "line", "ring", "square"];

/**
 * The shapes worth turning.
 *
 * A circle, a ring and an emanation are the same in every direction, so `rotation` is not even a field on
 * their data models — only `cone`, `line` and the rectangle behind `cube`/`square` carry one. Aiming asks
 * for a direction exactly when this is true, and tells the caster how to change it.
 */
export const ROTATABLE_SHAPES = ["cone", "cube", "line", "square"];

export function canRotate(areaType) {
    return ROTATABLE_SHAPES.includes(areaType);
}

/** Borrowed verbatim from the Aura rule element, so the words mean the same thing they do there. */
export const AFFECTS = ["all", "allies", "enemies"];

export const FLAG = "areaTargeting";

/**
 * Read a Technique's targeting rule.
 *
 * Two kinds of item reach this. Most carry a real `system.area` — the cones, bursts, lines and emanations
 * — and the flag only says *who* the area catches. The rest are the Techniques whose target line reads
 * "any creatures within 30 feet": the system has no area for those, so the flag supplies a synthetic one
 * anchored on the caster. Either way the caller gets the same shape back and does not care which it was.
 *
 * Returns null when this item should cast the ordinary way.
 */
export function configFor(item, override = {}) {
    if (!item?.actor || !canvas?.ready) return null;
    if (!game.settings.get(LIB_ID, "areaTargeting")) return null;

    const flag = flagOf(item, FLAG) ?? null;
    if (flag?.enabled === false) return null;

    // A synthetic area is opt-in by definition; a real one is opt-out.
    //
    // A Technique may also change shape depending on how it was released. *Tenma Kōfuku* is a 30-foot cone
    // — "unless you release it in the same turn that you open your eyes, in which case it becomes a 60-foot
    // emanation centred on you". That is one Technique with two areas, chosen by a roll option the Cloth is
    // already emitting, so it is decided here rather than authored as a second spell.
    // `override.area` is a shape the caster picked at cast time. *Photon Burst* is "a 120-foot line, or
    // a 30-foot burst within 120 feet (choose as you cast)" — one Technique with two shapes and no rule
    // deciding between them, so the only thing that can decide is the person casting it.
    const alternate = override.area ?? alternateArea(flag, item);
    const area = alternate ?? flag?.area ?? item.system?.area ?? null;
    const hasArea = !!area?.type && !!Number(area.value);
    if (hasArea && !AREA_SHAPES.includes(area.type)) {
        console.warn(`Isaac's Homebrew | ${item.name}: unknown area shape "${area.type}"`);
        return null;
    }
    // A Technique with no area can still have something to say: "one creature, and two at 20th level" is a
    // target count and a range, and both grow. Those are checked against the targets the player has already
    // picked rather than by making them aim an emanation at themselves, which for one creature is worse
    // than clicking it.
    if (!hasArea && !flag?.maxTargets && !flag?.range) return null;

    // It should not quietly take over every wizard's fireball unless the GM asks it to. An item carrying the
    // flag was written for this and always aims; the setting governs the items that were never written
    // with this in mind, and the narrower choice admits only what a registered scope predicate claims.
    const authored = !!flag;
    if (!authored && game.settings.get(LIB_ID, "areaTargetingScope") === "techniques" && !Extensions.inScope(item)) {
        return null;
    }

    // Heightening the cast rank cannot express — see `bonusStepsFrom`. pf2e has already finished
    // heightening by the time this runs, and at 20th the cast rank is pinned at 10 anyway, so the steps are
    // added on this side, to every number that grows.
    const bonusSteps = bonusStepsFrom(item.actor?.getRollOptions?.() ?? []);

    // Growth per heightening step. The item arriving here is already the heightened variant — `variantFor`
    // loads it so the burst is the right size — so the cast rank is simply its rank.
    const grown = applyHeightening(
        {
            maxTargets: flag?.maxTargets,
            range: flag?.range,
            areas: flag?.areas,
            length: flag?.length,
        },
        flag?.heightening,
        { baseRank: item.baseRank ?? item.system?.level?.value, castRank: item.rank, bonusSteps },
    );
    applyThresholds(grown, flag?.heightening, effectiveLevel(item.actor));

    // The area itself. pf2e folded the ordinary steps into `system.area.value` during preparation, so only
    // the sky's share is owed here; a synthetic area was never touched by the system and carries its growth
    // on the flag instead.
    const authoredArea = !!(alternate ?? flag?.area);
    const areaPerStep = Number((authoredArea ? flag?.heightening?.area : item.system?.heightening?.area) ?? 0);
    const areaValue = hasArea ? Number(area.value) + areaPerStep * bonusSteps : 0;

    return {
        item,
        area: hasArea ? { type: area.type, value: areaValue } : null,
        synthetic: authoredArea || !item.system?.area,
        affects: AFFECTS.includes(flag?.affects) ? flag.affects : "all",
        includesSelf: flag?.includesSelf === true,
        includesNeutral: flag?.includesNeutral === true,
        requireLineOfEffect: flag?.requireLineOfEffect !== false,
        predicate: Array.isArray(flag?.predicate) ? flag.predicate : [],
        // An emanation has nowhere to go but the caster and so is never placed; everything else is aimed,
        // including a cone or a line, whose apex pf2e already snaps to the edge of a space for you.
        //
        // Optional chaining, because a Technique reaching here may legitimately have no area at all: "one
        // creature within 60 feet" is a target count and a range, which is the shape `checkExistingTargets`
        // exists to handle. Reading `.type` off that null threw straight out of the `cast` wrapper — so
        // *Another Dimension*, *Tenbu Hōrin* and *Rikudō Rinne* could not be cast, at all, ever.
        // An authored anchor wins, because "centred on you" is a fact about the Technique rather than
        // about the shape: *Rozan Shō Ryū Ha* is a cylinder that climbs out of the Saint's own square, and
        // putting it on the cursor asks the player to aim something that has only one place to be.
        anchor: flag?.anchor ?? (area?.type === "emanation" ? "self" : "free"),
        maxTargets: grown.maxTargets,
        // The flag's range when it has one — *Another Dimension* declares 60 feet and grows it ten a step —
        // and the spell's own otherwise. Every area Technique in the module states its reach in
        // `system.range` and none of them repeats it on the flag, so "a 60-foot burst **within 120 feet**"
        // was half a rule: the burst was placed and the 120 feet was never checked, for any Cloth.
        range: grown.range || feetOf(item.system?.range?.value),
        areas: grown.areas,
        length: grown.length,
        steps: grown.steps,
    };
}

/**
 * The first alternate area whose predicate the caster satisfies, or null.
 *
 * Tested against the caster's own roll options, because every condition of this kind is a fact about the
 * Saint rather than about the target: which aspect they are wearing, whether their eyes are open, what the
 * sky is doing today. The area that wins is treated exactly like an authored `flag.area` from here on —
 * including being self-anchored when it is an emanation, which is what makes "centred on you" true.
 */
function alternateArea(flag, item) {
    const alternates = flag?.alternateArea ? [flag.alternateArea].flat() : [];
    if (alternates.length === 0) return null;

    const options = new Set(item.actor?.getRollOptions?.() ?? []);
    for (const option of item.getRollOptions?.("item") ?? []) options.add(option);
    return alternates.find((alternate) => testPredicate(alternate.predicate, options))?.area ?? null;
}

/** "120 feet" as a number. Anything without a number in it — "touch", "planetary" — is no limit at all. */
export function feetOf(range) {
    const match = /(\d+)/.exec(String(range ?? ""));
    return match ? Number(match[1]) : 0;
}

/**
 * The caster's token, which a self-anchored area is built on and which every line of effect is drawn from.
 * Prefers the controlled token so a GM moving two copies of the same actor gets the one they are holding.
 *
 * A registered origin resolver may answer first: a cast measured from somewhere other than the caster —
 * a projected astral body, say — is a range and a line of effect measured from there, and this is the one
 * function that decides where both are measured from.
 */
export function originTokenFor(actor, item = null) {
    const projected = item ? Extensions.originFor(actor, item) : null;
    if (projected) return projected;
    const tokens = actor?.getActiveTokens?.(true, false) ?? [];
    return tokens.find((token) => token.controlled) ?? tokens[0] ?? null;
}

/** A human-readable description of the rule, for the placement notification and the review dialog. */
export function describe(config) {
    const who = { all: "every creature", allies: "allies only", enemies: "enemies only" }[config.affects];
    const extra = [];
    if (!config.area) {
        const bits = [];
        if (config.maxTargets > 0) bits.push(`up to ${config.maxTargets} target${config.maxTargets === 1 ? "" : "s"}`);
        if (config.range > 0) bits.push(`within ${config.range} ft`);
        return bits.join(", ") || who;
    }
    const shape = config.area.type;
    const size = `${config.area.value} ft`;
    if (config.includesSelf) extra.push("including you");
    if (config.predicate.length > 0) extra.push("filtered");
    if (config.areas > 1) extra.push(`${config.areas} placements`);
    if (config.maxTargets > 0) extra.push(`up to ${config.maxTargets}`);
    if (config.range > 0) extra.push(`within ${config.range} ft`);
    return `${size} ${shape} — ${who}${extra.length ? ` (${extra.join(", ")})` : ""}`;
}
