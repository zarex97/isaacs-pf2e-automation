import { LIB_ID } from "../id.mjs";
import { bindReactionButtons } from "./reactions.mjs";
import { Relay } from "./relay.mjs";
import { Sources } from "./sources.mjs";

/**
 * Riders: any declarative consequence the module fires from an event.
 *
 * This docstring used to say "what happens to a target *besides* damage", which the list outgrew in both
 * directions: `damage` is one of the apply types, `heal`/`equip`/`toggle`/`strikes` act on the origin rather
 * than a target, and `prompt`/`choice`/`readout` touch no sheet at all. `CONTEXT.md` carries the definition
 * above; the one-line summary here is the place it kept drifting from.
 *
 * This is backlog §1. A rule element lives on the Saint's sheet and cannot write a condition onto a
 * target's sheet, so "a creature that fails is slowed 1 for 1 round" was always a line of text someone had
 * to notice and act on. Nothing about that is fixable from the item; it needs code that sees an outcome
 * and reaches the other actor.
 *
 * The shape is one pipeline, not one listener per feature. A handful of sources normalise what happened
 * into an event; the riders on the origin's items say what that event earns; a GM applies it. Adding
 * Virgo's sense loss or Pisces' garden is then a content change and a line in a table, rather than another
 * bespoke hook.
 */
export const Riders = {
    registerSettings() {
        game.settings.register(LIB_ID, "riders", {
            name: "Apply Technique riders automatically",
            hint: "When a save is rolled, a Strike lands, or damage is applied, apply the conditions the "
                + "Technique or Cloth inflicts. Requires a GM online; saves rolled from a chat card also "
                + "require pf2e-toolbelt's Target Helper.",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        });

        game.settings.register(LIB_ID, "automateDeath", {
            name: "Automate death effects",
            hint: "Antares, Royal Funeral and the Cancer Zenith say \"or die\". Choose who the module is "
                + "allowed to do that to; anyone else gets a whisper to the GM instead.",
            scope: "world",
            config: true,
            type: String,
            choices: {
                npcs: "Creatures without a player owner",
                all: "Anyone, including player characters",
                off: "Nobody — always whisper",
            },
            default: "npcs",
        });
    },

    registerHooks() {
        Relay.listen();
        Sources.register();
        Hooks.on("renderChatMessageHTML", (message, html) => bindCards(message, html));
        // Foundry <13 and any client still emitting the jQuery flavour of the hook.
        Hooks.on("renderChatMessage", (message, html) => bindCards(message, html?.[0] ?? html));
    },
};

function bindCards(message, html) {
    // Bind each rendered card once.
    //
    // Foundry v14 emits `renderChatMessageHTML` *and* the deprecated `renderChatMessage` for the same
    // element, so both listeners above ran on the same node and every button ended up with two click
    // handlers. One click then sent two requests: two identical conditions, two copies of an effect, two
    // property runes from one *Athena's Temper*. Nothing about that looked like a double-fire at the table
    // — it looked like the rider being written wrong — and it only became visible on a card whose result
    // was an item rather than a condition, because applying the same condition twice is idempotent.
    if (html?.dataset?.isaacsHbBound) return;
    if (html?.dataset) html.dataset.isaacsHbBound = "1";
    bindChoiceButtons(message, html);
    bindPickButtons(message, html);
    bindCounteractButtons(message, html);
    bindReactionButtons(message, html, (payload) => Relay.request(payload));
}

/** The buttons on a "choose a sense" card. Clicking relays the pick; the GM applies it. */
function bindChoiceButtons(message, html) {
    const choice = message?.flags?.[LIB_ID]?.choice;
    if (!choice || !html?.querySelectorAll) return;

    for (const button of html.querySelectorAll(`[data-action="isaacs-hb-rider-choice"]`)) {
        button.addEventListener("click", async () => {
            for (const sibling of html.querySelectorAll(`[data-action="isaacs-hb-rider-choice"]`)) {
                sibling.disabled = true;
            }
            await Relay.request({
                action: "applyChoice",
                event: "choice",
                optionIndex: Number(button.dataset.option),
                ...choice,
            });
        });
    }
}

/**
 * The buttons on a "choose a creature" card.
 *
 * Same shape as the counteract card and for the same reason: the options were read off the **board** when
 * the card was posted, not authored, so the creature travels on the button rather than as an index into a
 * rider. What goes back to the GM is still only an address — which rider, on which item, and which token
 * — so the GM re-reads what the ability actually does.
 */
function bindPickButtons(message, html) {
    const pick = message?.flags?.[LIB_ID]?.pick;
    if (!pick || !html?.querySelectorAll) return;

    for (const button of html.querySelectorAll(`[data-action="isaacs-hb-rider-pick"]`)) {
        button.addEventListener("click", async () => {
            for (const sibling of html.querySelectorAll(`[data-action="isaacs-hb-rider-pick"]`)) {
                sibling.disabled = true;
            }
            await Relay.request({
                action: "applyPick",
                event: "pick",
                pickedUuid: button.dataset.token,
                ...pick,
            });
        });
    }
}

/**
 * The buttons on a "counteract one of these" card.
 *
 * Same shape as the choice card and for the same reasons — it survives a reload and cannot be missed — but
 * the options are read off the board at cast time rather than authored, so the effect to counteract travels
 * on the button rather than as an index into a rider.
 */
function bindCounteractButtons(message, html) {
    const counteract = message?.flags?.[LIB_ID]?.counteract;
    if (!counteract || !html?.querySelectorAll) return;

    for (const button of html.querySelectorAll(`[data-action="isaacs-hb-counteract"]`)) {
        button.addEventListener("click", async () => {
            for (const sibling of html.querySelectorAll(`[data-action="isaacs-hb-counteract"]`)) {
                sibling.disabled = true;
            }
            await Relay.request({
                action: "applyCounteract",
                event: "counteract",
                effectUuid: button.dataset.effect,
                ...counteract,
            });
        });
    }
}
