import { flagOf } from "../lib/flags.mjs";
import { targetingOptions, testPredicate } from "../lib/roll-options.mjs";
import { LIB_ID } from "../id.mjs";
import { catchTokens } from "./catch.mjs";
import { canRotate, configFor, describe, originTokenFor } from "./config.mjs";
import { Extensions } from "./extensions.mjs";
import { discardArea, originOf, placeArea } from "./place.mjs";
import { REAIM, reviewTargets } from "./review.mjs";

/**
 * Where a shape choice leaves the spell it decided on.
 *
 * `SpellcastingEntryPF2e#cast` posts whatever spell it is handed and spends the point off
 * `spell.original`, so handing it a loaded variant is the whole of the fix — but `run` answers a
 * boolean and is called from two places. The options object is already the thing the pipeline mutates
 * for `consume`, so the variant travels there too rather than widening the return type.
 */
export const VARIANT = Symbol.for(`${LIB_ID}.castVariant`);

/**
 * Area targeting: the step that used to be "click eight tokens and hope you got them all".
 *
 * A Technique with an area now puts that area on the board as a Scene Region, lets the caster aim it,
 * catches whoever is inside, applies the Technique's own targeting rule, and sets the result as the
 * user's targets before the spell is ever cast. By the time the chat card exists the targets are already
 * there, which is exactly what pf2e-toolbelt's Target Helper reads when it builds the card's target rows
 * — so the two features meet without either one knowing about the other.
 *
 * The interception point is `SpellcastingEntryPF2e#cast`, which is where the Focus Point is spent — so
 * refusing there is also what makes a cancelled placement cost nothing. `run` is called from
 * `scripts/cast-pipeline.mjs`, which owns that wrapper and the one on an activity's `toMessage`.
 */
export const AreaTargeting = {
    // Where other code plugs in — see `extensions.mjs`.
    registerPreAim: Extensions.registerPreAim,
    registerAimed: Extensions.registerAimed,
    registerAfterAim: Extensions.registerAfterAim,
    registerOriginResolver: Extensions.registerOriginResolver,
    registerScopePredicate: Extensions.registerScopePredicate,
    registerAreaCount: Extensions.registerAreaCount,
    registered: Extensions.registered,

    registerSettings() {
        game.settings.register(LIB_ID, "areaTargeting", {
            name: "Place areas as Regions when casting",
            hint: "A Technique with an area puts that area on the board to be aimed, then targets whoever is "
                + "inside it, instead of asking you to select targets by hand first.",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        });

        game.settings.register(LIB_ID, "areaTargetingScope", {
            name: "Area targeting applies to",
            hint: "Whether area targeting is used only for Techniques — the Saint's and the Soulbound's alike — "
                + "or for every spell with "
                + "an area in the world.",
            scope: "world",
            config: true,
            type: String,
            choices: {
                techniques: "Techniques only (Saint and Soulbound)",
                spells: "Every spell with an area",
            },
            default: "techniques",
        });

        game.settings.register(LIB_ID, "enforceRange", {
            name: "Enforce Technique range",
            hint: "Refuse a placement further from you than the Technique reaches. The module never checked "
                + "this before, so it can be turned off — and a GM can always confirm past a rejection.",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        });

        game.settings.register(LIB_ID, "areaTargetingReview", {
            name: "Review targets before casting",
            hint: "Show the list of caught tokens for confirmation after you place the area. Turn this off to "
                + "target everything the area caught and cast immediately.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true,
        });
    },

    /**
     * Run the flow for one cast. Resolves true when the cast should go ahead.
     *
     * Every early return is `true`: a Technique with no area, the setting off, the bypass key held, no
     * canvas — all of those are "not our business, cast normally". Only a caster who backed out of the
     * placement or the review returns false.
     */
    async run(spell, options = {}) {
        // This is the choke point every cast passes through, so it is where a caster who may not cast at
        // all is told so — before anything is asked or aimed.
        if (!(await Extensions.preAim(spell, options))) return false;

        let cast = variantFor(spell, options);
        // A Technique that offers two shapes asks before anything else happens, because the answer decides
        // what is put on the cursor. Backing out of the question is backing out of the cast, and costs
        // nothing — the Focus Point is spent after this returns.
        let shape = await chooseShape(cast);
        if (shape === false) return false;
        // A named overlay is a whole second spell pf2e already knows how to post. Loading it here means
        // the card, the range and the area all say the same thing, and the pipeline casts the variant
        // rather than the original — see `CastPipeline`, which reads it back off `options`.
        if (shape?.overlay && typeof cast.loadVariant === "function") {
            const variant = cast.loadVariant({ overlayIds: [shape.overlay], castRank: cast.rank });
            if (variant) {
                cast = variant;
                if (options) options[VARIANT] = variant;
            }
        }
        // How many areas go on the cursor, when that is decided at cast time rather than authored. Asked
        // here so that backing out of the placement still costs nothing.
        const count = await Extensions.areaCount(cast, options);
        if (count === false) return false;

        const config = configFor(cast, {
            ...(shape ? { area: shape } : {}),
            ...(count > 1 ? { areas: count } : {}),
        });
        if (!config) return true;
        if (bypassHeld()) return true;

        const originToken = originTokenFor(spell.actor, cast);

        // No area to aim: the Technique names a number of creatures and a range instead, and both grow.
        // Those are checked against the targets the player already picked.
        if (!config.area) return checkExistingTargets(config, originToken);

        // Every area ever put down this cast, not just the one that survived: a caster who re-aims three
        // times has aimed three areas, and all three are discarded together in the `finally`.
        const placed = [];
        // The placement currently under consideration — aimed, and in range. Only this one is ever
        // reviewed, targeted or built into a wall.
        let regions = null;
        try {
            ui.notifications.info(aimHint(cast, config));

            // Aim, look at who it caught, and go back to aiming if that was not what they meant. The loop
            // is the adjustment step: re-placing is how the area is moved *and* turned, so there is no
            // second set of controls to learn and no area left on the board while a dialog is open.
            for (;;) {
                const aimed = await placeArea(config, originToken);
                if (aimed?.length) {
                    placed.push(...aimed);
                    // Declining an out-of-range placement now means "let me aim again" rather than calling
                    // the cast off, which is the answer that question always wanted.
                    if (!(await withinRange(aimed, config, originToken))) continue;
                    regions = aimed;
                } else if (!regions) {
                    // Esc with nothing aimed yet is the caster calling the whole thing off. Esc while
                    // re-aiming only means "keep what I had", so it falls through to that placement's
                    // target list instead.
                    return false;
                }

                // A placement that is about a place rather than about people ends here: reviewing a target
                // list it will never have is a dialog that can only say "nothing caught".
                const handled = await Extensions.aimed(config, regions, originToken);
                if (handled !== undefined) return handled;

                // An emanation is never placed — it is centred on the caster's own space, so re-aiming it
                // would put the identical area back in the identical spot. Offering a button that visibly
                // does nothing is worse than not offering one.
                const ids = await reviewTargets(collect(regions, config, originToken), config, {
                    canReaim: config.anchor !== "self",
                });
                if (ids === null) return false;
                if (ids === REAIM) continue;

                canvas.tokens.setTargets(ids);
                // What the confirmed placement leaves behind — a wall, burning ground, a tally of the dead.
                // Here rather than in a rider because these need the area itself, and by the time a rider
                // runs the area has been discarded.
                await Extensions.afterAim(config, regions, originToken);
                return true;
            }
        } catch (error) {
            console.error("Isaac's Homebrew | area targeting failed", error);
            ui.notifications.error("Area targeting failed; cast normally. See the console for details.");
            return true;
        } finally {
            // Runs before the cast proceeds, so the area is gone by the time the card is posted.
            await discardArea(placed);
        }
    },
};

/**
 * Who the placed areas caught, across all of them.
 *
 * Several placements catch between them, and a token standing in two of them is still one target — the
 * dialog would otherwise offer to hit it twice. A token caught by one area and rejected by another is
 * caught: being out of the second area is not a reason to spare it from the first.
 */
function collect(regions, config, originToken) {
    const caught = new Map();
    const rejected = new Map();
    for (const region of regions) {
        const found = catchTokens(region, config, originToken);
        for (const entry of found.caught) caught.set(entry.token.id, entry);
        for (const entry of found.rejected) rejected.set(entry.token.id, entry);
    }
    for (const id of caught.keys()) rejected.delete(id);
    return { caught: [...caught.values()], rejected: [...rejected.values()] };
}

/**
 * "A 120-foot line, or a 30-foot burst within 120 feet — choose as you cast."
 *
 * Returns the chosen shape, null when the Technique offers no choice, and false when the caster closed the
 * question. pf2e can express this as spell variants (`system.overlays`), but a variant is a whole second
 * spell to keep in step for what is one number and one word, and the choice has to reach the placement
 * rather than the chat card.
 */
async function chooseShape(item) {
    const declared = flagOf(item, "areaTargetingShapes");
    if (!Array.isArray(declared) || declared.length === 0) return null;

    /**
     * A shape a Technique only has at one rung.
     *
     * Tiburón's La Gota is a 30-foot cone, a 40-foot cone once it is Refined, and — at the Segunda
     * Etapa — *"may be used as a **60-foot line** instead of a cone"*. The word is **may**: the line is
     * an option beside the cone, not a replacement for it. Written as an `alternateArea` it was a
     * replacement, and driven live a 13th-level Tiburón could no longer cast the cone at all.
     *
     * So a choice may carry a predicate, and the list is filtered before it is offered. One survivor is
     * not a question — it is simply the shape, which is how the two cone sizes stay a size rather than
     * becoming a prompt nobody wants.
     */
    const options = new Set([
        ...(item.getRollOptions?.("item") ?? []),
        ...(item.actor?.getRollOptions?.() ?? []),
    ]);
    const choices = declared.filter((choice) => testPredicate(choice.predicate, options));
    if (choices.length === 0) return null;
    if (choices.length === 1) {
        const only = choices[0];
        return { type: only.type, value: only.value, overlay: only.overlay ?? null };
    }

    const picked = await foundry.applications.api.DialogV2.wait({
        window: { title: item.name },
        content: `<p>${item.name} can be released as either shape. Which is it?</p>`,
        buttons: choices.map((choice, index) => ({
            action: String(index),
            label: choice.label ?? `${choice.value}-foot ${choice.type}`,
        })),
        rejectClose: false,
    });
    if (picked === null || picked === undefined) return false;
    const choice = choices[Number(picked)];
    if (!choice) return false;
    // `overlay` names one of the spell's own variants, and it is what keeps the **card** honest. The
    // shape reached the placement from the start — the Region really was a 120-foot line — but the chat
    // card still read "Area 60-foot cone", because the choice had never reached pf2e. Driven live, a
    // Cero Metralleta fired down a 120-foot line caught the creatures along it and announced a cone.
    return { type: choice.type, value: choice.value, overlay: choice.overlay ?? null };
}

/**
 * What to announce before the area goes on the cursor.
 *
 * The rotation keys are named because a plain wheel zooms the canvas — Foundry gates rotation behind Shift
 * or Ctrl — so a caster who scrolls and sees the map get bigger reasonably concludes the area cannot be
 * turned at all. Only said for a shape where it is true: a burst and an emanation are the same in every
 * direction.
 */
function aimHint(cast, config) {
    const base = `${cast.name}: ${describe(config)}`;
    return canRotate(config.area?.type) ? `${base} — Shift+scroll to rotate (Ctrl for finer).` : base;
}

/**
 * A Technique with no area still has a target count and a range.
 *
 * *Another Dimension* is one creature and two from 12th level; *Rikudō Rinne* is one and two at 20th. Both
 * grow, and neither is worth turning into an emanation the caster aims at their own feet — so the numbers
 * are checked against the targets they picked, and a breach is a question rather than a refusal for the
 * same reason an out-of-range placement is.
 */
async function checkExistingTargets(config, originToken) {
    const targets = [...game.user.targets];
    const problems = [];

    if (config.maxTargets > 0 && targets.length > config.maxTargets) {
        problems.push(
            `${targets.length} targeted, and it reaches ${config.maxTargets}`,
        );
    }
    // A requirement on the target itself: "one creature with at least 5 needles", "one creature with at
    // least 1 needle". An area Technique gets this from `catchTokens`, which simply does not offer a
    // creature that fails it; a Technique that names a number of creatures has no area to filter, so it is
    // checked here against the ones the caster picked.
    const failing = targets.filter(
        (t) => !testPredicate(config.predicate, targetingOptions(config.item.actor, t.actor, config.item)),
    );
    if (config.predicate.length > 0 && failing.length > 0) {
        problems.push(
            `${failing.map((t) => t.document.name).join(", ")} ${failing.length === 1 ? "does" : "do"} not `
            + `meet this Technique's requirement`,
        );
    }
    if (config.range > 0 && game.settings.get(LIB_ID, "enforceRange") && originToken) {
        const far = targets.filter((t) => (originToken.distanceTo?.(t) ?? 0) > config.range);
        if (far.length > 0) {
            problems.push(
                `${far.map((t) => t.document.name).join(", ")} beyond ${config.range} ft`,
            );
        }
    }
    if (problems.length === 0) return true;

    return foundry.applications.api.DialogV2.confirm({
        window: { title: config.item.name },
        content: `<p>${problems.join("; ")}.</p><p>Cast anyway?</p>`,
        rejectClose: false,
    });
}

/**
 * Was it placed within reach?
 *
 * A rejection is a question rather than a refusal: a measured distance is not always the distance a table
 * means, and holding people to a rule they were not being held to yesterday should be overridable. The
 * setting turns it off entirely. Answering no sends the caster back to aiming, which is the thing they
 * actually wanted when they said the placement was wrong.
 *
 * `originToken` is the placeable, which is what `originTokenFor` returns and what carries `distanceTo`.
 */
async function withinRange(regions, config, originToken) {
    if (!config.range || !originToken) return true;
    if (!game.settings.get(LIB_ID, "enforceRange")) return true;

    let furthest = 0;
    for (const region of regions) {
        const origin = originOf(region);
        if (!origin) continue;
        const distance = originToken.distanceTo?.(origin) ?? 0;
        furthest = Math.max(furthest, distance);
    }
    if (furthest <= config.range) return true;

    return foundry.applications.api.DialogV2.confirm({
        window: { title: "Out of range" },
        content:
            `<p><strong>${config.item.name}</strong> reaches ${config.range} feet. That placement is `
            + `${Math.round(furthest)} feet away.</p><p>Place it anyway?</p>`,
        rejectClose: false,
    });
}

/**
 * The spell as it will actually be cast.
 *
 * Area grows with rank (`system.heightening.area`), and that growth only exists on the heightened
 * variant — the same variant `SpellPF2e#toMessage` loads a moment later. Reading the area off the base
 * spell would place a 30-foot burst for a Technique being cast as a 60-foot one.
 */
function variantFor(spell, options) {
    const rank = options?.rank ?? spell?.rank;
    const castRank = typeof spell?.computeCastRank === "function" ? spell.computeCastRank(rank) : rank;
    if (castRank && castRank !== spell.rank && typeof spell.loadVariant === "function") {
        return spell.loadVariant({ castRank }) ?? spell;
    }
    return spell;
}

/** Hold Control while casting to target by hand, the same key pf2e-toolbelt uses to skip its own popup. */
function bypassHeld() {
    const manager = foundry.helpers?.interaction?.KeyboardManager ?? globalThis.KeyboardManager;
    const control = manager?.MODIFIER_KEYS?.CONTROL ?? "Control";
    return game.keyboard?.isModifierActive?.(control) === true;
}
