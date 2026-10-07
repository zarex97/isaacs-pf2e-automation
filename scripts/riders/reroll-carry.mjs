import { mergedFlag } from "../lib/flags.mjs";

/**
 * A save rerolled with pf2e's own reroll keeps what its first roll applied.
 *
 * `Check.rerollFromMessage` deletes the save's message and posts a new one carrying only pf2e's flags, so
 * the receipt of what the first roll's riders put on the creature went with the deleted message. The new
 * message then read as a fresh save: the first roll's frightened 2 stayed on a creature whose reroll was a
 * success, and frightened 1 was laid over it (#8). PF2e Toolbelt's reroll keeps one message and never had
 * the problem; this module should not need it.
 *
 * So the GM keeps the receipts of a deleted save message for a short while, and a reroll of the same save —
 * same speaker, same origin and item, same DC, the one pf2e marks `isReroll` — takes them up. Kept on the
 * GM's side, which is the side that writes them and the only side trusted to take items off a creature: a
 * player's client never names what to remove.
 */

/** How long a deleted save's receipts wait for their reroll. pf2e deletes and posts in one call. */
const WINDOW_MS = 60_000;

const kept = [];

/** What makes two save messages the same save: everything pf2e copies into a reroll but the result. */
export function signatureOf(message) {
    const context = message?.flags?.pf2e?.context;
    if (context?.type !== "saving-throw") return null;
    return JSON.stringify([
        message.speaker?.token ?? null,
        message.speaker?.actor ?? null,
        context.origin?.actor ?? null,
        context.origin?.item ?? null,
        context.dc?.value ?? null,
        context.identifier ?? context.domains ?? null,
    ]);
}

function prune(now) {
    for (let i = kept.length - 1; i >= 0; i--) if (now - kept[i].at > WINDOW_MS) kept.splice(i, 1);
}

export const RerollCarry = {
    registerHooks() {
        Hooks.on("deleteChatMessage", (message) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            RerollCarry.keep(message);
        });
    },

    /** A save message is going: hold on to its receipts, in case it is being rerolled. */
    keep(message, now = Date.now()) {
        const signature = signatureOf(message);
        const receipts = mergedFlag(message, "ridersApplied");
        prune(now);
        if (!signature || !receipts || Object.keys(receipts).length === 0) return;
        kept.push({ at: now, signature, receipts: { ...receipts } });
    },

    /**
     * The receipt a reroll inherits for one target, or null — and it is handed over once, so the same
     * receipt cannot be undone twice.
     */
    take(message, receiptKey, now = Date.now()) {
        if (!message?.flags?.pf2e?.context?.isReroll) return null;
        const signature = signatureOf(message);
        if (!signature) return null;
        prune(now);
        for (let i = kept.length - 1; i >= 0; i--) {
            const entry = kept[i];
            if (entry.signature !== signature || !entry.receipts[receiptKey]) continue;
            const receipt = entry.receipts[receiptKey];
            delete entry.receipts[receiptKey];
            if (Object.keys(entry.receipts).length === 0) kept.splice(i, 1);
            return receipt;
        }
        return null;
    },

    /** For the tests. */
    clear() {
        kept.length = 0;
    },
};
