import { LIB_ID } from "../id.mjs";

export const OUTCOMES = ["criticalSuccess", "success", "failure", "criticalFailure"];

export const OUTCOME_LABELS = {
    criticalSuccess: "critical success",
    success: "success",
    failure: "failure",
    criticalFailure: "critical failure",
};

/**
 * The events a rider can key off.
 *
 * `save-rolled` is the original and stays the default, so the 26 Techniques written before this existed
 * mean exactly what they meant before. The rest were added to close the last three rows of backlog §1.
 */
export const EVENTS = [
    "save-rolled", // a target rolled its save against a Technique
    "strike-resolved", // this actor's Strike resolved against a target
    "strike-received", // a Strike resolved against this actor
    "action-used", // this actor posted an action or ability to chat
    "damage-applied", // damage from this actor's item landed on a target
    "damage-received", // damage from someone else's item landed on this actor
    "ally-damaged", // damage landed on an ally of this actor, within the rider's own range
    "turn-end", // this actor's turn ended
    "turn-start", // this actor's turn began
    "aura-tick", // a creature entered this actor's aura, or ended its turn inside it
];

export const DEFAULT_EVENT = "save-rolled";

/** The Technique a message came from. Damage messages carry the spell too, which is where saves land. */
export function itemFor(message) {
    return message?.item ?? null;
}

/**
 * The message contexts that mean "an ability was used", as opposed to "a die was rolled about one".
 *
 * An ability card carries no context at all (`ItemPF2e#toMessage` sets only `flags.pf2e.origin`); a spell
 * with a save carries `spell-cast`; a self-applied effect carries `self-effect`. Everything else in pf2e's
 * context union — `saving-throw`, `attack-roll`, `damage-roll`, `damage-taken`, `area-fire` — is the result
 * of a roll.
 */
const USE_CONTEXTS = new Set([undefined, null, "spell-cast", "self-effect"]);

/**
 * Was this message an ability being *used*?
 *
 * This is a loop guard, and it is load-bearing. pf2e stamps `flags.pf2e.origin` — the item — onto every
 * check it rolls (`check.ts`, `origin: item?.getOriginData()`), and `ChatMessagePF2e#item` reads it back.
 * So a save that a rider *itself* forced produces a message whose `item` is the very ability that forced
 * it. Treating that as another use of the ability makes the ability re-trigger itself: Aurora Execution
 * forces a Fortitude save, the save's message looks like Aurora Execution being used, which forces another
 * save, forever — rolling 16d6 at the target each time round.
 *
 * An allow-list rather than a deny-list, so a context type added by a future pf2e release fails to a missed
 * rider rather than back to that loop. The roll check is the same invariant from the other side: a card has
 * no dice attached, every roll result does.
 */
export function isAbilityUse(message) {
    if (!message) return false;
    if (message.rolls?.length) return false;
    return USE_CONTEXTS.has(message.flags?.pf2e?.context?.type);
}

/** Every rider declared on an item, or an empty list. */
export function ridersOn(item) {
    const riders = item?.flags?.[LIB_ID]?.riders;
    return Array.isArray(riders) ? riders : [];
}

/**
 * A rider by its address, wherever it is nested.
 *
 * Most riders are top-level, so an address is just their index and `applyChoice` — the only thing that
 * ever needs to *re-find* a rider rather than being handed one directly — used a bare number for as long as
 * that held. *Double Excalibur*'s sever is the first choice authored inside a `strikes` rider's `onAllHit`,
 * and a bare index could only ever re-find the outer `strikes` rider, not the choice nested inside it — the
 * button posted correctly and clicking it silently did nothing. An address is now a path: `[0]` for an
 * ordinary top-level rider, `[0, "riders", 1]` for the second rider a `save` earns, `[0, "onAllHit", 0]` for
 * the first of a volley's all-hit follow-ups. Whoever descends into a rider's own nested lists is what
 * builds the longer address; nothing else needs to know the shape changed.
 */
export function riderAt(item, address) {
    const top = ridersOn(item);
    const path = Array.isArray(address) ? address : [address];
    let node = top[path[0]];
    for (let i = 1; i < path.length; i += 2) {
        node = node?.apply?.[path[i]]?.[path[i + 1]];
    }
    return node;
}

export function eventOf(rider) {
    return rider?.event ?? DEFAULT_EVENT;
}

/**
 * Events whose rider can only be on the item the event is about.
 *
 * "When this ability is used" names one ability. Searching the rest of the actor's sheet for it means a
 * Saint holding two Zenith activities fires both from one — two Fortitude saves and 16d6 twice for a single
 * use — because neither rider has a predicate to tell them apart, and neither should need one.
 *
 * `save-rolled` is the same argument, and it was left out of this set for one release. A save rider says
 * "a creature that fails *this* Technique's save is drained 1"; it names one Technique the way `action-used`
 * names one ability. With the wide search, every Technique on the sheet answered every save: *Scarlet
 * Needle* handed out *Crimson Mirage*'s dazzled and *Antares*' "it dies", *Sekishiki Konsō Ha* handed out
 * *Meikai Ha*'s drained, and *Another Dimension* handed out *Mavros Eruption Clast*'s blinded. Predicates
 * could not save it: 56 of the 57 save riders in the content carry none, and none of them should have to.
 *
 * The other events genuinely do need the wider search, which is why this is a list rather than a rule: a
 * Strike's `message.item` is the fist or the weapon, while "each time you hit with an unarmed Strike…" is
 * written on a Cloth's Ascendant effect, and only the predicate can narrow that back down.
 *
 * `aura-tick` joins them for the same reason `action-used` does: the item named is not a guess, it is
 * `Sources.onAuraTick` reading `flags.pf2e.aura.origin` straight off the marker pf2e's own Aura rule element
 * granted, and resolving one specific effect on that actor by hand — see `sources.mjs`. Searching the whole
 * actor would let a Saint who somehow carries two auras answer each other's ticks.
 */
const ITEM_SCOPED_EVENTS = new Set(["action-used", "save-rolled", "aura-tick"]);

/**
 * A spell that rolls its **own** attack is item-scoped for `strike-resolved` too.
 *
 * The wide search above exists for a Technique that says "make one Strike": *Ikkotsu*, *Hitotsume:
 * Nadegiri*, *Shūkei: Hakuteiken*. The Strike is made with a weapon, so the message's item is the
 * weapon and the rider is on the spell — only the wider search can bring the two together.
 *
 * A spell with the **attack** trait is the opposite case. It rolls the attack itself, so "on a hit"
 * names one roll: its own. Left in the wide search, Cero Oscuras' Refined splash detonated on every
 * attack its owner made — driven live, casting *Lanza del Relámpago* fired the cero's burst as well as
 * the lance's, twice over, against creatures the cero was never aimed at. *Galvano Javelin*'s stunned 1
 * is the same shape of mistake waiting on any Soul Reaper who has it on the sheet.
 *
 * `strike-received` is deliberately not included: those riders are collected from the *defender*, whose
 * items have nothing to do with the attacker's message item, and *Zanhyō Ningyō* is exactly such a
 * spell — a reaction to being hit.
 */
/**
 * Where a cast records which Technique the caster's next Strike belongs to.
 *
 * The flag itself is written and swept by `riders/strike-technique.mjs`; it is named here because
 * `scopedAway` is the one thing that reads it, and because this file may not import that one — the
 * dependency runs the other way, and a ring closed at evaluation time is how this module lost a whole
 * `setup` hook once already.
 */
export const STRIKE_TECHNIQUE_FLAG = "strikeTechnique";

/** The id, on the sheet, of the Technique whose Strike is pending — or null. */
export function armedTechniqueId(actor) {
    return actor?.getFlag?.(LIB_ID, STRIKE_TECHNIQUE_FLAG)?.itemId ?? null;
}

function scopedAway(source, item, event, actor) {
    if (event !== "strike-resolved") return false;
    if (source?.type !== "spell" || source.id === item?.id) return false;
    if (source.system?.traits?.value?.includes?.("attack")) return true;

    /**
     * A Technique that says "make one Strike" fires only for the Strike it paid for.
     *
     * This is the other half of the same wide search and it was much the larger one. *Ryūsenka*,
     * *Ikkotsu*, *Shitonegaeshi*, *Hitotsume: Nadegiri* and *Shūkei: Hakuteiken* carry no attack trait, so
     * nothing above catches them, and every one of them fired on **every** Strike their owner made, cast
     * or not. Driven live: one bare critical Strike from a Soul Reaper who had cast nothing applied both
     * *Ryūsenka: Off-Guard* and *Hitotsume: Nadegiri: Off-Guard*, and the pool read 1 point before and 1
     * after. Guide §1.4 is one line — "Every technique costs 1 Reiatsu Point".
     *
     * The cast leaves a marker and the first Strike spends it. Note the direction: this **excludes**, so
     * an actor with no marker collects no spell riders rather than all of them, and a Strike made without
     * a Technique behind it is just a Strike.
     */
    const id = source.original?.id ?? source.id;
    return armedTechniqueId(actor) !== id;
}

/**
 * Gather every rider for an event, from every item that could be carrying one.
 *
 * A save rider lives on the Technique that forced the save, so the message's item is the obvious source.
 * A strike rider does not — see `ITEM_SCOPED_EVENTS` above for which events search wider and why.
 *
 * Returns `[{ item, rider, index }]` — the index is needed later to name one rider back to the GM without
 * sending the rider itself.
 */
export function collectRiders({ event, item, actor }) {
    const found = [];
    const seen = new Set();
    const sources = [];
    const candidates = ITEM_SCOPED_EVENTS.has(event) ? [item] : [item, ...(actor?.items ?? [])];
    for (const candidate of candidates) {
        if (!candidate || seen.has(candidate.id)) continue;
        seen.add(candidate.id);
        if (scopedAway(candidate, item, event, actor)) continue;
        sources.push(candidate);
    }

    for (const source of sources) {
        ridersOn(source).forEach((rider, index) => {
            if (eventOf(rider) === event) found.push({ item: source, rider, index });
        });
    }
    return found;
}
