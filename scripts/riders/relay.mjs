import { LIB_ID } from "../id.mjs";
import { applyRiders, applyChoice, applyPick, resolveCounteract, resolveReaction } from "./apply.mjs";

const CHANNEL = `module.${LIB_ID}`;

const HANDLERS = {
    applyRiders,
    applyChoice,
    applyPick,
    applyCounteract: resolveCounteract,
    applyReaction: resolveReaction,
};

/**
 * Getting a rider onto a target's sheet.
 *
 * A player owns their Saint and nothing else, so they cannot write a condition onto the monster that just
 * failed its save — the request has to be carried out by a GM. Exactly one GM: `game.users.activeGM` is
 * Foundry's designated primary, so two GMs at the table do not both apply the same condition.
 *
 * The payload deliberately carries no rider data. It names an event, an item or a message, a target and an
 * outcome, and the GM reads the riders off the item themselves. A player therefore cannot ask for an
 * effect the Technique does not have, and a stale client cannot apply a rider that has since been edited
 * out of the compendium. That property is why every new event source added here is cheap: the trust
 * boundary does not move.
 */
export const Relay = {
    listen() {
        game.socket.on(CHANNEL, async (payload) => {
            const handler = HANDLERS[payload?.action];
            if (!handler) return;
            if (game.users.activeGM?.id !== game.user.id) return;
            await handler(payload);
        });
    },

    /**
     * Add a handler from outside the riders — the Assimilator's Instinct cards. The same trust boundary holds: the
     * payload names a message and a pick, and the handler re-reads what that message offered.
     */
    register(action, handler) {
        if (!(action in HANDLERS)) HANDLERS[action] = handler;
    },

    async request(payload) {
        const handler = HANDLERS[payload?.action];
        if (!handler) return;
        if (game.user.isGM && game.users.activeGM?.id === game.user.id) {
            return handler(payload);
        }
        if (!game.users.activeGM) {
            return warnNoGM(payload);
        }
        game.socket.emit(CHANNEL, payload);
    },
};

/**
 * Failing loudly rather than quietly.
 *
 * With no GM online the riders cannot be applied at all, and the worst outcome is a table that believes
 * they were. The notice is deliberately per-cast rather than per-target: five targets failing their saves
 * should not produce five identical warnings.
 */
const warned = new Set();

async function warnNoGM({ event, messageId, itemUuid }) {
    const key = `${event}:${messageId ?? itemUuid}`;
    if (warned.has(key)) return;
    warned.add(key);
    setTimeout(() => warned.delete(key), 10_000);

    const name = game.messages.get(messageId ?? "")?.item?.name ?? "This Technique";
    ui.notifications.warn(
        `${name}: no GM is online, so its riders were not applied. Apply them by hand.`,
    );
}
