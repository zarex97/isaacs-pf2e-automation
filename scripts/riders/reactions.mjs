/**
 * Reactions: turning a detected trigger into an offer.
 *
 * Eight abilities in the Soulbound fire on someone *else's* action — Antithesis, The Balance, Zanhyō
 * Ningyō, Danku, Reiatsu Barrier, Guard the Threshold, Unbroken Chain, The Miracle. The rider engine
 * already sees those triggers through `strike-received` and `damage-applied`. What was missing is asking
 * the owner whether they want to spend their reaction on this one, and doing nothing if they do not.
 *
 * **The offer never blocks.** It is a whispered card, exactly like the choice and counteract cards beside
 * it, and an unattended client simply never clicks it. That is the whole design: a timer that auto-spent
 * someone's reaction would be worse than not offering, and a modal that waited for an answer would stall
 * whoever's turn it actually is. Declining is spelled "ignore the card".
 *
 * This lives in `scripts/riders/` rather than `scripts/soulbound/` because nothing about it is Soulbound-
 * specific: it is the same machinery any reaction in any class would want, and the Saint's own reaction
 * Techniques could move onto it without a line of new code.
 */
import { LIB_ID } from "../id.mjs";

/**
 * May this actor be offered this reaction right now?
 *
 * Pure, and exported, because every gate here is the kind that fails silently in the wrong direction: an
 * offer that never appears looks like a missing feature, and one that appears twice looks like a rules
 * argument.
 *
 * @param {object} state
 * @param {boolean} state.hasReaction   the actor still has its reaction this round
 * @param {boolean} state.alreadyOffered this same trigger has already produced a card
 * @param {boolean} state.ownerOnline   somebody who owns the actor is connected
 * @param {number}  state.frequencyLeft uses remaining on the ability itself
 * @returns {boolean}
 */
export function canOffer({ hasReaction, alreadyOffered, ownerOnline, frequencyLeft }) {
    if (!ownerOnline) return false;
    if (!hasReaction) return false;
    if (alreadyOffered) return false;
    return frequencyLeft > 0;
}

/** Triggers already offered, so one damage application cannot produce two identical cards. */
const offered = new Set();

/** Anyone who owns this actor and is currently connected. */
function onlineOwners(actor) {
    return game.users.filter(
        (user) => user.active && !user.isGM && actor?.testUserPermission?.(user, "OWNER"),
    );
}

/**
 * Whether the reacting actor still has a reaction.
 *
 * pf2e tracks no reaction economy of its own — the same hole that makes Leo's extra actions a whisper in
 * the Saint — so this can only ask whether the actor is *able* to react at all. A creature that has spent
 * its reaction is not detectable, and the card says so rather than pretending otherwise.
 */
function looksAbleToReact(actor) {
    const conditions = actor?.conditions?.stored ?? [];
    const blocking = ["unconscious", "paralyzed", "petrified", "stunned"];
    // An effect that forbids reactions says so as a roll option — Silver Depth 4's Argent-Bound (#93).
    if (actor?.getRollOptions?.().includes("self:cannot-react")) return false;
    return !conditions.some((c) => blocking.includes(c.slug));
}

function frequencyLeftOn(item) {
    const frequency = item?.system?.frequency;
    if (!frequency) return 1;
    return Number(frequency.value ?? frequency.max ?? 1);
}

/**
 * Offer a reaction to its owner.
 *
 * Called from the rider engine's dispatch for `apply.type === "reaction"`. The card carries no rider data,
 * only an address — the GM re-reads the rider off the item when the button is clicked. That is the same
 * trust boundary the relay already keeps, and it means a stale client cannot fire a reaction that has since
 * been edited out of the compendium.
 */
export async function offerReaction(rider, context) {
    const actor = context.originActor;
    const item = context.riderItem ?? context.item;
    if (!actor || !item) return;

    // One occasion, one offer. A chat message names most of them; an `ally-damaged` blow has none, so the
    // dispatch carries its own id — without it every offer after the first shared the item's uuid as a key
    // and was swallowed by this dedupe for a minute.
    const occasion = context.message?.id ?? context.dispatchId ?? item.uuid;
    const key = `${occasion}:${JSON.stringify(context.riderIndex)}:${actor.id}`;
    const owners = onlineOwners(actor);

    const allowed = canOffer({
        hasReaction: looksAbleToReact(actor),
        alreadyOffered: offered.has(key),
        // A GM-run NPC counts: the GM is at the keyboard and can click for it.
        ownerOnline: owners.length > 0 || !!game.users.activeGM,
        frequencyLeft: frequencyLeftOn(item),
    });
    if (!allowed) return;

    offered.add(key);
    setTimeout(() => offered.delete(key), 60_000);

    const recipients = new Set(ChatMessage.getWhisperRecipients("GM").map((user) => user.id));
    for (const user of owners) recipients.add(user.id);

    const label = foundry.utils.escapeHTML(rider.apply.label ?? `Use ${item.name}`);
    const prompt = foundry.utils.escapeHTML(
        rider.apply.prompt ?? `${item.name} can be used as a reaction. Spend it?`,
    );

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        whisper: [...recipients],
        // Some of these are not reactions. The Balance's Vollständig redirects an ally's damage "as a free
        // action **without spending your reaction**", and a card headed "reaction" is the table being told
        // the opposite of what the clause says. `looksAbleToReact` is really "able to act at all" —
        // unconscious, paralyzed, petrified, stunned — which gates a free action just as well, and the
        // module has never tracked a *spent* reaction, so nothing else here needs to change.
        flavor: `${item.name} — ${rider.apply.freeAction ? "free action" : "reaction"}`,
        content:
            `<p>${prompt}</p>`
            + `<div class="isaacs-hb-choice">`
            + `<button type="button" data-action="isaacs-hb-reaction">${label}</button>`
            + `</div>`
            + `<p class="isaacs-hb-hint"><em>Ignoring this card declines the reaction; nothing is spent.</em></p>`,
        flags: {
            [LIB_ID]: {
                reaction: {
                    riderItemUuid: item.uuid,
                    riderIndex: context.riderIndex,
                    originUuid: actor.uuid,
                    targetUuid: context.target?.uuid ?? context.actor?.uuid ?? null,
                    // The other end of the event, which a `self` reaction would otherwise lose: the
                    // reaction is offered to its owner, so `target` is the owner too, and Antithesis
                    // needs to know who struck them — "the **triggering creature** takes 2d6 spirit".
                    eventTargetUuid: context.eventTarget?.uuid ?? null,
                    // The third participant, on `ally-damaged` alone: the creature the harm landed on.
                    eventAllyUuid: context.eventAlly?.uuid ?? null,
                    // What the blow was worth, carried across the card so a rider resolved on the click
                    // can still ask. The Balance's Vollständig redirect is measured entirely in it —
                    // "redirect **that damage** to yourself" — and without this the card arrived with the
                    // number already forgotten: driven live, the ally was healed nothing at all.
                    damage: context.eventDamage ?? null,
                    messageId: context.message?.id ?? null,
                    outcome: context.outcome ?? null,
                },
            },
        },
    });
}

/** Bind the button on a rendered reaction card. Mirrors `bindChoiceButtons` beside it. */
export function bindReactionButtons(message, html, request) {
    const reaction = message?.flags?.[LIB_ID]?.reaction;
    if (!reaction || !html?.querySelectorAll) return;

    for (const button of html.querySelectorAll(`[data-action="isaacs-hb-reaction"]`)) {
        button.addEventListener("click", async () => {
            for (const sibling of html.querySelectorAll(`[data-action="isaacs-hb-reaction"]`)) {
                sibling.disabled = true;
            }
            await request({ action: "applyReaction", event: "reaction", ...reaction });
        });
    }
}
