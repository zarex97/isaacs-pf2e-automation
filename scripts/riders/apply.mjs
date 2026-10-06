import { applyHeightening, applyThresholds, bonusStepsFrom, catchTokens, describeActor, describeDamage, effectiveLevel, riderOptions, shapeFromArea, stepsFor, testPredicate, thresholdsCrossed, valueAtLevel } from "../../automation.mjs";
import { LIB_ID } from "../id.mjs";
import { Banish, durationSeconds } from "./banish.mjs";
import { OUTCOME_LABELS, collectRiders, itemFor, riderAt } from "./data.mjs";
import { Encasement } from "./encasement.mjs";
import { Escape, escapeStatisticFor } from "./escape.mjs";
import { RiderExtensions } from "./extensions.mjs";
import { offerReaction } from "./reactions.mjs";
import { gateByRound } from "./round-gate.mjs";
import { selectRiders } from "./select.mjs";

/** pf2e's DegreeOfSuccess is an index, not a word. */
const DEGREES = ["criticalFailure", "failure", "success", "criticalSuccess"];

/**
 * Apply the riders an event earned. GM-side; see relay.mjs for why.
 *
 * Rerolls are the reason this replaces rather than adds: a hero point turning a critical failure into a
 * success has to take the stunned 3 back off again. Only what this module put there may be removed — a
 * condition the GM clicked on by hand is not ours to touch — so every application leaves a receipt on the
 * message saying which items it created and which counters it moved, and undoing is that receipt replayed
 * backwards.
 */
export async function applyRiders(payload) {
    const context = await resolveContext(payload);
    if (!context) return;

    let candidates = collectRiders({
        event: payload.event,
        // The message's item where there is one, and the item the payload named otherwise. `action-used`
        // is collected from this item alone, so it has to be the ability that was actually used rather
        // than null — which it is: `onActionUsed` sends its uuid.
        item: context.messageItem ?? context.item,
        actor: context.originActor,
    });

    // One use of an ability produces one request for the caster and one per target, and each half must see
    // only its own riders. Letting every request see all of them means a `self` rider is applied once per
    // target as well — and the receipt cannot be trusted to catch that, because a player's requests reach
    // the GM as independent socket jobs with no ordering between them. See `Sources.onActionUsed`.
    if (payload.event === "action-used") {
        const wantSelf = payload.selfOnly === true;
        candidates = candidates.filter(({ rider }) => (rider.self === true) === wantSelf);
    }
    if (candidates.length === 0) return;

    // A rider with an `area` fans out from the origin's token; everything else lands on the one target the
    // event named. Grouping by target first is what lets each target get its own snapshot and receipt.
    const byTarget = new Map();
    for (const candidate of candidates) {
        for (const target of await targetsFor(candidate.rider, context)) {
            if (!byTarget.has(target)) byTarget.set(target, []);
            byTarget.get(target).push(candidate);
        }
    }

    for (const [target, forTarget] of byTarget) {
        await applyToTarget(target, forTarget, context, payload);
    }

    await spendStrikeTechnique(payload, context);
}

async function applyToTarget(target, candidates, context, payload) {
    const actor = target?.actor;
    if (!actor) return;

    // Keyed on *both* targets: the one the event was about, and the one this rider lands on. They are the
    // same token for an ordinary rider, and different for a `self` rider on a per-target event — which is
    // what *Sekishiki Kisōen* is, healing the caster once for each creature that fails its save. With the
    // event's target left out, the second failure wrote the same key as the first, matched its outcome,
    // and was dropped as a re-application: the Saint healed once no matter how many souls the flames took.
    //
    // A third thing has to be in the key, and Virgo is the Cloth that proves it. `Sources.onActionUsed`
    // sends one relay request for the self riders and a separate one per confirmed target — and when a
    // Technique's area `includesSelf`, the caster is *also* one of those confirmed targets, so their own
    // token is `payload.targetUuid` twice, under two different rider sets. Both requests then produced the
    // identical key above, so *Tenpōrin'in*'s self-only counteract offer wrote a receipt that the very next
    // request — the ordinary buff landing on the caster as an ally — matched and silently declined to
    // re-apply. The Saint got the counteract card and never their own aura. `selfOnly` is therefore folded
    // in: it is undefined for every event that never splits this way, so nothing else moves.
    const receiptKey = receiptKeyFor(payload, target.id);
    const previous = context.message?.flags?.[LIB_ID]?.ridersApplied?.[receiptKey] ?? null;
    if (previous?.outcome === (payload.outcome ?? null)) return;
    if (previous) await undo(actor, previous);

    // The snapshot. Every predicate for this target is tested against the world as it was before anything
    // was applied, which is what makes an escalation ladder advance exactly one step: the rider for step
    // two requires step one to be present, and it is not, yet.
    const options = riderOptions({
        originActor: context.originActor,
        targetActor: actor,
        // `eventItem` last: it is the only one that can belong to somebody else, so it fills in only when
        // the event named no item of the origin's own. See `resolveContext` for why the two are separate.
        item: context.item ?? context.messageItem ?? context.eventItem,
        extra: payload.damage ? describeDamage(payload.damage) : [],
    });

    // Most riders are chosen against the snapshot. A `live` rider is chosen against the world as this pass
    // leaves it — see below for why Scorpio needs that and why an escalation ladder must never have it.
    const snapshot = candidates.filter(({ rider }) => rider.live !== true);
    const live = candidates.filter(({ rider }) => rider.live === true);
    // "The first time each round you hit" is a count, and `selectRiders` cannot count. The allowance
    // belongs to the creature the rider is for, so the ledger is kept on the origin and spent here —
    // after the predicate has agreed the rider applies, and before anything is written to the target.
    const chosen = await gateByRound(
        selectRiders(snapshot, { outcome: payload.outcome ?? null, options }),
        context.originActor ?? actor,
    );
    if (chosen.length === 0 && live.length === 0) return;

    const work = {
        ...context,
        actor,
        target,
        // The creature the *event* was about, kept apart from `target` above. For an ordinary rider the
        // two are the same token; for a `self` rider `target` becomes the caster's own — but *Royal
        // Funeral*'s "you know the target's exact Hit Points" is a `self` grant that still needs to know
        // which creature the rose was thrown at, and by the time `target` is overwritten that fact is gone
        // unless something keeps a copy. `context.target` here is still the pre-overwrite value from
        // `resolveContext` — the enemy the event named — for exactly that.
        eventTarget: context.eventTarget ?? context.target,
        eventAlly: context.eventAlly,
        outcome: payload.outcome ?? null,
        event: payload.event,
        adjustments: [],
        prompts: [],
        notes: [],
        choices: [],
        picks: [],
        moves: [],
    };
    const before = new Set(actor.items.map((i) => i.id));

    for (const { rider, item, index } of chosen) {
        try {
            await applyOne(rider, { ...work, item, riderIndex: index, riderItem: item });
        } catch (error) {
            console.error(`Isaac's Homebrew | ${item.name}: rider failed on ${actor.name}`, rider, error);
        }
    }

    // The riders that ask about the state this pass just produced.
    //
    // Scorpio is the reason, and it is the one Cloth where the snapshot is the wrong question. The Ascendant
    // Boon reads *"each needle deals 1d6 persistent bleed"* and *"at 8 needles the target must attempt a
    // Fortitude save or die"*, and the needle it is counting is placed by another rider in the same pass. So
    // against the snapshot every one of those numbers is one behind: the first needle drew no blood at all,
    // and the Scorpion asked its question on the ninth needle rather than the eighth.
    //
    // This is not the escalation ladder's problem in disguise. A ladder — Virgo's four senses — must see the
    // world as it was, or every step of it fires at once. These riders are not steps of a ladder; they are
    // consequences of where the ladder now stands, and they say so.
    if (live.length > 0) {
        const now = riderOptions({
            originActor: context.originActor,
            targetActor: actor,
            item: context.item ?? context.messageItem ?? context.eventItem,
            extra: payload.damage ? describeDamage(payload.damage) : [],
        });
        const liveChosen = await gateByRound(
            selectRiders(live, { outcome: payload.outcome ?? null, options: now }),
            context.originActor ?? actor,
        );
        for (const { rider, item, index } of liveChosen) {
            try {
                await applyOne(rider, { ...work, item, riderIndex: index, riderItem: item });
            } catch (error) {
                console.error(`Isaac's Homebrew | ${item.name}: live rider failed on ${actor.name}`, rider, error);
            }
        }
    }

    if (context.message) {
        const receipt = {
            outcome: payload.outcome ?? null,
            itemIds: actor.items.map((i) => i.id).filter((id) => !before.has(id)),
            adjustments: work.adjustments,
            moves: work.moves,
        };
        await context.message.update({ [`flags.${LIB_ID}.ridersApplied.${receiptKey}`]: receipt });
    }

    if (work.notes.length > 0) await postNotes(work);
    if (work.prompts.length > 0) await postPrompts(work);
    for (const choice of work.choices) await postChoice(choice, work, payload);
    for (const pick of work.picks) await postPick(pick, work, payload);
}

/**
 * The Strike a Technique paid for has happened; the marker is spent.
 *
 * Hit or miss, because the Technique was cast either way and *"make one Strike"* is one Strike. Called
 * from `applyRiders` rather than from the source, because the source runs on whichever client rolled and
 * the flag is the GM's to write — and because a collection that found nothing still consumed the cast.
 */
async function spendStrikeTechnique(payload, context) {
    if (payload.event !== "strike-resolved") return;
    const { StrikeTechnique } = await import("./strike-technique.mjs");
    await StrikeTechnique.disarm(context.originActor);
}

/** Feet between two tokens, by the scene's own grid — the same measurement `sources.mjs` uses. */
function distanceBetween(a, b) {
    const measured = canvas.grid?.measurePath?.([a.center, b.center])?.distance;
    if (Number.isFinite(measured)) return measured;
    const feetPerPixel = (canvas.scene?.grid?.distance ?? 5) / (canvas.grid?.size ?? 100);
    return Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y) * feetPerPixel;
}

/** One option of one choice rider, come back from the caster's click. */
export async function applyChoice(payload) {
    const context = await resolveContext(payload);
    const target = await fromUuid(payload.targetUuid);
    const actor = target?.actor;
    if (!context || !actor) return;

    const item = await fromUuid(payload.riderItemUuid);
    const rider = riderAt(item, payload.riderIndex);
    const option = rider?.apply?.options?.[payload.optionIndex];
    if (!option?.apply && !Array.isArray(option?.riders)) return;

    // …and it is tested again on the click, because the card outlives the moment it was posted: a Soulbound
    // who spends four points and then presses the five-point button on the same card would otherwise take
    // a fifth from a pool that no longer has it.
    if (!testPredicate(option.predicate, riderOptions({ originActor: context.originActor, targetActor: actor, item }))) {
        ui.notifications.warn(`${item?.name ?? "This option"}: ${option.label ?? "that option"} is no longer available.`);
        return;
    }

    const work = { ...context, actor, target, item, outcome: payload.outcome ?? null, adjustments: [], prompts: [], notes: [], choices: [], picks: [], moves: [] };
    /**
     * An option may be a list rather than a single thing.
     *
     * The Miracle is why: *"You may spend any number of Miracle points … for each point spent, until the
     * end of your turn your spirit weapon's Strikes deal +1d6"* is two actions on one button — take the
     * points off the counter, and hand out what they bought. `reaction` and `pick` have spelled nesting
     * as `riders` since they were written; this brings the third container into line rather than
     * inventing a fourth shape for it.
     */
    const entries = Array.isArray(option.riders)
        ? option.riders
        : [{ ...rider, apply: option.apply, duration: option.duration ?? rider.duration }];
    for (const [index, entry] of entries.entries()) {
        await applyOne(entry, {
            ...work,
            riderIndex: Array.isArray(option.riders)
                ? [payload.riderIndex, "options", payload.optionIndex, "riders", index].flat()
                : payload.riderIndex,
        });
    }
    if (work.notes.length > 0) await postNotes(work);
    if (work.prompts.length > 0) await postPrompts(work);
}

/**
 * A reaction, come back from a click on its card.
 *
 * Mirrors `applyChoice`: the payload carries an address rather than rider data, so the GM re-reads what
 * the ability actually does. The nested `riders` are applied against whoever the trigger was about — which
 * for a defensive reaction is usually the reacting actor themselves, and for Antithesis is the creature
 * that dealt the damage.
 */
export async function resolveReaction(payload) {
    const context = await resolveContext(payload);
    if (!context) return;

    const item = await fromUuid(payload.riderItemUuid);
    const rider = riderAt(item, payload.riderIndex);
    const nested = rider?.apply?.riders ?? [];
    if (nested.length === 0) return;

    const origin = await fromUuid(payload.originUuid);
    const originActor = origin?.actor ?? origin;
    const target = payload.targetUuid ? await fromUuid(payload.targetUuid) : null;
    const actor = target?.actor ?? originActor;

    // The creature the event was about, carried across the card so a nested `trigger` rider can reach it.
    const eventTarget = payload.eventTargetUuid ? await fromUuid(payload.eventTargetUuid) : null;
    const eventAlly = payload.eventAllyUuid ? await fromUuid(payload.eventAllyUuid) : null;

    const work = {
        ...context, originActor, actor, target, item, eventTarget, eventAlly,
        outcome: payload.outcome ?? null,
        adjustments: [], prompts: [], notes: [], choices: [], picks: [], moves: [],
    };
    for (const [index, inner] of nested.entries()) {
        await applyOne(inner, { ...work, riderIndex: [payload.riderIndex, "riders", index].flat() });
    }
    if (work.notes.length > 0) await postNotes(work);
    if (work.prompts.length > 0) await postPrompts(work);
}

/**
 * A flat check, rolled and announced.
 *
 * Three things in this module promise "succeed at a DC N flat check or the effect fails": Greater Flash
 * Step's afterimage, Kyōka Suigetsu's displaced image, and Arrogante's decay. pf2e rolls flat checks for
 * its own persistent damage but offers a module no way to demand one, so this rolls it.
 *
 * It reports rather than rewrites, and that distinction is the honest part: by the time a Strike has
 * resolved, pf2e has already settled whether it hit, and nothing a module does afterwards un-hits it. What
 * this removes is the *remembering* — the check happens, in public, at the moment it is owed.
 */
async function applyFlatCheck(rider, context) {
    const dc = Number(rider.apply.dc) || 5;
    const roll = await new Roll(rider.apply.formula ?? "1d20").evaluate();
    const passed = roll.total >= dc;
    const label = rider.apply.label ?? `DC ${dc} flat check`;

    await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: context.originActor ?? context.actor }),
        flavor: `${label} — <strong>${passed ? "success" : "failure"}</strong> against DC ${dc}`,
    });

    const branch = passed ? rider.apply.onSuccess : rider.apply.onFailure;
    for (const [index, inner] of (branch ?? []).entries()) {
        await applyOne(inner, { ...context, riderIndex: [context.riderIndex, "riders", index].flat() });
    }
}


async function applyOne(rider, context) {
    const apply = rider.apply ?? {};
    // A **nested** rider may name the creature the event was about, rather than the one the outer rider
    // landed on.
    //
    // Antithesis is the case: *"the triggering creature takes 2d6 spirit damage, and the target of the
    // trigger gains resistance equal to your level"* — one reaction, two recipients. The outer rider has
    // to be `self`, because a reaction is offered to the ability's owner and `validate` insists on it, so
    // everything nested inside lands on the Quincy by default. `trigger: true` sends this one entry to
    // the other end of the event instead: the creature that struck them.
    if (rider.trigger === true && context.eventTarget?.actor) {
        context = { ...context, actor: context.eventTarget.actor, target: context.eventTarget };
    }
    /**
     * …and `trigger: "ally"` for the creature the harm actually landed on.
     *
     * `ally-damaged` is the only event with three participants — the watcher whose riders are being read,
     * the striker, and the ally who was hurt — and two of them need reaching from one rider. Antithesis
     * wants both at once: *"The triggering creature takes 2d6 spirit damage, and **the target of the
     * trigger** gains resistance equal to your level"*, where the target of the trigger is the ally.
     */
    if (rider.trigger === "ally" && context.eventAlly?.actor) {
        context = { ...context, actor: context.eventAlly.actor, target: context.eventAlly };
    }
    switch (apply.type) {
        case "prompt":
            context.prompts.push(apply.text ?? rider.note ?? "");
            return;
        case "pick":
            // The creatures are read off the board when the card is posted, not authored — see `postPick`.
            context.picks.push({
                rider,
                index: context.riderIndex,
                item: context.riderItem ?? context.item,
            });
            return;
        case "choice":
            // `target`/`actor` travel with the entry rather than being re-read from the outer context later:
            // a choice nested inside a volley's `onAllHit` is applied against the creature the volley hit,
            // while the *outer* pass belongs to the `self` rider that ran the volley in the first place —
            // Double Excalibur's own caster. Reading the outer context at post time named the Saint as the
            // target of their own sever, and the choice never reached the creature it was about.
            context.choices.push({
                rider,
                index: context.riderIndex,
                item: context.riderItem ?? context.item,
                target: context.target,
                actor: context.actor,
            });
            return;
        case "save":
            return applySave(rider, context);
        case "pool":
            return applyPool(rider, context);
        case "damage":
            return applyDamageRider(rider, context);
        case "death":
            return applyDeath(rider, context);
        case "persistent-damage":
            return applyPersistent(rider, context);
        case "effect":
            return applyEffect(rider, context);
        case "condition":
            return applyCondition(rider, context);
        case "teleport":
            return applyTeleport(rider, context);
        case "strikes":
            return applyStrikes(rider, context);
        case "banish":
            return applyBanish(rider, context);
        case "heal":
            return applyHeal(rider, context);
        case "readout":
            return applyReadout(rider, context);
        case "toggle":
            return applyToggle(rider, context);
        case "counteract":
            return applyCounteract(rider, context);
        case "reaction":
            return offerReaction(rider, context);
        case "flat-check":
            return applyFlatCheck(rider, context);
        case "encasement":
            return Encasement.apply(rider, context);
        case "escape":
            return applyEscape(rider, context);
        case "expire":
            return applyExpire(rider, context);
        default: {
            // A type another module registered — Libra's Arms, a Soulbound's charge pool.
            const registered = RiderExtensions.applyType(apply.type);
            if (registered) return registered(rider, context);
            console.warn(`Isaac's Homebrew | ${context.item?.name}: unknown rider type "${apply.type}"`);
        }
    }
}

/* ------------------------------------------------------------------------------------------------ */
/*  Targets                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Who a rider lands on.
 *
 * `self` is the Technique that buffs its own caster — *Excalibur*, *Aiolos's Wings*. pf2e's own answer to
 * those is `system.selfEffect`, but that field exists on actions and feats and not on spells, so a Technique
 * that turns the Saint's arms into blades had its rule elements written straight onto the spell instead.
 * Rule elements on a spell are live the moment it is on the sheet, which made a 1-action Technique a
 * permanent passive: every Capricorn Saint had deadly d10 slashing fists from level 1, forever.
 *
 * Without an `area` a rider lands on the token the event named. With one, the rider is an aura tick: build
 * the shape on the origin's token and reuse the same containment and alliance filtering the cast-time area
 * targeting uses, so "enemies within 10 feet" means the same thing in both places.
 */
async function targetsFor(rider, context) {
    // `self` before `area` was the order for a year, and it silently emptied six auras.
    //
    // A `turn-start` / `turn-end` / `aura-tick` rider is dispatched once, with the origin's own token as
    // the target, and the area is what fans it out from there. Every Soulbound aura also says
    // `self: true` — which reads correctly, "this aura is mine" — and that short-circuit meant the
    // Bankai's emanation, the Full Release fear aura, Zanka no Tachi's ambient burn, Minami's ash,
    // Respira Absoluta and Thunderbolt Form all resolved against **the caster and nobody else**. Driven
    // live, a 13th-level Senbonzakura rolled its own Reflex save at its own DC and took its own 5d6.
    //
    // So an area always fans out. `self` keeps its meaning where there is no area: fire once, at me.
    if (rider.self && !rider.area) return context.originToken ? [context.originToken] : [];
    if (!rider.area) return context.target ? [context.target] : [];

    const originToken = context.originToken;
    if (!originToken?.object) return [];
    if (!canvas?.ready || canvas.scene?.id !== originToken.parent?.id) {
        console.warn(
            `Isaac's Homebrew | ${context.originActor?.name}: an area rider needs the origin's scene to be `
                + `the viewed one, and it is not. Skipped.`,
        );
        return [];
    }

    /**
     * An area that is somewhere else.
     *
     * Almost every area rider is centred on the caster, and `shapeFromArea` takes the origin token's
     * centre for both the anchor and the direction. Senbonzakura Kageyoshi is the exception the guide
     * builds a whole Bankai around:
     *
     * > You gain a **second 20-foot emanation** centred on a point within 60 feet … you can Sustain once
     * > per round to move the second emanation up to 30 feet. — guide §7A
     *
     * So an area may name an **anchor**: a key under the origin's `areaAnchors` flag holding the point it
     * was last placed at. Nothing remembered means nothing to tick, which is the right answer before the
     * blades have been sent anywhere.
     */
    /**
     * One rider, one or more shapes — and a creature caught by two of them is caught **once**.
     *
     * Senbonzakura Kageyoshi is two emanations at once, and guide §7A says "each enemy in **either**
     * emanation takes 5d6", not once per emanation. Written as two riders they were two separate turn
     * events, and a creature standing in both rolled twice and took damage twice. Written as one rider
     * with two shapes they go into a single Region, and `catchTokens` returns each token once.
     */
    const areas = [rider.area].flat().filter(Boolean);
    const anchors = RiderExtensions.anchorsFor(context.originActor);
    const shapes = [];
    for (const area of areas) {
        // `anchor: "target"` centres the shape on the creature that was struck, not on the caster.
        //
        // Murciélago's Refined Cero Oscuras "gains a 5-foot burst at the target dealing half damage to
        // others" — the only sensible centre is the thing it hit, and every rider area until now could
        // only be centred on the caster or on a point placed by hand. A splash is a common enough shape
        // that this belongs in the engine rather than in one Spirit.
        const centre = area.anchor === "target"
            ? context.target?.object?.center
            : area.anchor
                ? anchors[area.anchor] && { x: anchors[area.anchor].x, y: anchors[area.anchor].y }
                : originToken.object.center;
        // An anchored area that has never been placed has nowhere to be, which is the right answer
        // before the blades have been sent anywhere.
        if (!centre) continue;
        // A round area anchored on a creature is measured from that creature's **space**, not from the
        // point at the middle of it.
        //
        // Centred on the centre point, a 5-foot burst is a circle of one grid square's radius drawn from
        // the middle of one square: it covers the anchor's own space and stops exactly on the centre of
        // every neighbour. Cero Oscuras' Refined splash therefore caught precisely one creature — the one
        // it is defined to exclude — and driven live it reached nobody at all. An emanation measures from
        // the token's occupied space, which is what "within 5 feet of that creature" means everywhere
        // else in pf2e, so a burst anchored on the target is built as one. A cone or a line anchored the
        // same way keeps its own shape; only the round ones have a space to grow out of.
        const anchorToken = area.anchor === "target" ? context.target?.object : null;
        const round = ["burst", "cylinder", "emanation"].includes(area.type);
        const shape = anchorToken && round
            ? shapeFromArea({ ...area, type: "emanation", anchor: null }, anchorToken, centre)
            : shapeFromArea(area, originToken.object, centre);
        if (shape) shapes.push(shape);
    }
    if (shapes.length === 0) return [];

    const region = new CONFIG.Region.documentClass(
        { name: "Rider area", shapes, flags: { pf2e: { areaShape: areas[0].type } } },
        { parent: canvas.scene },
    );
    // `catchTokens` reads the origin actor off `config.item`, so hand it something item-shaped. The aura
    // belongs to the Cloth, not to any one Technique, so there is no real item to give it.
    // Who the area catches may be written inside `area` or in a sibling `areaTargeting`. Both spellings
    // are in the content — the sibling is the one an item uses for cast-time targeting, so it is what an
    // author reaches for — and reading only the first meant `affects: "enemies"` on all six Soulbound
    // auras was decoration. The sibling wins where both are present; it is the more specific statement.
    const aiming = { ...(areas[0] ?? {}), ...(rider.areaTargeting ?? {}) };
    const config = {
        item: { actor: context.originActor, name: context.originActor?.name ?? "", system: {} },
        affects: aiming.affects ?? "enemies",
        includesSelf: aiming.includesSelf === true,
        includesNeutral: aiming.includesNeutral === true,
        requireLineOfEffect: aiming.requireLineOfEffect !== false,
        predicate: [],
        maxTargets: Number(aiming.maxTargets) || 0,
    };

    const { caught } = catchTokens(region, config, originToken.object);
    let tokens = caught.filter((entry) => entry.checked).map((entry) => entry.token.document);
    // A splash is damage to everyone **else**. Cero Oscuras' Refined burst deals "half damage to other
    // creatures in it" — the creature it hit is the centre of the burst, not a second victim of it — so
    // an area anchored on the target can say to leave the target out.
    if (areas.some((area) => area.anchor === "target" && area.excludeAnchor !== false) && context.target) {
        tokens = tokens.filter((token) => token.id !== context.target.id);
    }
    return tokens;
}

/* ------------------------------------------------------------------------------------------------ */
/*  Apply handlers                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Move a creature, rather than telling the GM to.
 *
 * The module used to whisper every forced movement — "Teleported 250 feet in a direction of the Saint's
 * choice" — on the grounds that *which* 250 feet is a table decision. In practice it made a Technique's
 * headline effect the one thing that did not happen, and the whisper was read once and forgotten. The
 * direction is now taken from the geometry that is already on the table: a creature sent away goes along
 * the line from the caster to itself, which is the reading nobody argues with.
 *
 * The scene is a hard boundary. "One mile" is longer than any battle map, so the token stops at the last
 * legal square along that ray and the chat card says how far it actually travelled — an honest number
 * beats a silent no-op, and a creature pinned to the far edge of the map is out of the fight either way.
 */
async function applyTeleport(rider, context) {
    const token = context.target;
    const scene = token?.parent;
    if (!token || !scene) return;

    const feet = Number(rider.apply.distance) || 0;
    if (feet <= 0) return;

    // Some creatures do not move, and a forced movement has to honour that rather than shove the token
    // anyway and leave the table to argue. Who refuses, and why, is registered (`registerTeleportRefusal`).
    const refusal = RiderExtensions.teleportRefusal(token, context);
    if (refusal) {
        context.notes.push(`${token.name} ${refusal} — the movement is refused.`);
        return;
    }

    const gridSize = scene.grid.size;
    const perFoot = gridSize / (scene.grid.distance || 5);
    const from = context.originToken ?? token;

    // `TokenDocument#x` follows the *animation*, not the stored value: read it while a token is still
    // sliding — which it always is, a rider fires within a frame of the move that caused it — and every
    // number downstream is wrong by however far the tween has got. `_source` is the position the document
    // actually holds. This cost a wall of fractional coordinates before it was spotted.
    const at = (doc) => ({ x: doc._source?.x ?? doc.x, y: doc._source?.y ?? doc.y });
    const here = at(token);
    const origin = at(from);

    // Direction: away from the caster by default, back towards them when a Technique pulls.
    const sign = rider.apply.direction === "toward" ? -1 : 1;
    let dx = (here.x - origin.x) * sign;
    let dy = (here.y - origin.y) * sign;
    if (!dx && !dy) dx = 1; // Standing in the same square: pick an axis rather than divide by zero.
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;

    // The scene's playable rectangle, minus the token's own footprint.
    const rect = scene.dimensions?.sceneRect ?? { x: 0, y: 0, width: scene.width, height: scene.height };
    const maxX = rect.x + rect.width - token.width * gridSize;
    const maxY = rect.y + rect.height - token.height * gridSize;

    // "Pushed 15 feet" is a delta; "pushed to the end of the line" is a destination. The second is what a
    // line-shaped Technique means — a creature standing 20 feet along a 60-foot line travels 40, not 60 —
    // so `measure: "from-origin"` reads the distance as where the creature ends up rather than how far it
    // goes, and a creature already past that point is not dragged back.
    const away = Math.hypot(here.x - origin.x, here.y - origin.y) / perFoot;
    const travel = rider.apply.measure === "from-origin"
        // "Finish this far from the caster", whichever way the creature is travelling. A push reads it as
        // the distance still to cover — a creature 20 feet along a 60-foot line travels 40, not 60 — and a
        // pull reads it as the distance to close: *Rozan Ryū Hi Shō* carries what it critically hits to the
        // end of the flight, which means adjacent to the Saint, not sixty feet past them.
        ? Math.max(0, sign > 0 ? feet - away : away - feet)
        : feet;
    if (travel <= 0) return;

    const wanted = { x: here.x + ux * travel * perFoot, y: here.y + uy * travel * perFoot };
    const landed = {
        x: Math.clamp(wanted.x, rect.x, Math.max(rect.x, maxX)),
        y: Math.clamp(wanted.y, rect.y, Math.max(rect.y, maxY)),
    };
    const snapped = canvas?.grid?.getSnappedPoint
        ? canvas.grid.getSnappedPoint(landed, { mode: CONST.GRID_SNAPPING_MODES.TOP_LEFT_CORNER ?? 1, resolution: 1 })
        : { x: Math.round(landed.x / gridSize) * gridSize, y: Math.round(landed.y / gridSize) * gridSize };

    const travelled = Math.round(Math.hypot(snapped.x - here.x, snapped.y - here.y) / perFoot);
    if (travelled === 0) return;

    // A teleport blinks; it does not slide across the map past everything in between.
    await token.update(snapped, { animate: false });
    context.moves.push({ tokenUuid: token.uuid, x: here.x, y: here.y });

    // Say what happened, including when the map was the limiting factor. A note rather than a prompt: the
    // creature has already been moved, so this is the Technique reporting itself, not a job for the GM —
    // and "away" would be a lie for the half of them that drag.
    const towards = rider.apply.direction === "toward";
    const short = travelled < travel - (scene.grid.distance || 5);
    context.notes.push(
        short
            ? `${token.name} is pulled ${travelled} feet ${towards ? "closer" : "away"} — the `
                + `${Math.round(travel)}-foot ${towards ? "drag" : "throw"} ran out of map.`
            : `${token.name} is ${towards ? `dragged ${travelled} feet closer` : `thrown ${travelled} feet away`}.`,
    );
}

/**
 * A volley: one activity that makes several Strikes of its own accord.
 *
 * Seven Techniques say some variant of "make five unarmed Strikes". They were authored with a damage block
 * and no defence, which pf2e reads as *one* spell attack followed by *one* damage roll — so only one attack
 * happened, heightening scaled the roll rather than each Strike, and there was no multiple attack penalty
 * to speak of. This rolls the Strikes instead.
 *
 * Three things make it work, and each is a constraint pf2e imposed rather than a choice:
 *
 *  - **No penalty may be passed to the roll.** `AttackRollParams` takes a target and roll options and
 *    nothing else, so the cumulative −1 arrives as `FlatModifier`s on a short-lived effect, each predicated
 *    on the option this function emits for that Strike (`…:strike:2`, `:3`, …).
 *  - **`variants[0]` every time.** That is the un-penalised variant, which is exactly what "your multiple
 *    attack penalty does not increase during this activity" asks for.
 *  - **The volley needs every target at once.** A rider is normally applied once per target; this one is a
 *    `self` rider so it fires once, and reads the confirmed list off the payload. See `Sources.onActionUsed`.
 *
 * The one clause that cannot be honoured is "counts as three attacks for your multiple attack penalty
 * afterward": pf2e does not count a turn's attacks, the player picks the variant. That stays in the text.
 */
async function applyStrikes(rider, context) {
    const actor = context.originActor;
    const targets = context.targets ?? [];
    if (!actor || targets.length === 0) return;

    // Which Strike, or Strikes. A volley is usually one weapon repeated; *Athena's Arsenal: Overdrive* is
    // the exception the list form exists for — "six Strikes, one with a weapon from each of the six Arms".
    // A named weapon that is not on the sheet must not quietly become a different one. `findStrike` falls
    // back to the actor's first Strike when it cannot match, which is right for "unarmed" and disastrous
    // here: *Athena's Arsenal* struck twice with the same sword and never with the Shield, because a
    // Shield whose maximum Hit Points had outgrown its current ones is dropped from `prepareStrikes`
    // altogether. A named Strike is matched exactly or skipped, loudly.
    const sequence = Array.isArray(rider.apply.strikes)
        ? rider.apply.strikes.map((wanted) => ({ wanted, strike: findStrike(actor, wanted, { exact: true }) }))
        : null;
    const missing = sequence?.filter((entry) => !entry.strike).map((entry) => entry.wanted) ?? [];
    if (missing.length > 0) {
        context.notes.push(
            `${context.item?.name ?? "This activity"} could not find ${missing.join(", ")} on the sheet, `
                + `so ${missing.length === 1 ? "that Strike was" : "those Strikes were"} not made.`,
        );
    }
    const strikes = sequence?.filter((entry) => entry.strike).map((entry) => entry.strike) ?? null;
    const strike = strikes ? strikes[0] : findStrike(actor, rider.apply.strike ?? "unarmed");
    if (!strike?.variants?.length) {
        console.warn(`Isaac's Homebrew | ${context.item?.name}: no Strike to make`);
        return;
    }

    // Which variant to roll. `variants[0]` is the one with no multiple attack penalty, which is what
    // "your multiple attack penalty does not increase" needs and what every volley before Libra wanted.
    // *Rebound Rhythm* is the first that does not: its free Strike is explicitly "made at your current
    // multiple attack penalty" until 8th level, and the Strike that triggered it was an attack, so the
    // second variant is the honest default for the common case.
    const rawIndex = rider.apply.mapIndex ?? 0;
    const mapIndex = Math.max(0, Math.min(2, Number(resolveFromOrigin(rawIndex, context) ?? rawIndex) || 0));

    // The volley's own buff — the damage it deals, and the ladder of penalties it walks down.
    let effect = null;
    if (rider.apply.uuid) {
        const source = (await fromUuid(rider.apply.uuid))?.toObject();
        if (source) {
            applySubstitutions(source, rider.apply.substitutions, context);
            source._stats = foundry.utils.mergeObject(source._stats ?? {}, { compendiumSource: rider.apply.uuid });
            [effect] = await actor.createEmbeddedDocuments("Item", [source]);
        } else {
            console.warn(`Isaac's Homebrew | volley effect not found: ${rider.apply.uuid}`);
        }
    }

    const slug = rider.apply.option ?? "volley";
    const count = strikes ? strikes.length : strikeCount(rider, context, targets.length);
    let allHit = count > 0;
    let lastToken = null;
    try {
        for (let index = 0; index < count; index++) {
            const thisStrike = strikes ? strikes[index] : strike;
            // More Strikes than creatures is the normal case, not an error: "make four unarmed Strikes
            // against any creatures within 30 feet" is four Strikes whether one creature is in reach or
            // four. They are dealt round-robin so a single target takes all of them.
            const token = targets[index % targets.length];
            lastToken = token;
            const options = [`${slug}:strike:${index + 1}`];
            const variant = thisStrike.variants[mapIndex] ?? thisStrike.variants[0];
            await variant.roll({ target: token.object ?? null, options, createMessage: true });

            // Follow through: an attack that lands should deal its damage without a second prompt.
            const outcome = [...game.messages].reverse()
                .find((m) => m.flags?.pf2e?.context?.type === "attack-roll")?.flags?.pf2e?.context?.outcome;
            if (outcome === "criticalSuccess" && typeof thisStrike.critical === "function") {
                await thisStrike.critical({ target: token.object ?? null, options, createMessage: true });
            } else if (outcome === "success" && typeof thisStrike.damage === "function") {
                await thisStrike.damage({ target: token.object ?? null, options, createMessage: true });
            }
            if (outcome !== "success" && outcome !== "criticalSuccess") allHit = false;

            await followUp(rider, context, { token, outcome });
        }

        // "If both hit" — *Double Excalibur*'s whole reason for existing over a plain Strike twice. Fired
        // once, against whichever token the volley was aimed at, only when every Strike in it landed.
        if (allHit && rider.apply.onAllHit?.length > 0 && lastToken?.actor) {
            const options = riderOptions({
                originActor: context.originActor,
                targetActor: lastToken.actor,
                item: context.item ?? context.riderItem,
            });
            for (const [innerIndex, inner] of rider.apply.onAllHit.entries()) {
                if (!testPredicate(inner.predicate, options)) continue;
                try {
                    await applyOne(inner, {
                        ...context,
                        actor: lastToken.actor,
                        target: lastToken,
                        outcome: null,
                        riderIndex: [context.riderIndex, "onAllHit", innerIndex].flat(),
                    });
                } catch (error) {
                    console.error(`Isaac's Homebrew | ${context.item?.name}: an all-hit follow-up failed`, inner, error);
                }
            }
        }
    } finally {
        if (effect) await effect.delete();
    }
}

/**
 * The Strike a volley should roll.
 *
 * A slug names one weapon exactly — which is what *Athena's Arsenal* needs, since each of its six Strikes
 * is a different Arm. A category names a kind, which is how every earlier volley asked for "unarmed".
 * `libra` is the third question, and it is *Rozan Ryū Hi Shō*'s: "one unarmed Strike **or Libra weapon
 * Strike**", where the answer is whatever is in the Saint's hands — a Libra weapon if one is held, and the
 * fist if none is, because a Saint holding both Tridents cannot punch with either hand anyway.
 */
function findStrike(actor, wanted, { exact = false } = {}) {
    // A named selector — "Libra weapon", "spirit weapon" — answers for itself (`registerStrikeSelector`).
    const selector = RiderExtensions.strikeSelector(wanted);
    if (selector) return selector(actor, { exact });

    const actions = actor.system.actions ?? [];

    const found = actions.find(
        (action) => action.slug === wanted || action.item?.system?.category === wanted,
    );
    return found ?? (exact ? null : actions[0]);
}

/**
 * How many Strikes the volley makes.
 *
 * One per confirmed target was the first reading, and it is wrong for every Technique in this family
 * except by coincidence. *Crimson Flurry* is "four unarmed Strikes against any creatures within 30 feet":
 * the four is the Technique's, and the creatures are wherever the Saint chooses to send them. A Saint
 * facing one enemy makes four Strikes at it, not one.
 *
 * `count: "maxTargets"` reads the number off the same targeting flag the placement used, so the growth —
 * "at 15th and 19th level, add one Strike" — is stated once and counted once.
 */
function strikeCount(rider, context, available) {
    const asked = rider.apply.count;
    if (Number(asked) > 0) return Number(asked);
    if (asked !== "maxTargets") return available;

    const item = context.item ?? context.riderItem;
    const flag = item?.flags?.[LIB_ID]?.areaTargeting;
    if (!flag?.maxTargets) return available;

    const bonusSteps = bonusStepsFrom(context.originActor?.getRollOptions?.() ?? []);
    const grown = applyHeightening(
        { maxTargets: flag.maxTargets },
        flag.heightening,
        { baseRank: item.baseRank ?? item.system?.level?.value, castRank: item.rank, bonusSteps },
    );
    applyThresholds(grown, flag.heightening, effectiveLevel(context.originActor));
    return Math.max(1, grown.maxTargets);
}

/**
 * What one Strike of a volley earns beyond its damage.
 *
 * *Crimson Flurry* is the reason: "each Strike that hits applies one needle in addition to its normal
 * effect, and on any day your constellation is ascendant, Strikes that miss apply a needle too." Neither
 * half is a rider on the Technique — the Technique fires once and the Strikes fire four times — so the
 * follow-ups are authored inside the volley and applied here, per Strike, against the creature that Strike
 * was aimed at.
 */
async function followUp(rider, context, { token, outcome }) {
    const hit = outcome === "success" || outcome === "criticalSuccess";
    const key = hit ? "onHit" : "onMiss";
    const followUps = rider.apply[key] ?? [];
    if (followUps.length === 0 || !token?.actor) return;

    const options = riderOptions({
        originActor: context.originActor,
        targetActor: token.actor,
        item: context.item ?? context.riderItem,
    });
    for (const [innerIndex, inner] of followUps.entries()) {
        if (!testPredicate(inner.predicate, options)) continue;
        // A follow-up that only a *critical* hit earns. `onHit` catches both degrees, which is right for
        // the bleed a Libra Art applies on any landed cut and wrong for the push and the prone that only
        // *Setting the Tide*'s critical hit buys. `outcomes` means here exactly what it means everywhere
        // else in the engine, so nothing new has to be learned to write one.
        if (Array.isArray(inner.outcomes) && !inner.outcomes.includes(outcome)) continue;
        try {
            await applyOne(inner, {
                ...context,
                actor: token.actor,
                target: token,
                outcome: outcome ?? null,
                riderIndex: [context.riderIndex, key, innerIndex].flat(),
            });
        } catch (error) {
            console.error(`Isaac's Homebrew | ${context.item?.name}: a Strike's follow-up failed`, inner, error);
        }
    }
}

/**
 * Folding a creature out of the world for a while.
 *
 * *"Banished into folded space for 1 minute, then returns to the square it left."* This was a whisper, and
 * the whisper was the whole Technique: *Another Dimension* has no damage and no condition, so a GM who did
 * not act on the card watched a two-action Technique with an incapacitation trait do literally nothing.
 *
 * The mechanism is in `banish.mjs`, because taking a token off the board and putting an identical one back
 * is more bookkeeping than an apply handler should hold — and because Virgo's *Rikudō Rinne* and Aquarius'
 * *Freezing Coffin* are the same operation with different flavour and different clocks.
 */
async function applyBanish(rider, context) {
    const seconds = durationSeconds(rider.duration ?? rider.apply.duration);
    if (seconds <= 0) return;

    const record = await Banish.take(context.target, {
        seconds,
        label: rider.apply.label ?? `${context.item?.name ?? "Banished"}`,
        originActor: context.originActor,
        returnsToSquare: rider.apply.returnsToSquare !== false,
    });
    if (!record) {
        context.notes.push(`${context.target?.name ?? "The target"} is already folded away.`);
    }
}

/**
 * The Saint healing from what their Technique did.
 *
 * *Sekishiki Kisōen*'s blue flames feed: *"for each creature that fails its save, you regain 3 Hit Points,
 * to a maximum equal to your level per casting."* Both halves of that are unusual enough to need saying:
 *
 *  - **Per failure, not per cast.** It is a `self` rider on `save-rolled`, so it fires once for each
 *    creature that fails, and lands on the caster rather than on the creature. That combination is what
 *    forced the receipt key above to name both targets.
 *  - **A ceiling per casting**, which no single application can enforce on its own. The running total is
 *    kept on the chat message the cast produced, which is the only thing the separate applications share —
 *    and which is discarded with the message rather than accumulating on the actor forever.
 */
async function applyHeal(rider, context) {
    const actor = context.actor;
    const hp = actor?.hitPoints;
    if (!hp) return;

    // Dice rather than a number: *Shell of Hours* "regains 2d8 Hit Points", +2d8 every other rank (Stargazer
    // guide §5.2). Its own branch and its own words, so the Soulbound's capped, flame-worded heals are untouched.
    if (typeof rider.apply.formula === "string") {
        const dice = growByStep(rider.apply.formula, rider.apply.perStep ?? rider.apply.formula, riderSteps(rider, context));
        const roll = await new Roll(String(dice)).evaluate();
        const healed = Math.max(0, Math.min(roll.total, hp.max - hp.value));
        if (healed > 0) await actor.update({ "system.attributes.hp.value": hp.value + healed });
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: `${context.item?.name ?? "Rider"}: <strong>${actor.name}</strong> regains ${healed} Hit Points`,
        });
        return;
    }

    const source = context.item;
    const steps = stepsFor({
        baseRank: source?.baseRank ?? source?.system?.level?.value,
        castRank: source?.rank,
        bonusSteps: bonusStepsFrom(context.originActor?.getRollOptions?.() ?? []),
    });
    // A heal measured by what just happened rather than by a flat number — "redirect that damage to
    // yourself" gives the ally back exactly what landed on them, so the amount is the blow's.
    const declared = typeof rider.apply.value === "string" && isResolvable(rider.apply.value)
        ? Number(resolveFromOrigin(rider.apply.value, context))
        : Number(rider.apply.value);
    const each = (Number.isFinite(declared) ? declared : 0) + (Number(rider.apply.perStep) || 0) * steps;
    if (each <= 0) return;

    const cap = rider.apply.maxPerCast === "origin.level"
        ? (context.originActor?.level ?? Infinity)
        : (Number(rider.apply.maxPerCast) || Infinity);

    const message = context.message;
    const pool = Number(message?.flags?.[LIB_ID]?.healPool) || 0;
    const allowed = Math.max(0, Math.min(each, cap - pool));
    if (allowed <= 0) {
        // Said out loud rather than whispered. It is the Technique reporting its own ceiling, not a job for
        // the GM, and a GM-only whisper is exactly the shape this programme exists to remove.
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: context.item?.name ?? "Rider",
            content: `<p>The flames find nothing more to give — <strong>${actor.name}</strong> has drawn all `
                + `${cap} Hit Points this casting allows.</p>`,
        });
        return;
    }

    const healed = Math.min(allowed, hp.max - hp.value);
    if (healed > 0) await actor.update({ "system.attributes.hp.value": hp.value + healed });
    if (message) await message.update({ [`flags.${LIB_ID}.healPool`]: pool + allowed });

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: context.item?.name ?? "Rider",
        content: healed > 0
            ? `<p>The flames feed — <strong>${actor.name}</strong> regains ${healed} Hit Points `
                + `(${pool + allowed} of ${cap} this casting).</p>`
            : `<p><strong>${actor.name}</strong> is already at full Hit Points; the flames feed on nothing.</p>`,
    });
}

/**
 * Flipping a toggle the Saint would otherwise have to remember to flip.
 *
 * Gemini's *Swap Aspect* is a free action that changes which of two faces the Saint is wearing, and the
 * content reads that state through a toggleable `RollOption` with `light` and `shadow` suboptions — which
 * *Another Dimension* predicates on, because in Shadow it confuses instead of banishing. The action's own
 * text used to end with "remember to flip the Two Faces toggle on the Cloth feature so predicates follow
 * you", which is a whisper wearing a different hat: an action that does nothing but ask you to do the thing
 * yourself. Using the action now does it.
 *
 * `Actor#toggleRollOption` finds the rule element by domain and option and sets its selection, so nothing
 * here needs to know which item the toggle lives on — which matters, because it lives on the Cloth and the
 * action is granted by it.
 */

async function applyToggle(rider, context) {
    const actor = context.actor;
    const { domain = "all", option, cycle = [] } = rider.apply;
    if (!actor || !option) return;

    // A toggle with no suboptions is simply on or off, which is what Virgo's *Open Your Eyes* is: one
    // `RollOption` on **Effect: Om** that the whole Cloth predicates on, and an action whose entire content
    // used to be a request that the player go and flip it themselves.
    if (cycle.length === 0) {
        const wanted = rider.apply.value !== false;
        const result = await actor.toggleRollOption(domain, option, null, wanted);
        if (result === null) {
            context.prompts.push(`No "${option}" toggle to flip — set it by hand.`);
            return;
        }
        if (rider.apply.announce !== false) {
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                flavor: context.item?.name ?? "Toggle",
                content: `<p>${foundry.utils.escapeHTML(rider.apply.text ?? `${option} is now ${wanted ? "on" : "off"}.`)}</p>`,
            });
        }
        return;
    }

    const current = cycle.find((value) => actor.rollOptions?.[domain]?.[`${option}:${value}`]);
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    const result = await actor.toggleRollOption(domain, option, null, true, next);
    if (result === null) {
        context.prompts.push(`No "${option}" toggle to flip — set it on the Cloth by hand.`);
        return;
    }

    const label = rider.apply.labels?.[next] ?? next;
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: context.item?.name ?? "Toggle",
        content: `<p><strong>${actor.name}</strong> is now in their <strong>${label}</strong> aspect.</p>`,
    });
}

/**
 * A check against whatever is holding you — a shell, or a grip.
 *
 * `Encasement.apply` and `Escape.grant` both give the captive their own "Escape …" action carrying
 * exactly this rider, so using it rolls against the DC written on it at the moment they were caught — not
 * a fresh class DC read now, which would let the check track the caster's level past the casting that
 * trapped them.
 *
 * The two differ only in what breaking free destroys: an encasement's shell is a hazard that shatters,
 * and a condition rider's grip is the effect holding the condition on the sheet.
 */
async function applyEscape(rider, context) {
    const { statistic: slug, dc, hazardUuid } = rider.apply;
    const hazard = hazardUuid ? await fromUuid(hazardUuid) : null;

    // A shell names the hazard it is made of; a grip names the condition it holds you in. The roll is the
    // same check against the same DC either way, and only what breaking it releases differs.
    if (hazardUuid && !hazard) return;
    const statistic = hazard
        ? context.actor.getStatistic?.(slug ?? "athletics")
        : escapeStatisticFor(context.actor, slug);
    if (!statistic) return;

    // The ability's own name, kept on the action at grant time rather than recovered from the action's
    // title: a GM who renames "Escape Sai — Restrain" on a sheet should not change what the chat says.
    const held = hazard?.name ?? rider.apply.name ?? "the grip";
    const roll = await statistic.roll({ dc: { value: Number(dc) || 0 }, skipDialog: true, label: "Escape" });
    const outcome = DEGREES[roll?.degreeOfSuccess ?? -1];
    if (outcome === "success" || outcome === "criticalSuccess") {
        if (hazard) {
            await Encasement.destroy(hazard, { freed: true });
        } else {
            // `rider.apply` is the fallback for an Escape authored in content rather than granted here:
            // it carries the same `conditions`/`effectId` the granted flag would, and without it such an
            // action would roll, succeed, announce a release and perform none.
            await Escape.release(context.actor, context.item, rider.apply);
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: context.actor }),
                content: `<p><strong>${context.actor.name}</strong> breaks free of ${held}.</p>`,
            });
        }
    } else {
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: context.actor }),
            content: `<p><strong>${context.actor.name}</strong> struggles against ${held} and does `
                + `not break free.</p>`,
        });
    }
}

/**
 * Offering to take a mental effect off somebody.
 *
 * *Tenpōrin'in* ends with "when you cast this Technique, you may counteract one mental effect currently
 * affecting a creature in the area, using your Cosmo DC". Three words in that sentence make it awkward:
 * *may* (it is an option, not a consequence), *one* (across the whole area, not one each), and *currently*
 * (the list cannot be authored, it has to be read off the board at cast time).
 *
 * So this posts the list rather than a static choice card: every effect and condition carrying one of the
 * named traits, on every creature the emanation caught, one button each. Clicking rolls the check — see
 * `resolveCounteract`, which is where the counteract rules themselves live.
 */
async function applyCounteract(rider, context) {
    const traits = rider.apply.traits ?? ["mental"];
    const tokens = [...(context.targets ?? [])];
    if (rider.apply.includesSelf !== false && context.originToken) tokens.unshift(context.originToken);

    const buttons = [];
    const seen = new Set();
    for (const token of tokens) {
        const actor = token?.actor;
        if (!actor || seen.has(actor.uuid)) continue;
        seen.add(actor.uuid);
        for (const item of [...(actor.itemTypes.effect ?? []), ...(actor.itemTypes.condition ?? [])]) {
            const itemTraits = item.system?.traits?.value ?? [];
            if (!traits.some((trait) => itemTraits.includes(trait))) continue;
            buttons.push(
                `<button type="button" data-action="isaacs-hb-counteract" data-effect="${item.uuid}">`
                + `${foundry.utils.escapeHTML(`${actor.name}: ${item.name}`)}</button>`,
            );
        }
    }

    if (buttons.length === 0) {
        context.notes.push(`Nothing ${traits.join(" or ")} to counteract in the area.`);
        return;
    }

    // "Counteract each" (Lead Depth 4's Null Field, #91): every caught effect is rolled against at once rather than
    // offered one button at a time.
    if (rider.apply.auto === true) {
        const statistic = rider.apply.statistic ?? RiderExtensions.defaultStatistic(context.originActor);
        for (const uuid of buttons.map((b) => /data-effect="([^"]+)"/.exec(b)?.[1]).filter(Boolean)) {
            await resolveCounteract({ originUuid: context.originActor?.uuid ?? null, effectUuid: uuid,
                itemUuid: (context.item ?? context.riderItem)?.uuid ?? null, statistic, suppress: rider.apply.suppress ?? false });
        }
        return;
    }

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: context.originActor }),
        whisper: [...ownersAndGMs(context.originActor)],
        flavor: context.item?.name ?? "Counteract",
        content: `<p>${foundry.utils.escapeHTML(rider.apply.prompt ?? "Counteract one, if you wish.")}</p>`
            + `<div class="isaacs-hb-choice">${buttons.join(" ")}</div>`,
        flags: {
            [LIB_ID]: {
                counteract: {
                    originUuid: context.originActor?.uuid ?? null,
                    itemUuid: (context.item ?? context.riderItem)?.uuid ?? null,
                    // Falls back to the origin's own class, so a Soulbound's Seal the Art counteracts
                    // on the Reiatsu DC without the content having to name it.
                    statistic: rider.apply.statistic ?? RiderExtensions.defaultStatistic(context.originActor),
                    suppress: rider.apply.suppress ?? false,
                },
            },
        },
    });
}

/**
 * The counteract check itself, come back from a click on that card.
 *
 * pf2e models counteracting inside its own spell code and offers a module nothing to call, so the rules
 * are repeated here: roll the named statistic against a DC set by the effect's level, then compare ranks —
 * a critical success reaches three ranks above your own, a success one, a failure only below, and a
 * critical failure nothing. The effect's rank is read from its own level, which is what a pf2e effect
 * carries when it came from a spell, and the Technique's rank is the rank it was cast at.
 */
export async function resolveCounteract(payload) {
    const origin = await fromUuid(payload.originUuid);
    const effect = await fromUuid(payload.effectUuid);
    const item = payload.itemUuid ? await fromUuid(payload.itemUuid) : null;
    const actor = origin?.actor ?? origin;
    if (!actor || !effect) return;

    const slug = payload.statistic ?? RiderExtensions.defaultStatistic(actor);
    // Registered resolvers first — a borrowed class counteracts with its lender's statistic.
    const statistic = RiderExtensions.statistic(actor, slug);
    if (!statistic) {
        ui.notifications.warn(`${actor.name} has no ${slug} statistic to counteract with.`);
        return;
    }

    const targetRank = Math.max(1, Number(effect.system?.level?.value) || 1);
    // "Cannot be counteracted below Nth rank" — Null Shroud's darkness (#95). The floor rides on the effect, and a
    // counteract of lower rank fails without a roll.
    const floor = Number(effect.flags?.[LIB_ID]?.counteractFloor) || 0;
    if (floor && counteractRank(actor, item) < floor) {
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), flavor: item?.name ?? "Counteract",
            flags: { [LIB_ID]: { counteractFloor: { effect: effect.uuid, floor } } },
            content: `<p><strong>${effect.name}</strong> cannot be counteracted below rank ${floor} — a counteract rank of `
                + `${counteractRank(actor, item)} does not touch it.</p>` });
        return;
    }
    const roll = await statistic.roll({
        dc: { value: dcByLevel(effect.system?.level?.value ?? actor.level) },
        skipDialog: true,
        label: `Counteract — ${effect.name}`,
        extraRollOptions: [`${LIB_ID}:counteract`],
    });
    const outcome = DEGREES[roll?.degreeOfSuccess ?? -1];

    const ourRank = counteractRank(actor, item);
    const reach = { criticalSuccess: 3, success: 1, failure: -1, criticalFailure: -Infinity }[outcome] ?? -Infinity;
    const counteracted = targetRank <= ourRank + reach;
    // Anything that answers a counteract — Quartz Depth 3's charge (#89) — hears it here.
    Hooks.callAll("isaacsHb.counteracted", actor, { effect, counteracted, outcome });

    // Suppression rather than ending, for the things that are a STATE rather than a spell: a stance, a
    // polymorph, or whatever traits another module registered as one. Deleting a high-rank state with a
    // low-rank action is what a suppression clause exists to prevent. `suppress: "any"` parks whatever it
    // beats. How a state is parked, and for how long, is the registered suppressor's; without one, a
    // counteracted state is ended like anything else.
    const suppressible = payload.suppress === "any" || (payload.suppress && RiderExtensions.isSuppressible(effect));

    let suppression = null;
    if (counteracted && suppressible) {
        suppression = await RiderExtensions.suppress(effect, { actor, outcome, item });
        if (!suppression) await effect.delete();
        else if (!suppression.suppressed) {
            // A state whose rules carry grant-time state cannot be parked and must not be deleted either.
            ui.notifications.warn(`${effect.name} could not be suppressed without stranding a grant.`);
        }
    } else if (counteracted) {
        await effect.delete();
    }
    const suppressed = !!suppression?.suppressed;

    // Whatever a counteract costs or earns beyond its effect — a pool spent or refunded, a target left
    // off-guard — is registered (`registerAfterCounteract`).
    await RiderExtensions.afterCounteract({ actor, effect, item, outcome, counteracted, suppressible, suppressed });

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: item?.name ?? "Counteract",
        content: counteracted && suppression
            ? `<p><strong>${effect.name}</strong> is <strong>suppressed</strong> `
                + (suppression.until ?? `until the end of ${effect.actor?.name ?? "the target"}'s next turn`)
                + ", and cannot be re-entered until then.</p>"
            : counteracted
                ? `<p><strong>${effect.name}</strong> is counteracted and gone.</p>`
                : `<p><strong>${effect.name}</strong> holds — rank ${targetRank} against a counteract rank of `
                    + `${ourRank} on a ${OUTCOME_LABELS[outcome] ?? "failed check"}.</p>`,
    });
}

/** The counteract rank: the item's rank, or half the actor's level, plus whatever is registered. */
function counteractRank(actor, item) {
    return Math.max(1, Number(item?.rank) || Math.ceil((actor.level ?? 1) / 2)) + RiderExtensions.counteractRankBonus(actor, item);
}

/** pf2e's level-based DC table, which a module cannot import and which has not moved in four editions. */
function dcByLevel(level) {
    const table = [14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27, 28, 30, 31, 32, 34, 35, 36, 38, 39, 40, 42, 44, 46, 48, 50];
    const index = Math.clamp(Math.floor(Number(level) || 0) + 1, 0, table.length - 1);
    return table[index];
}

/** The Saint's own players and the GMs — the people a decision like this belongs to. */
function ownersAndGMs(actor) {
    const recipients = new Set(ChatMessage.getWhisperRecipients("GM").map((user) => user.id));
    for (const [userId, level] of Object.entries(actor?.ownership ?? {})) {
        if (level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER && userId !== "default") recipients.add(userId);
    }
    return recipients;
}

/**
 * A sense that reports rather than modifies.
 *
 * Cancer's Cloth passive — *"you automatically know the current Hit Point category of every creature within
 * 30 feet"* — is knowledge, not a bonus, and there is no rule element for knowledge. Under the old design
 * this would have been a note on the sheet. It is now a card at the top of the Saint's turn listing what
 * they know, addressed to the Saint's own players and the GM: the information is theirs, and putting it in
 * public chat would hand the table an NPC's hit points.
 */
async function applyReadout(rider, context) {
    // *Royal Funeral*'s "Special" is not a range scan — it is one creature, named at cast time and carried
    // on the marker effect this rider lives on (`context.item`, here, is that effect). Every other readout
    // below asks "who is nearby"; this one only ever asks "how is the one creature I was told to watch".
    if (rider.apply.trackedTarget) return reportTrackedHp(context.item, context);

    const originToken = context.originToken;
    if (!originToken?.object || !canvas?.ready) return;

    const range = Number(rider.apply.range) || 30;
    const rows = [];
    for (const token of canvas.tokens.placeables) {
        if (token.document.id === originToken.id) continue;
        if (token.document.hidden) continue;
        const actor = token.actor;
        if (!actor?.isOfType?.("creature")) continue;
        const distance = originToken.object.distanceTo?.(token);
        if (!Number.isFinite(distance) || distance > range) continue;
        rows.push(`<li><strong>${token.document.name}</strong> — ${hpCategory(actor)}</li>`);
    }

    const recipients = new Set(ChatMessage.getWhisperRecipients("GM").map((user) => user.id));
    for (const [userId, level] of Object.entries(context.originActor?.ownership ?? {})) {
        if (level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER && userId !== "default") recipients.add(userId);
    }

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: context.originActor }),
        whisper: [...recipients],
        flavor: rider.apply.title ?? context.item?.name ?? "The Boundary",
        content: rows.length > 0
            ? `<p>Within ${range} feet:</p><ul>${rows.join("")}</ul>`
            : `<p>Nothing living or dead within ${range} feet.</p>`,
    });
}

/**
 * The exact Hit Points of one marked creature, whispered to the Saint's players and the GM.
 *
 * Shared by *Royal Funeral*'s cast-time reveal and its marker effect's own `turn-start` rider — "from the
 * moment you cast until the end of the encounter" is one fact told twice, not two different mechanics.
 */
async function reportTrackedHp(item, context) {
    const uuid = item?.flags?.[LIB_ID]?.trackedTarget;
    const token = uuid ? await fromUuid(uuid) : null;
    const actor = token?.actor;

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: context.originActor }),
        whisper: [...ownersAndGMs(context.originActor)],
        flavor: item?.name ?? "Royal Funeral",
        content: actor?.hitPoints
            ? `<p><strong>${token.name}</strong> is at ${actor.hitPoints.value} / ${actor.hitPoints.max} Hit Points.</p>`
            : `<p>The rose's colour has faded &mdash; there is nothing left to read.</p>`,
    });
}

/** The four words the guide uses, and nothing finer: healthy, hurt, near death, dying. */
function hpCategory(actor) {
    if (actor.itemTypes?.condition?.some((c) => c.slug === "dying")) return "dying";
    const hp = actor.hitPoints;
    if (!hp?.max) return "unknown";
    if (hp.value <= 0) return "dying";
    if (hp.value >= hp.max) return "healthy";
    return hp.value <= hp.max / 4 ? "near death" : "hurt";
}

/**
 * The compendium address of a condition, for a `GrantItem` to point at.
 *
 * `ConditionManager.getCondition` hands back a *temporary* instance built from the compendium rather than
 * the stored document, so `condition.uuid` is null and only `sourceId` carries the address. Reading `uuid`
 * here produced `{ key: "GrantItem", uuid: null }` — a rule element that validates, creates the effect with
 * the right name and duration, and grants nothing. Every durationed condition in the content was therefore
 * inert while looking correct on the sheet: a creature wore "Crystal Net: Immobilized" and was not
 * immobilized. Riders without a duration were unaffected, because they take `increaseCondition` and never
 * build a grant at all — which is why this hid for so long, with 36 working riders around 20 broken ones.
 *
 * `uuid` is kept last rather than dropped: a future pf2e may well return a real document here.
 */
export function conditionUuidOf(condition) {
    return condition?.sourceId ?? condition?._stats?.compendiumSource ?? condition?.uuid ?? null;
}

/**
 * The receipt key one application of a rider set is remembered under.
 *
 * Keyed on both targets — the one the event was about, and the one this rider lands on — because they are
 * the same token for an ordinary rider and different for a `self` rider on a per-target event, which is
 * what *Sekishiki Kisōen* is: healing the caster once for each creature that fails its save. With the
 * event's target left out, the second failure wrote the same key as the first, matched its outcome, and was
 * dropped as a re-application — the Saint healed once no matter how many souls the flames took.
 *
 * A third thing has to be in the key, and Virgo is the Cloth that proved it. `Sources.onActionUsed` sends
 * one relay request for the self riders and a separate one per confirmed target — and when a Technique's
 * area `includesSelf`, the caster is *also* one of those confirmed targets, so their own token is
 * `payload.targetUuid` twice, under two different rider sets. Both requests produced the identical key
 * without this, so *Tenpōrin'in*'s self-only counteract offer wrote a receipt that the very next request —
 * the ordinary buff landing on the caster as an ally — matched and silently declined to re-apply. The Saint
 * got the counteract card and never their own aura. `selfOnly` is folded in to tell the two waves apart; it
 * is undefined for every event that never splits this way, so nothing else moves.
 */
export function receiptKeyFor(payload, targetId) {
    const eventTargetId = payload.targetUuid ? payload.targetUuid.split(".").pop() : "none";
    const wave = payload.selfOnly === true ? "self" : payload.selfOnly === false ? "targeted" : "any";
    return `${payload.event}:${wave}:${eventTargetId}:${targetId}`;
}

/**
 * A condition with a duration is not a condition — it is an effect that grants one.
 *
 * PF2e conditions carry no duration of their own, which is why the system's own timed conditions ship as
 * "Effect: X" items with a GrantItem rule. Applying a bare `slowed 1` for "1 round" would leave it on the
 * sheet until somebody remembered, which is the problem this feature exists to solve.
 */
async function applyCondition(rider, context) {
    const slug = rider.apply.slug;
    const value = Number(rider.apply.value) || null;

    /**
     * Taking one off, rather than putting one on.
     *
     * > **Kaidō — Mend the Weave.** At 9th level, also **remove** one of clumsy, enfeebled, or
     * > stupefied. — guide §6.3
     *
     * Sixty condition riders across both classes apply a condition and not one of them lifted one, so
     * the class's only healing kidō stopped at the hit points and the second half of its 9th-level
     * upgrade was a sentence in a description.
     *
     * `forceRemove` rather than a decrement: the clause says *remove*, and pf2e's `decreaseCondition`
     * otherwise steps a clumsy 3 down to clumsy 2 and calls it mended.
     */
    if (rider.apply.remove === true) {
        const held = context.actor?.itemTypes?.condition?.find((c) => c.slug === slug && c.active);
        if (!held) return;
        await context.actor.decreaseCondition(slug, { forceRemove: true });
        context.notes.push(`${context.actor.name} is no longer ${slug}.`);
        return;
    }

    if (!rider.duration) {
        // "cumulative to enfeebled 4" — the cap belongs on the increment, not on a predicate that would
        // have to be rewritten every time the ceiling moves. `max` is also the *declaration* that this
        // rider is meant to accumulate at all.
        const max = Number(rider.apply.max);
        if (max) {
            await context.actor.increaseCondition(slug, value ? { value, max } : { max });
            await grantEscape(rider, context, { conditions: [slug] });
            return;
        }

        /**
         * "Become frightened 1" sets the value; it does not add to it.
         *
         * `Actor#increaseCondition` is additive — `Math.clamp(currentValue + addend, 1, max)` — so a
         * Full Release aura ticking each round walked one creature to **frightened 8**, from a class
         * whose highest printed value is 2. Sixty durationless condition riders exist across both
         * classes and **fifty-seven** of them read as "become X": stunned 2, prone, blinded, doomed 1.
         * The three that genuinely accumulate all declare a `max`, which is why that is the signal.
         *
         * So: set to at least the value, never above what is already there. An unvalued condition —
         * prone, blinded — is simply applied if absent, which `increaseCondition` already does.
         */
        const existing = context.actor.itemTypes.condition.find((c) => c.slug === slug && c.active);
        if (!existing) {
            await context.actor.increaseCondition(slug, value ? { value } : {});
            await grantEscape(rider, context, { conditions: [slug] });
            return;
        }
        // The grip landed on someone another source has already immobilized. Nothing new is written to
        // the sheet, but they are still held by *this* ability and still owe an Escape against its DC —
        // without this the third of the three durationless paths is the one that silently grants none.
        await grantEscape(rider, context, { conditions: [slug] });
        const current = existing._source.system.value.value;
        if (current === null || !value || value <= current) return;
        await game.pf2e.ConditionManager.updateConditionValue(existing.id, context.actor, value);
        return;
    }

    const condition = game.pf2e.ConditionManager.getCondition(slug);
    if (!condition) {
        console.warn(`Isaac's Homebrew | unknown condition slug "${slug}"`);
        return;
    }

    const conditionUuid = conditionUuidOf(condition);
    if (!conditionUuid) {
        console.warn(`Isaac's Homebrew | condition "${slug}" has no resolvable uuid to grant`);
        return;
    }

    const label = value ? `${condition.name} ${value}` : condition.name;

    // A repeatable event with nothing to leave a receipt on. `damage-applied`, `strike-resolved` and the
    // rest are one-shot enough that a fresh grant each time was never wrong — but `aura-tick` fires again
    // every turn a creature stands in a lit dome, and a fresh "Freezing Shield: Slowed 1" each time left a
    // sheet wearing a dozen copies of the same one-round condition by the middle of a fight. Refreshing an
    // existing grant from the same item rather than creating a second one is the same call `refresh` on an
    // effect rider already makes, applied here because a plain condition grant has no such flag of its own.
    const source = context.item?.uuid ?? context.riderItem?.uuid ?? null;
    const standing = source
        ? context.actor.itemTypes.effect.find(
              (e) => e.name === `${context.item?.name ?? context.riderItem?.name ?? ""}: ${label}`
                  && e.flags?.[LIB_ID]?.rider?.source === source,
          )
        : null;
    // Only a grant still holding its condition is refreshed. One whose condition was taken off by hand — or
    // by a rider that removes it — is a hollow timer: refreshing it left the Flare's second blinding a no-op
    // on every creature the first one had caught. A hollow one is replaced.
    const holding = standing
        && Object.values(standing.flags?.pf2e?.itemGrants ?? {}).some((g) => context.actor.items.has(g.id));
    if (holding) {
        await standing.update({ "system.start.value": game.time.worldTime });
        return;
    }
    if (standing) await standing.delete();

    const grant = { key: "GrantItem", uuid: conditionUuid, allowDuplicate: false };
    if (value) grant.alterations = [{ mode: "override", property: "badge-value", value }];

    const [created] = await context.actor.createEmbeddedDocuments(
        "Item",
        [effectSource(label, [grant], rider, context)],
    );
    await grantEscape(rider, context, { conditions: [slug], effectId: created?.id ?? null });
}

/**
 * "(Escape against your Reiatsu DC)" — the half of a condition rider that nothing used to read.
 *
 * `escapeDc` has been authored on thirteen Soulbound condition riders since the class shipped and only
 * `encasement.mjs` ever looked at it, so those nine abilities held their target for the full duration
 * with no way out. The grant is called from every path that leaves the target held — including the one
 * that writes nothing because the condition is already there from elsewhere — and never from the refresh
 * path, where the grip is the same one and its Escape is already on the sheet.
 */
async function grantEscape(rider, context, release) {
    if (!rider.apply.escapeDc) return;
    await Escape.grant(rider, context, release);
}

/**
 * Take an effect back off, before its own timer would.
 *
 * *Zanhyō Ningyō* is the reason: "a doll of ice takes the blow … **the doll shatters**". The doll is
 * an effect granting resistance, and an effect with a one-round timer is a doll that absorbs every
 * blow landed in that round rather than the one it was spent on. "Shatters" is a real clause and it
 * needed something to say it with.
 *
 * Matches on the effect's own name and on the `<Ability>: <name>` form the condition riders generate,
 * so a rider can retire either kind without knowing which one made it.
 */
async function applyExpire(rider, context) {
    const wanted = [rider.apply.effect].flat().filter(Boolean);
    for (const name of wanted) {
        const gone = context.actor.itemTypes.effect.filter(
            (e) => e.name === name || e.name.endsWith(`: ${name}`),
        );
        for (const effect of gone) {
            if (context.actor.items.has(effect.id)) await effect.delete();
        }
    }
}

/** An authored effect from a pack — the riders that are more than a condition with a timer. */
async function applyEffect(rider, context) {
    const uuid = rider.apply.uuid;
    const source = (await fromUuid(uuid))?.toObject();
    if (!source) {
        console.warn(`Isaac's Homebrew | rider effect not found: ${uuid}`);
        return;
    }

    // A Scorpio needle is not a second effect, it is one more needle. `stack` walks the counter badge up
    // instead of leaving a target wearing fifteen identical icons — which is also what makes "the target
    // has at least 5 needles" a number the sheet can be asked for.
    const delta = Number(rider.apply.value) || 1;
    if (rider.apply.stack) {
        const existing = context.actor.itemTypes.effect.find((e) => e.sourceId === uuid);
        if (existing?.system.badge?.type === "counter") {
            const was = existing.system.badge.value;
            const value = Math.min(was + delta, existing.system.badge.max ?? Infinity);
            if (value === was) return;
            await existing.update({ "system.badge.value": value });
            context.adjustments.push({ itemId: existing.id, delta: value - was });
            await crossThresholds(source, was, value, context);
            return;
        }
    }

    // A rider that should grant its effect once and then stop asking. The Scorpio Zenith hands every ally
    // the needle-placing rider at the start of each of the Saint's turns, and without this each turn would
    // hand it to them again — six identical effects by the end of a fight.
    const standing = context.actor.itemTypes.effect.find((e) => e.sourceId === uuid);
    if (rider.apply.once && standing) return;

    // A choice that replaces yesterday's. *Athena's Temper* is re-chosen each morning, and two tempers on
    // one sheet would be two property runes on every Arm — which is not what "one of your choice" says.
    if (rider.apply.replace && standing) {
        await context.actor.deleteEmbeddedDocuments("Item", [standing.id]);
    }

    // An allowance that comes back rather than accumulating. Leo's Zenith grants extra actions "each turn",
    // which is a counter set back to its full value at the start of every turn — not a second copy of the
    // effect, and not one that runs out and stays out.
    if (rider.apply.refresh && standing) {
        const value = Number(source.system?.badge?.value);
        await standing.update({
            "system.start.value": game.time.worldTime,
            ...(Number.isFinite(value) ? { "system.badge.value": value } : {}),
        });
        return;
    }

    applySubstitutions(source, rider.apply.substitutions, context);
    source._stats = foundry.utils.mergeObject(source._stats ?? {}, { compendiumSource: uuid });
    source.system.start = startData();
    if (rider.duration) source.system.duration = durationData(RiderExtensions.duration(rider, context));
    source.system.context = contextData(context);
    source.flags = foundry.utils.mergeObject(source.flags ?? {}, riderFlags(rider, context));

    // "You know the target's exact Hit Points until the end of the encounter" is knowledge tied to *one*
    // creature, not a range — the marker effect this grants onto the caster carries that creature's uuid so
    // its own `turn-start` rider knows who to keep reading. `eventTarget` is what still remembers, since by
    // this point `context.target` is the caster's own token — see the note where it is set.
    if (rider.apply.trackedTarget) {
        source.flags = foundry.utils.mergeObject(source.flags, {
            [LIB_ID]: { trackedTarget: context.eventTarget?.uuid ?? null },
        });
    }

    const [created] = await context.actor.createEmbeddedDocuments("Item", [source]);

    // Whatever has to follow an effect's arrival — an Arm put into the hands that were just granted it.
    await RiderExtensions.afterEffect(rider, context, created);

    if (rider.apply.stack) {
        await crossThresholds(source, 0, Number(source.system?.badge?.value) || 0, context);
    }
    if (rider.apply.trackedTarget) await reportTrackedHp(created, context);
}

/**
 * What a counter does when it passes a number.
 *
 * Scorpio's Cloth is "at 5 needles the creature is enfeebled 1; at 10, blinded; at 14, stunned 2 and its
 * Strikes lose all runes", and needles arrive from five different places — the Signature Technique, the
 * free action, *Crimson Flurry*'s volley, and both skies. Writing the three thresholds into all five would
 * be five chances to write them differently, so they live on **Effect: Scarlet Needle** itself, next to the
 * badge they read, and every source that walks that badge up gets them for free.
 *
 * Only the crossing fires. `was < at <= now` means the fifth needle inflicts the enfeebled and the sixth
 * does not inflict it again — which matters, because `increaseCondition` would otherwise take a creature
 * to enfeebled 10 by the end of a fight. It also means a threshold is never applied retroactively when a
 * counter starts above it.
 */
async function crossThresholds(source, was, now, context) {
    const thresholds = source?.flags?.[LIB_ID]?.counterThresholds;
    for (const threshold of thresholdsCrossed(thresholds, was, now)) {
        try {
            await applyOne(threshold, context);
        } catch (error) {
            console.error(`Isaac's Homebrew | ${source.name}: threshold ${threshold.at} failed`, threshold, error);
        }
    }
}

/**
 * Persistent damage, optionally scaled by a counter the target is already carrying.
 *
 * Scorpio's Ascendant bleed is "1d6 per needle", and the needle count is on the target as a counter badge
 * put there by an earlier rider. Reading it back is what turns a static formula into the stacking one the
 * Cloth actually describes.
 */
/**
 * How many steps of its own growth this rider has earned.
 *
 * `perStep` normally means "one more die per heightening step". Ennetsu Jigoku's persistent fire is the
 * exception the guide writes out loud — *"+1d6 and +1 persistent die at **every other** increment"* —
 * two different rates in one sentence, so the rate has to be sayable. `perStepInterval: 2` is that: the
 * steps are counted the usual way and then divided, so a rank-7 cast earns six increments and three
 * extra dice rather than six.
 */
export function riderSteps(rider, context) {
    const source = context.item;
    const steps = stepsFor({
        baseRank: source?.baseRank ?? source?.system?.level?.value,
        castRank: source?.rank,
        bonusSteps: bonusStepsFrom(context.originActor?.getRollOptions?.() ?? []),
    });
    const interval = Math.max(1, Number(rider.apply?.perStepInterval) || 1);
    return Math.floor(steps / interval);
}

async function applyPersistent(rider, context) {
    const { damageType = "bleed", perCounter, max } = rider.apply;
    // Almost always a literal. *Piranha Rose*'s persistent bleed is the exception — "+1d6 at 9th, 13th and
    // 17th level" is a named-level ladder, not a per-heightening-step one, and it lives on the module's own
    // rider rather than `system.damage` precisely so a save's *success* can skip it outright instead of
    // pf2e's basic-save halving turning "negates" into "half a d6 of bleed".
    const rawFormula = rider.apply.formula ?? "1d6";
    const resolvable = typeof rawFormula === "object"
        || (typeof rawFormula === "string" && isResolvable(rawFormula));
    const formula = resolvable ? (resolveFromOrigin(rawFormula, context) ?? "1d6") : rawFormula;
    const count = perCounter ? Math.min(counterOn(context.actor, perCounter), Number(max) || Infinity) : 1;
    const counted = perCounter ? scaleFormula(formula, count) : formula;
    if (!counted) return;

    // Persistent damage heightens too, and did not. `applyDamageRider` has honoured `perStep` since it
    // was written; this path never read it, so Ennetsu Jigoku's "1d4" stayed 1d4 at every rank while the
    // headline dice climbed to 8d6 beside it — a flag on the content that nothing opened.
    //
    // Grown into one formula rather than appended as "1d4 + 3d4": a persistent-damage condition carries a
    // single formula, and pf2e's own recovery card reads it back.
    const perStep = rider.apply.perStep;
    const steps = perStep ? riderSteps(rider, context) : 0;
    const scaled = perStep && steps > 0 ? growByStep(counted, perStep, steps) : counted;
    if (!scaled) return;

    await inflictPersistent(context.actor, {
        formula: scaled,
        damageType,
        dc: Number(rider.apply.dc) || 15,
        flags: riderFlags(rider, context),
    });
}

/**
 * Put persistent damage on a creature, replacing whatever this module put there last.
 *
 * A stacking bleed is one growing wound, not a new one per needle — and a burning region that sets the same
 * creature alight on entry and again at the end of its turn should refresh the fire rather than light a
 * second one. Persistent damage a GM added by hand is never touched.
 *
 * Exported because the lingering areas of `targeting/lingering.mjs` need exactly this and nothing else
 * around it: they have no rider, no outcome and no message, only a patch of burning ground and whoever is
 * standing on it.
 */
export async function inflictPersistent(actor, { formula, damageType = "bleed", dc = 15, flags = {} }) {
    if (!formula || !actor) return;

    const ours = actor.itemTypes.condition.filter(
        (c) =>
            c.slug === "persistent-damage" &&
            c.system.persistent?.damageType === damageType &&
            c.flags?.[LIB_ID]?.rider,
    );
    if (ours.length > 0) {
        await actor.deleteEmbeddedDocuments("Item", ours.map((c) => c.id));
    }

    const source = game.pf2e.ConditionManager.getCondition("persistent-damage")?.toObject();
    if (!source) return;
    source.system.persistent = { formula, damageType, dc };
    source.flags = foundry.utils.mergeObject(source.flags ?? {}, flags);
    await actor.createEmbeddedDocuments("Item", [source]);
}

/**
 * Damage a rider deals directly — Pisces' roses, and the garden's tick.
 *
 * Rolled as a real `DamageRoll` rather than a flat number so immunities, weaknesses and resistances are
 * honoured on the way in, and posted to chat so the table can see where the poison came from. The roll
 * carries no originating item on purpose: `applyDamage` is wrapped as an event source, and an item here
 * would let a rider's own damage trigger another rider.
 */
async function applyDamageRider(rider, context) {
    const { damageType = "untyped", perStep = null, perCounter = null } = rider.apply;
    const DamageRoll = CONFIG.Dice.rolls.find((cls) => cls.name === "DamageRoll");
    if (!DamageRoll) {
        console.warn("Isaac's Homebrew | pf2e's DamageRoll is not registered; damage rider skipped.");
        return;
    }

    // The formula is usually a literal — "1d6" — but may itself be a resolvable, for the one shape none
    // of the others cover: a *granted action*'s damage that has to track a different Technique's own
    // heightening, because the action carries no rank of its own for `perStep` to scale from.
    const formula = typeof rider.apply.formula === "string" && isResolvable(rider.apply.formula)
        ? (resolveFromOrigin(rider.apply.formula, context) ?? "1d6")
        : (rider.apply.formula ?? "1d6");

    // Damage measured in something the target is already carrying. *Crimson Mirage* deals "1d6 mental per
    // needle it currently has at the end of each of its turns", so the die count is read off the needle
    // counter at the moment the turn ends rather than fixed when the mirage was cast — which is the whole
    // point of a Cloth that ramps. No needles is no damage, not one die.
    const counted = perCounter
        ? scaleFormula(formula, Math.min(counterOn(context.actor, perCounter), Number(rider.apply.max) || Infinity))
        : formula;
    if (!counted) return;

    // Damage that only happens on one outcome still has to heighten. *Titan's Break* deals its extra 4d8
    // on a critical failure alone, and that 4d8 grows a die per step like everything else — but a rider
    // sits outside `system.damage`, so pf2e never scales it. `perStep` is that growth, counted the same
    // way the Technique's own is: steps earned by rank, plus whatever the sky is worth today.
    const steps = perStep ? riderSteps(rider, context) : 0;
    const growth = perStep ? scaleFormula(perStep, steps) : null;
    const scaled = growth ? `${counted} + ${growth}` : counted;

    // "Success: half damage" on a Technique whose save is not a basic one. pf2e halves automatically only
    // for a basic save, and pf2e-toolbelt gates its per-outcome application on the same flag — so a
    // Technique with its own success/failure ladder had the roll made and the applying left to the GM.
    // Halving the total rather than the dice, which is what the rule means: `(10d8) * 0.5` reads as 10d8
    // then halved, where `5d8` would be a different distribution altogether.
    const multiplier = Number(rider.apply.multiplier);
    const expression = Number.isFinite(multiplier) && multiplier !== 1 ? `(${scaled}) * ${multiplier}` : scaled;

    // Damage measured as a share of what the target still has, rather than as dice.
    //
    // *Ittō Kasō*'s price is "damage equal to **half your current Hit Points**, unpreventable,
    // unreducible, unresistable and unredirectable, applied **after** the Art resolves" (R-15) — the
    // drawback that pays for its extra dice and its immunity-piercing fire. There is no formula for it:
    // the number is not known until the moment it lands, and none of the usual reductions may touch it.
    const share = Number(rider.apply.fractionOfCurrentHp);
    if (Number.isFinite(share) && share > 0) {
        const current = context.actor?.hitPoints?.value ?? 0;
        const amount = Math.floor(current * share);
        if (amount <= 0) return;
        const bare = await new DamageRoll(`(${amount})[${damageType}]`).evaluate();
        await bare.toMessage(
            { speaker: ChatMessage.getSpeaker({ actor: context.originActor }),
              flavor: `${context.item?.name ?? "Rider"} — ${context.actor.name} (unpreventable)` },
            { rollMode: game.settings.get("core", "rollMode") },
        );
        // `skipIWR` is the "unresistable" half, and it is the whole point of the clause.
        await context.actor.applyDamage({ damage: bare, token: context.target, skipIWR: true, final: true });
        return;
    }

    const roll = await new DamageRoll(`(${expression})[${damageType}]`).evaluate();
    const name = context.item?.name ?? context.originActor?.name ?? "Rider";
    await roll.toMessage(
        {
            speaker: ChatMessage.getSpeaker({ actor: context.originActor }),
            flavor: `${name} — ${context.actor.name}`,
        },
        { rollMode: game.settings.get("core", "rollMode") },
    );
    await context.actor.applyDamage({ damage: roll, token: context.target });
}

/**
 * "Or die."
 *
 * Everything else in this module treats outright death as a prompt, because whether a boss dies is a
 * table's call. A once-per-day Zenith capstone that says *or die* deserves better than a whisper — but
 * ending a player character without asking is not something a module should do on its own initiative. So
 * the setting draws the line where the stakes change: monsters die, player characters get asked.
 *
 * Reducing to 0 Hit Points rather than deleting anything: pf2e turns that into dying for a character, and
 * into a corpse for an NPC, which is what the rest of the system already knows how to handle.
 */
async function applyDeath(rider, context) {
    // Some deaths are checked *after* the damage rather than before it. *Sekishiki Tenryū Ha* reads
    // "As failure, and if the creature is at half Hit Points or fewer it dies" — the damage is the failure,
    // so the threshold is what it leaves behind. A `predicate` cannot express that: predicates are tested
    // against a snapshot taken before anything is applied, which is exactly what makes an escalation ladder
    // advance one step at a time. This reads the hit points as they are now, with the riders of one pass
    // applied in the order they are authored.
    const fraction = Number(rider.apply.hpFraction);
    if (Number.isFinite(fraction)) {
        const now = context.actor.hitPoints;
        if (!now?.max || now.value > now.max * fraction) return;
    }

    const mode = game.settings.get(LIB_ID, "automateDeath");
    const playerOwned = context.actor.hasPlayerOwner;

    if (mode === "off" || (mode === "npcs" && playerOwned)) {
        context.prompts.push(rider.apply.text ?? "It dies.");
        return;
    }

    const hp = context.actor.hitPoints;
    if (!hp) return;

    // Reaching zero is not the same as dying, and Cancer is the Cloth that proves it. The Ascendant Boon —
    // *"any creature you reduce to 0 Hit Points dies, with no save"* — fires on `damage-applied` at the
    // exact moment hit points hit zero, so an early return on `hp.value <= 0` made the whole boon a no-op:
    // the one condition under which it is supposed to fire was the one condition it refused. Dying is
    // therefore marked as well as inflicted, which is what pf2e's own defeated flag means and what stops a
    // character bleeding out over three rounds the guide says it does not get.
    if (hp.value > 0) await context.actor.update({ "system.attributes.hp.value": 0 });

    const combatant = context.target?.combatant;
    if (combatant && !combatant.isDefeated) await combatant.update({ defeated: true });
    // `toggleStatusEffect` is an Actor method in Foundry 14, not a TokenDocument one. Asking the token for
    // it found nothing and skipped in silence, so a creature the Yellow Spring took stood there at 0 hit
    // points with no mark on it at all.
    if (typeof context.actor.toggleStatusEffect === "function") {
        await context.actor.toggleStatusEffect("dead", { overlay: true, active: true });
    }

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: context.originActor }),
        flavor: context.item?.name ?? context.originActor?.name ?? "Rider",
        content: `<p><strong>${context.actor.name}</strong> is reduced to 0 Hit Points — ${
            rider.apply.text ?? "it dies."
        }</p>`,
    });
}

/**
 * A rider that makes the target roll for it.
 *
 * Virgo's Six Paths demands a Will save per unarmed hit, and Aquarius' cold asks for a Fortitude save on
 * every hit of cold damage. Neither has a chat card with save buttons to hang off — they happen mid-Strike
 * — so the save is rolled here against the Saint's own DC, and the nested riders are chosen by its result
 * exactly the way the outer ones were chosen by the event's.
 */
/**
 * A basic save's four degrees, written once instead of three times per ability.
 *
 * > **basic Reflex** — critical success: no damage · success: half · failure: full · critical failure:
 * > double.
 *
 * A self-rolled save — a `turn-start` aura tick, a `turn-end` emanation — is not a spell's own save, so
 * pf2e never applies that ladder for it: the rider has to carry it. Every one of them in the content
 * carried it by hand, and **not one doubled on a critical failure**; most did not halve on a success
 * either. Written out three times per ability, the missing fourth line is invisible.
 *
 * So `basic: true` on a save rider expands each nested **damage** rider that does not name its own
 * outcomes into the ladder. A damage rider that *does* name outcomes is left exactly as written — an
 * ability whose damage does not follow the basic ladder is a real thing and says so — and non-damage
 * riders are untouched, because "restrained on a critical failure" is not scaled by anything.
 *
 * The ladder **composes** with a multiplier the author wrote rather than replacing it. Three riders in
 * the content say a fraction of something and then ask for a basic save on top: Cero Oscuras' Refined
 * splash is *half* damage to the creatures around the one it hit, Apotheosis detonates for *half* the
 * Waning dice, and Senbonzakura's Gokei *doubles* the petal-blades. Overwriting the field made all three
 * of those words decoration — the splash dealt the cero's damage in full to every neighbour, and Gokei
 * did nothing at all — while reading correctly in the JSON beside the sentence it was meant to be.
 */
export function basicLadder(spec) {
    const riders = spec?.riders ?? [];
    if (spec?.basic !== true) return riders;

    const LADDER = [
        ["success", 0.5],
        ["failure", 1],
        ["criticalFailure", 2],
    ];
    return riders.flatMap((rider) => {
        const apply = rider?.apply;
        if (apply?.type !== "damage" || rider.outcomes) return [rider];
        const written = Number(apply.multiplier);
        const base = Number.isFinite(written) && written > 0 ? written : 1;
        return LADDER.map(([outcome, step]) => {
            const multiplier = base * step;
            const scaled = { ...apply, multiplier };
            // A multiplier of exactly 1 is the absence of one: `applyDamage` wraps the formula in
            // `(…) * n` for anything else, and `(10d6) * 1` on the card reads as though something had
            // been done to it.
            if (multiplier === 1) delete scaled.multiplier;
            return { ...rider, outcomes: [outcome], apply: scaled };
        });
    });
}


/**
 * A price paid out of the Reiatsu pool by something that is not a cast.
 *
 * Every other price in the class is charged by pf2e when a Technique is cast, which is why this is the
 * only place that needs it: *The Miracle*'s Release Technique is a **reaction**, and reactions are never
 * cast. "It costs a Reiatsu Point only the **first time each encounter**; after that it is free" is
 * therefore two things pf2e cannot do — spend a point outside a cast, and remember that it did.
 *
 * The ledger is the encounter's id rather than its round, and it is stamped **before** the point is
 * taken: a write that fails halfway leaves the Quincy having paid and not been charged again, which is
 * the kinder of the two mistakes. Out of an encounter there is nothing to be the first of, so nothing is
 * charged — the same reading `round-gate.mjs` takes of a per-round allowance outside combat.
 */
async function applyPool(rider, context) {
    const actor = context.originActor;
    const focus = actor?.system?.resources?.focus;
    if (!focus) return;

    /**
     * The pool can be paid *into*, not only out of.
     *
     * > **Unsealed.** … the first time each round you critically hit with your spirit weapon you regain
     * > 1 Reiatsu Point. — guide §4.8
     *
     * Two clauses in the class hand a point back, and until this one there was no apply type that could:
     * `pool` only ever spent. `gain` is a separate field rather than a negative `spend`, because a
     * negative spend falls through the `paid <= 0` guard below and does nothing at all — silently, which
     * is the failure this whole audit exists to catch.
     *
     * Clamped at the maximum, for the same reason Rising Pressure is: guide §4.2's "you can't exceed your
     * maximum pool" is the pool's rule, not any one refund's.
     */
    if (rider.apply.gain !== undefined) {
        const gain = Number(rider.apply.gain) || 0;
        const max = focus.max ?? 0;
        const gained = Math.min(gain, max - (focus.value ?? 0));
        if (gained <= 0) return;
        await actor.update({ "system.resources.focus.value": (focus.value ?? 0) + gained });
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: (context.riderItem ?? context.item)?.name ?? "Rider",
            content: `<p>${actor.name} regains <strong>${gained} Reiatsu Point${gained === 1 ? "" : "s"}</strong> — `
                + `${(focus.value ?? 0) + gained} of ${max}.</p>`,
        });
        return;
    }

    const spend = Number(rider.apply.spend) || 1;
    if (rider.apply.oncePerEncounter) {
        const stamp = game.combat?.started ? game.combat.id : null;
        if (!stamp) return;
        const key = `${(context.riderItem ?? context.item)?.id ?? "unknown"}-pool`;
        const ledger = actor.getFlag(LIB_ID, "poolSpent") ?? {};
        if (ledger[key] === stamp) return;
        await actor.setFlag(LIB_ID, "poolSpent", { ...ledger, [key]: stamp });
    }

    // Clamped rather than refused. The clause prices the first use and does not make it conditional, and
    // a Schrift that lets you be hit for free should not become one that refuses to notice.
    const paid = Math.min(spend, focus.value ?? 0);
    if (paid <= 0) return;
    await actor.update({ "system.resources.focus.value": (focus.value ?? 0) - paid });
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: (context.riderItem ?? context.item)?.name ?? "Rider",
        content: `<p>${actor.name} spends <strong>${paid} Reiatsu Point${paid === 1 ? "" : "s"}</strong> — `
            + `${(focus.value ?? 0) - paid} left.</p>`,
    });
}

async function applySave(rider, context) {
    return runSave(rider.apply, context);
}


/**
 * The save itself, apart from the rider that usually asks for it.
 *
 * *Royal Demon Rose*'s ground tick needs exactly this — roll a save, dispatch nested riders by its outcome —
 * with no rider or message anywhere: the region behavior in `targeting/lingering.mjs` has a patch of ground
 * and a token standing on it, not an item on an actor's sheet. Exported so it can build its own `context`
 * (real actor, a name-only stand-in for `item`) and call straight in, rather than fabricating a fake rider
 * just to hand back to `applySave`.
 */
export async function runSave(spec, context) {
    const { dc } = spec;
    // A save another module changes — a different save asked for, a penalty the caster chose to impose.
    const { statistic: slug, modifiers } = RiderExtensions.modifySave(spec.statistic, context);
    const statistic = context.actor.getStatistic?.(slug);
    if (!statistic) {
        console.warn(`Isaac's Homebrew | ${context.actor.name} has no ${slug} statistic`);
        return;
    }

    const value = RiderExtensions.resolveDC(dc, context);
    if (!value) return;

    const roll = await statistic.roll({
        dc: { value },
        skipDialog: true,
        item: context.item ?? null,
        origin: context.originActor ?? null,
        modifiers,
        extraRollOptions: [`${LIB_ID}:rider-save`],
    });
    const outcome = DEGREES[roll?.degreeOfSuccess ?? -1];
    if (!outcome) return;

    const nested = basicLadder(spec).map((r, index) => ({ rider: r, item: context.item, index }));
    const options = riderOptions({
        originActor: context.originActor,
        targetActor: context.actor,
        item: context.item,
    });
    for (const { rider: inner, index: innerIndex } of selectRiders(nested, { outcome, options })) {
        await applyOne(inner, { ...context, outcome, riderIndex: [context.riderIndex, "riders", innerIndex].flat() });
    }
}

function counterOn(actor, uuid) {
    const effect = actor.itemTypes.effect.find((e) => e.sourceId === uuid);
    const badge = effect?.system?.badge;
    return badge?.type === "counter" ? (badge.value ?? 0) : 0;
}

/** "1d6" with a count of 3 becomes "3d6". A count of zero means there is nothing to apply. */
function scaleFormula(formula, count) {
    if (count <= 0) return null;
    const match = /^(\d*)d(\d+)$/.exec(String(formula).trim());
    if (!match) return formula;
    return `${(Number(match[1]) || 1) * count}d${match[2]}`;
}

/** `base + perStep * steps`, for a number or for two dice formulas sharing the same die size. */
export function growByStep(base, perStep, steps) {
    if (typeof base === "number" && typeof perStep === "number") return base + perStep * steps;
    const baseDice = /^(\d*)d(\d+)$/.exec(String(base).trim());
    const perDice = /^(\d*)d(\d+)$/.exec(String(perStep).trim());
    if (baseDice && perDice && baseDice[2] === perDice[2]) {
        return `${(Number(baseDice[1]) || 1) + (Number(perDice[1]) || 1) * steps}d${baseDice[2]}`;
    }
    return base;
}

/* ------------------------------------------------------------------------------------------------ */
/*  Undo, sources, chat                                                                              */
/* ------------------------------------------------------------------------------------------------ */

async function undo(actor, receipt) {
    for (const { itemId, delta } of receipt.adjustments ?? []) {
        const item = actor.items.get(itemId);
        const value = item?.system?.badge?.value;
        if (typeof value !== "number") continue;
        const reverted = value - delta;
        if (reverted > 0) await item.update({ "system.badge.value": reverted });
        else await item.delete();
    }
    const present = (receipt.itemIds ?? []).filter((id) => actor.items.has(id));
    if (present.length > 0) await actor.deleteEmbeddedDocuments("Item", present);

    // A forced movement is as much a consequence as a condition is, so a hero point that turns the critical
    // failure into a success has to walk the creature back to where it was standing.
    for (const move of receipt.moves ?? []) {
        const token = await fromUuid(move.tokenUuid).catch(() => null);
        if (token?.documentName === "Token") await token.update({ x: move.x, y: move.y }, { animate: false });
    }
}

async function resolveContext(payload) {
    const message = payload.messageId ? game.messages.get(payload.messageId) : null;
    const item = payload.itemUuid ? await fromUuid(payload.itemUuid) : null;
    const target = payload.targetUuid ? await fromUuid(payload.targetUuid) : null;

    const originDoc = payload.originUuid ? await fromUuid(payload.originUuid) : null;
    const originActor = originDoc?.actor ?? originDoc ?? item?.actor ?? message?.actor ?? null;
    if (!originActor) return null;

    const originToken =
        originDoc?.documentName === "Token"
            ? originDoc
            : (originActor.getActiveTokens(true, true).at(0) ?? null);

    // The message's item only counts as a rider source when the message belongs to the origin. On
    // `strike-received` the message is the attacker's, and their weapon has nothing to say about the
    // roses growing on the person they hit.
    //
    // "Belongs to" is two questions, not one. A spell card is spoken by the caster, so the speaker is the
    // origin — but a **save message** is spoken by the creature that rolled it, and the Technique it is a
    // save against is still the origin's. pf2e stamps that on the roll itself, `context.origin.actor`, and
    // `Sources.onSaveMessage` sends the matching `originUuid`; without this second clause the Technique
    // that forced the save carries no riders, and a save rolled by pf2e's own button does nothing at all.
    // Narrowed to saves on purpose. pf2e stamps `context.origin` on an **attack roll** too, where it means
    // the attacker — and on `strike-received` the origin is the person they hit, so a looser test would be
    // one uuid collision away from letting an attacker's weapon carry the defender's riders. A save is the
    // one context where "the roll is about somebody else's item" is the normal case.
    const originIsSpeaker = message?.actor && message.actor === originActor;
    const context = message?.flags?.pf2e?.context;
    const originFlagsIt = context?.type === "saving-throw" && context.origin?.actor === originActor.uuid;
    const messageItem = originIsSpeaker || originFlagsIt ? itemFor(message) : null;

    // ...but it is the only thing the *predicate* can be about. "Any creature that hits you with an unarmed
    // or non-reach melee attack takes 1d6 poison" is a question about the attacker's weapon, and answering
    // it needs that weapon in the option set. Keeping the two apart is the whole point: `messageItem` is
    // "may this item carry riders", `eventItem` is "what was the event about". Collapsing them either lets
    // an attacker's weapon fire the defender's riders, or — as shipped — leaves Pisces with no `item:`
    // option at all, so its predicate could never pass and the roses never drew blood.
    const eventItem = itemFor(message);

    // The whole confirmed target list, for the one rider that needs it — see `applyStrikes`.
    const targets = payload.targetUuids
        ? (await Promise.all(payload.targetUuids.map((uuid) => fromUuid(uuid).catch(() => null)))).filter(Boolean)
        : [];

    const eventTarget = payload.eventTargetUuid ? await fromUuid(payload.eventTargetUuid) : null;
    const eventAlly = payload.eventAllyUuid ? await fromUuid(payload.eventAllyUuid) : null;

    return {
        message, item, messageItem, eventItem, originActor, originToken, target, targets,
        eventTarget, eventAlly,
        // What distinguishes one occasion from the next when there is no chat message to name it.
        dispatchId: payload.dispatchId ?? null,
        // What the blow was worth, for `event.damage.total`. Kept apart from the roll options
        // `describeDamage` builds, because a predicate wants a flag and a formula wants a number.
        eventDamage: payload.damage ?? null,
    };
}

/**
 * Write numbers from the origin into the effect before it is created.
 *
 * *The Twelve Arms* loans a weapon to an ally and lets them use **the Saint's** proficiency with it. pf2e
 * has exactly the rule element for that — `MartialProficiency`, with a `definition` predicate naming the
 * weapons and a rank — but the rank has to be the Saint's, and a resolvable value on the ally's effect
 * resolves `@actor` against the ally. So the number is baked in here, at hand-out time, which is also the
 * only moment it is knowable.
 */
function applySubstitutions(source, substitutions, context) {
    // Authored as a list of `{ path, value }`, never as an object keyed by path. Foundry expands dotted
    // *keys* into nested objects on any `update`, so `{ "system.rules.0.value": … }` silently becomes
    // `{ system: { rules: { 0: { value: … } } } }` the first time the item is written to an actor — and the
    // substitution then matches nothing. Keeping the path in a string value makes it survive the round trip.
    const list = Array.isArray(substitutions)
        ? substitutions
        : Object.entries(substitutions ?? {}).map(([path, value]) => ({ path, value }));

    for (const { path, value: expression } of list) {
        const value = resolveFromOrigin(expression, context);
        if (value === null) {
            console.warn(`Isaac's Homebrew | could not resolve "${expression}" for ${path}`);
            continue;
        }
        foundry.utils.setProperty(source, path, value);
    }
}

/**
 * Is this string a question rather than a formula?
 *
 * Two prefixes: `origin.` asks the caster something, `event.` asks the blow. Anything else is a literal
 * — `"2d6"`, `"1d4"` — and must stay one, because a typo inside a prefix should read as an unknown
 * expression rather than as dice nobody notices are missing.
 */
function isResolvable(expression) {
    return expression.startsWith("origin.") || expression.startsWith("event.");
}

function resolveFromOrigin(expression, context) {
    const { originActor } = context;
    if (typeof expression === "number") return expression;

    // A value that is not a question. Every other form here asks the origin something; a literal is the
    // answer already — *Athena's Temper*'s property rune is a slug the caster picked off a card, and
    // spelling it as a bare string would make a typo indistinguishable from an expression this does not
    // know, which is the silent-no-op shape this module keeps paying for.
    if (expression && typeof expression === "object" && "literal" in expression) return expression.literal;

    // A value that changes at named character levels rather than per heightening step. *Tenpōrin'in* is
    // "+1 status bonus… at 12th level the bonus becomes +2 and the immunity extends to confused; at 18th,
    // +3" — three numbers and one immunity keyed to the *caster's* level, on an effect that will be worn by
    // somebody else, so `@actor` on the recipient's sheet is the wrong actor to ask. It is baked in here,
    // at hand-out time, against the level a lit sky says the Saint is casting at.
    if (expression && typeof expression === "object" && expression.at) {
        const value = valueAtLevel(expression, effectiveLevel(originActor));
        return value === undefined ? null : value;
    }
    // A value that grows smoothly with the Technique's own heightening — "the damage increases by 1d8,
    // the resistance by 5, and the radius by 5 feet" is three numbers on the same per-step ladder
    // `origin.item.steps` already answers, not three named-level thresholds. Reuses the growth
    // `scaledDamage` in `targeting/lingering.mjs` does for a burning patch of ground, generalised to any
    // substitution path rather than one hand-written for `damage.perStep`.
    if (expression && typeof expression === "object" && "perStep" in expression) {
        const steps = resolveFromOrigin("origin.item.steps", context) ?? 0;
        const grown = growByStep(expression.base, expression.perStep, steps);
        // A ceiling on that growth. *The Twelve Arms* is the reason: "3 rounds at 6th, 10 rounds at 20th,
        // and 15 rounds is the hard maximum" — a 20th-level Saint on an Exalted day with Cloth Attunement
        // reaches twelve steps, and the guide stops the ladder there rather than letting it run.
        const ceiling = Number(expression.max);
        return Number.isFinite(ceiling) && Number.isFinite(Number(grown)) ? Math.min(Number(grown), ceiling) : grown;
    }
    // A value another module answers — a class's own ladder (`registerOriginValue`).
    const registered = RiderExtensions.originValue(expression, context);
    if (registered !== undefined) return registered;

    // An attack proficiency rather than a statistic. *The Twelve Arms* says an ally "uses **your** weapon
    // proficiency with it", and that is the Saint's *unarmed* rank — Master at 13th — not their Cosmo DC,
    // which reaches legendary and would hand a borrowed sansetsukon a rank the Saint does not have with it.
    const proficiency = /^origin\.proficiency\.([\w-]+)$/.exec(String(expression));
    if (proficiency) {
        return originActor?.system?.proficiencies?.attacks?.[proficiency[1]]?.rank ?? null;
    }

    /**
     * The roll option an attack against the creature chosen off a `pick` card carries.
     *
     * *Sight of the Balance* hands its +1 to the allies, but the clause is *"the next ally who attacks
     * **it**"* — and a pf2e effect cannot be about one creature unless that creature is named in its
     * predicate. pf2e publishes `self:signature:<signature>` on every actor and renames it `target:` on a
     * roll against them, so the name is baked in here, at hand-out time, the only moment the pick is known.
     */
    if (expression === "picked.as-target") {
        const signature = context.picked?.actor?.signature;
        return signature ? `target:signature:${signature}` : null;
    }

    const match = /^origin\.statistic\.([\w-]+)\.rank$/.exec(String(expression));
    if (match) return originActor?.getStatistic?.(match[1])?.rank ?? null;
    if (expression === "origin.level") return originActor?.level ?? null;

    /**
     * How much damage the event was, as a number.
     *
     * Every other expression here asks the **origin** something; this one asks the *blow*. The Balance's
     * Vollständig is why it exists — "when an ally within 60 feet would take damage, you may redirect
     * that damage to yourself" — and a redirect has to know how much. `describeDamage` publishes only
     * `rider:damage:dealt`, a flag, so a rider could ask *whether* damage landed and never *how much*.
     *
     * Zero is a real answer and is returned as one: a blow entirely absorbed still happened, and a
     * redirect of nothing should move nothing rather than fall back to a die.
     */
    if (expression === "event.damage.total") {
        const total = Number(context.eventDamage?.total);
        return Number.isFinite(total) ? total : null;
    }

    // How far the Technique itself has heightened, sky included — the growth a Strike inherits when the
    // Technique says "each Strike's damage increases by 1d6".
    if (expression === "origin.item.steps") {
        const item = context.item ?? context.riderItem;
        if (!item) return null;
        return stepsFor({
            baseRank: item.baseRank ?? item.system?.level?.value,
            castRank: item.rank,
            bonusSteps: bonusStepsFrom(originActor?.getRollOptions?.() ?? []),
        });
    }
    // Another Technique's own current damage — what it would roll for itself right now, rank and sky
    // both included, with an optional flat bonus added on top that does *not* itself scale.
    // `Golden Arrow: Named Shot` is why this exists: it is a *granted action*, not the spell it quotes, so
    // it carries no rank or base rank of its own for `origin.item.steps` to read — "Golden Arrow's damage,
    // plus an additional 8 dice" needs Golden Arrow's own ladder looked up by name, and the 8 dice are the
    // Zenith's, not Golden Arrow's, so they must not grow again with Golden Arrow's own heightening.
    const namedMatch = /^origin\.technique\.(.+)\.damage(?:\+(\d+d\d+))?$/.exec(String(expression));
    if (namedMatch) {
        const [, name, bonus] = namedMatch;
        const named = originActor?.itemTypes?.spell?.find((s) => s.name === name);
        const base = Object.values(named?.system?.damage ?? {})[0];
        if (!named || !base) return null;
        const steps = stepsFor({
            baseRank: named.baseRank ?? named.system?.level?.value,
            castRank: named.rank,
            bonusSteps: bonusStepsFrom(originActor?.getRollOptions?.() ?? []),
        });
        const scaled = scaleFormula(base.formula, 1 + steps);
        return bonus ? `${scaled} + ${bonus}` : scaled;
    }
    return null;
}

function effectSource(label, rules, rider, context) {
    const item = context.item ?? context.riderItem;
    const name = item?.name ?? context.originActor?.name ?? "Rider";
    return {
        type: "effect",
        name: `${name}: ${label}`,
        img: item?.img ?? "icons/svg/aura.svg",
        system: {
            description: {
                value: item?.uuid
                    ? `<p>Applied by @UUID[${item.uuid}]{${name}}${outcomeSuffix(context)}.</p>`
                    : `<p>Applied by ${name}${outcomeSuffix(context)}.</p>`,
            },
            duration: durationData(rider.duration),
            level: { value: item?.level ?? item?.system?.level?.value ?? 1 },
            start: startData(),
            tokenIcon: { show: true },
            traits: { value: [], rarity: "common" },
            context: contextData(context),
            rules,
        },
        flags: riderFlags(rider, context),
    };
}

function outcomeSuffix(context) {
    return context.outcome ? ` on a ${OUTCOME_LABELS[context.outcome]}` : "";
}

/**
 * When a rider's effect lets go.
 *
 * The default is `turn-end`, and it used to be `turn-start`. Both guides say the same thing in the
 * same words, over and over — "immobilized **until the end of its next turn**", "slowed 1 **until the
 * end of their next turn**", "off-guard **until the end of its next turn**" — and `turn-start` ends
 * an effect at the *start* of that turn, one step short. Driven live, a creature slowed by *Hyōryū
 * Senbi* got its full actions back before it had spent one of them.
 *
 * A rider that genuinely wants the shorter window says `expiry: "turn-start"` for itself. None of the
 * shipped content did, which is what made this a silent default rather than a decision.
 */

function durationData(duration) {
    return {
        expiry: duration?.expiry ?? "turn-end",
        sustained: false,
        unit: duration?.unit ?? "rounds",
        value: Number(duration?.value) || 1,
    };
}

function startData() {
    return { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null };
}

/** Lets the effect's own rules resolve against the Saint that caused it, the way an aura's would. */
function contextData({ originActor, originToken, item, actor, target }) {
    if (!originActor) return null;
    return {
        origin: {
            actor: originActor.uuid,
            token: originToken?.uuid ?? null,
            item: item?.uuid ?? null,
            spellcasting: null,
            rollOptions: [],
        },
        target: { actor: actor.uuid, token: target?.uuid ?? null },
        roll: null,
    };
}

function riderFlags(rider, { message, item, outcome }) {
    return {
        [LIB_ID]: {
            rider: {
                messageId: message?.id ?? null,
                outcome: outcome ?? null,
                source: item?.uuid ?? null,
                note: rider.note ?? "",
            },
        },
    };
}

/**
 * What a rider did, said out loud.
 *
 * The distinction from `postPrompts` is the whole no-whispers policy in one place: a prompt is something
 * the table still has to do, and a note is something that has already happened. Forced movement used to be
 * a prompt — "Teleported 250 feet in a direction of the Saint's choice" — and is now an event, so it is
 * announced to everyone rather than murmured to the GM, who no longer has anything to act on.
 */
async function postNotes({ notes, item, originActor, actor, outcome }) {
    const lines = notes.filter((text) => text).map((text) => `<li>${text}</li>`).join("");
    if (!lines) return;
    const name = item?.name ?? originActor?.name ?? "Rider";
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: originActor }),
        flavor: `${name} — ${actor.name}${outcome ? `, ${OUTCOME_LABELS[outcome]}` : ""}`,
        content: `<ul>${lines}</ul>`,
    });
}

/**
 * Riders nobody should pretend to automate.
 *
 * Being pushed 15 feet and knocked prone is two things: prone is a condition, and the push is a decision
 * about which 15 feet — which depends on walls, allies and where the caster was standing. Automating the
 * half that is a condition and whispering the half that is not is more honest than guessing.
 */
async function postPrompts({ prompts, item, originActor, actor, outcome }) {
    const lines = prompts.filter((text) => text).map((text) => `<li>${text}</li>`).join("");
    if (!lines) return;
    const name = item?.name ?? originActor?.name ?? "Rider";
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: originActor }),
        whisper: ChatMessage.getWhisperRecipients("GM").map((user) => user.id),
        flavor: `${name} — ${actor.name}${outcome ? `, ${OUTCOME_LABELS[outcome]}` : ""}`,
        content: `<p>Left to the table:</p><ul>${lines}</ul>`,
    });
}

/**
 * A rider the Saint has to choose.
 *
 * Which sense *Tenbu Hōrin* takes, which limb *The Sharpest Sword* severs — the condition is automatable,
 * the pick is not, and the pick belongs to the caster, who is often not whoever rolled. A chat card rather
 * than a dialog on purpose: it survives a reload, and it cannot be missed by someone looking at their
 * sheet at the wrong moment.
 */
/**
 * A rider whose target the owner picks off the board.
 *
 * Two clauses in the guide need this and neither could be written before it existed:
 *
 * > then **choose one enemy within 60 feet**: it takes 2d6 spirit damage — The Balance (S-72d)
 * > **Sight of the Balance:** at the start of each of your turns, **choose one enemy within 60 feet**
 * >   — The Balance, at Night (S-74e)
 *
 * `apply.type: "choice"` is a menu of **authored** options — which sense *Tenbu Hōrin* takes — and cannot
 * express "one of the creatures over there". So the buttons here are built from the board at post time,
 * the way the counteract card's are, and the chosen token travels on the button rather than as an index
 * into a rider.
 *
 * *Sight of the Balance* is the reason this is worth building rather than leaving to the table: it fires
 * at the **start of a turn**, with no trigger to point at, so `trigger: true` — the module's only other
 * way to reach somebody who is not the rider's target — has nothing to reach for. Without a picker the
 * whole clause is a card headed "Left to the table" and two effects that are never created.
 *
 * The candidate list honours `range` in feet and `affects` (`enemies`, `allies`, `all`), using pf2e's own
 * alliance test so "enemy" means what it means everywhere else. An empty list posts nothing: a card with
 * no buttons is a card that cannot be answered.
 */
async function postPick({ rider, index, item }, context, payload) {
    const spec = rider.apply ?? {};
    const origin = context.originToken?.object;
    if (!origin || !item?.uuid || !canvas?.ready) return;

    /**
     * Where the range is measured **from**.
     *
     * Usually the caster — "choose one enemy within 60 feet" of the Quincy. The Thunderbolt's arc is the
     * exception and reads the other way: *"one other creature within 15 feet of **the target**"*, a circle
     * drawn around the creature that was just struck. Whichever end it is, that creature is excluded from
     * its own list, which is what "**other**" means.
     */
    const centre = spec.from === "target" ? (context.target?.object ?? origin) : origin;
    const range = Number(spec.range);
    const affects = spec.affects ?? "enemies";
    const originActor = context.originActor;
    const candidates = canvas.tokens.placeables.filter((token) => {
        const actor = token.actor;
        if (!actor || token === origin || token === centre) return false;
        if (affects === "enemies" && !actor.isEnemyOf?.(originActor)) return false;
        if (affects === "allies" && !actor.isAllyOf?.(originActor)) return false;
        return !Number.isFinite(range) || distanceBetween(centre, token) <= range;
    });
    if (candidates.length === 0) return;

    const buttons = candidates
        .map((token) =>
            `<button type="button" data-action="isaacs-hb-rider-pick" data-token="${token.document.uuid}">`
            + `${foundry.utils.escapeHTML(token.name)}</button>`)
        .join(" ");

    const recipients = new Set(ChatMessage.getWhisperRecipients("GM").map((user) => user.id));
    for (const [userId, level] of Object.entries(originActor?.ownership ?? {})) {
        if (level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER && userId !== "default") recipients.add(userId);
    }

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: originActor }),
        whisper: [...recipients],
        flavor: item.name,
        content:
            `<p>${foundry.utils.escapeHTML(spec.prompt ?? "Choose a creature.")}</p>`
            + `<div class="isaacs-hb-choice">${buttons}</div>`,
        flags: {
            [LIB_ID]: {
                pick: {
                    riderItemUuid: item.uuid,
                    riderIndex: index,
                    originUuid: context.originToken?.uuid ?? originActor?.uuid,
                    messageId: payload.messageId ?? null,
                    itemUuid: payload.itemUuid ?? null,
                    outcome: context.outcome ?? payload.outcome ?? null,
                },
            },
        },
    });
}

/**
 * The creature came back from the card; apply what the rider says to it.
 *
 * Mirrors `resolveReaction` exactly, including why: the payload carries an **address**, not rider data, so
 * the GM re-reads the ability rather than trusting a client to describe it.
 */
export async function applyPick(payload) {
    const context = await resolveContext(payload);
    if (!context) return;

    const item = await fromUuid(payload.riderItemUuid);
    const rider = riderAt(item, payload.riderIndex);
    const nested = rider?.apply?.riders ?? [];
    if (nested.length === 0) return;

    const picked = payload.pickedUuid ? await fromUuid(payload.pickedUuid) : null;
    const actor = picked?.actor;
    if (!actor) return;

    const origin = await fromUuid(payload.originUuid);
    const originActor = origin?.actor ?? origin;

    const work = {
        // `picked` survives the loop below, which re-points `target` at each nested rider's own
        // recipients — see `picked.as-target` in `resolveFromOrigin`.
        ...context, originActor, actor, target: picked, picked, item,
        outcome: payload.outcome ?? null,
        adjustments: [], prompts: [], notes: [], choices: [], picks: [], moves: [],
    };
    /**
     * Each nested rider resolves its **own** targets, which is what lets one pick hand out two things to
     * two different sets of people.
     *
     * *Sight of the Balance* is exactly that: a −2 for the creature chosen, and a +1 for the allies who
     * are about to attack it. Applying the nested riders straight to the picked creature — which is what
     * `resolveReaction` does, and what this did first — put both halves on the enemy, and the allies'
     * bonus landed on the one creature it was supposed to be used *against*.
     *
     * `targetsFor` is the same function `applyRiders` uses, so `self`, `area` and a bare rider all mean
     * here what they mean everywhere else.
     */
    for (const [inner, entry] of nested.entries()) {
        const scoped = { ...work, riderIndex: [payload.riderIndex, "riders", inner].flat() };
        for (const each of await targetsFor(entry, scoped)) {
            const actorFor = each?.actor;
            if (!actorFor) continue;
            await applyOne(entry, { ...scoped, actor: actorFor, target: each });
        }
    }
    if (work.notes.length > 0) await postNotes(work);
    if (work.prompts.length > 0) await postPrompts(work);
}

async function postChoice({ rider, index, item, target, actor }, context, payload) {
    const options = rider.apply.options ?? [];
    if (options.length === 0 || !item?.uuid) return;

    /**
     * An option may say when it is available.
     *
     * The Miracle's spend is five buttons — one per point — and a character holding four points must not
     * be offered the fifth. The index travels on the button, so the buttons are **filtered rather than
     * renumbered**: dropping an option would silently shift every later one onto the wrong rider.
     *
     * Tested against the same snapshot the riders were chosen from, so "at least five points" means what
     * it meant a moment ago rather than what it means after the first button was pressed.
     */
    const chooser = riderOptions({
        originActor: context.originActor,
        targetActor: (actor ?? context.actor),
        item,
    });
    const offered = options
        .map((option, optionIndex) => ({ option, optionIndex }))
        .filter(({ option }) => testPredicate(option.predicate, chooser));
    if (offered.length === 0) return;

    const buttons = offered
        .map(
            ({ option, optionIndex }) =>
                `<button type="button" data-action="isaacs-hb-rider-choice" data-option="${optionIndex}">`
                + `${foundry.utils.escapeHTML(option.label ?? `Option ${optionIndex + 1}`)}</button>`,
        )
        .join(" ");

    const recipients = new Set(ChatMessage.getWhisperRecipients("GM").map((user) => user.id));
    for (const [userId, level] of Object.entries(context.originActor?.ownership ?? {})) {
        if (level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER && userId !== "default") recipients.add(userId);
    }

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: context.originActor }),
        whisper: [...recipients],
        flavor: `${item.name} — ${(actor ?? context.actor)?.name}`,
        content:
            `<p>${foundry.utils.escapeHTML(rider.apply.prompt ?? "Choose one.")}</p>`
            + `<div class="isaacs-hb-choice">${buttons}</div>`,
        flags: {
            [LIB_ID]: {
                choice: {
                    riderItemUuid: item.uuid,
                    riderIndex: index,
                    // The entry's own target first — where the choice actually happened — and only the
                    // outer context's as a fallback, for the ordinary shape where they were always the same.
                    targetUuid: target?.uuid ?? context.target?.uuid ?? payload.targetUuid,
                    originUuid: context.originActor?.uuid,
                    messageId: payload.messageId ?? null,
                    itemUuid: payload.itemUuid ?? null,
                    outcome: context.outcome ?? null,
                },
            },
        },
    });
}
