import { LIB_ID } from "../id.mjs";

/**
 * One bonus handed to many people, spent by whoever uses it first.
 *
 * *Sight of the Balance*: "the next ally who attacks it gains a +1 status bonus to that attack roll". The
 * module cannot know at hand-out time which ally that will be, so every ally within 60 feet is given a copy
 * — and pf2e's `removeAfterRoll` then spends only the copy that was rolled, leaving the others armed. Three
 * allies attacking in turn would each take the +1 the clause gives to one of them.
 *
 * An effect flagged `sharedAllowance` is therefore one allowance with many holders: when any holder's roll
 * applies its modifier, every other copy aimed at the same creature — the same slug and the same predicate —
 * is taken back. The predicate is what keeps two different marks apart; it carries the signature
 * `picked.as-target` baked in.
 */
export const SharedAllowance = {
    registerHooks() {
        Hooks.on("createChatMessage", (message) => {
            if (!isWriter()) return;
            SharedAllowance.onRoll(message).catch((e) => console.error("Isaac's Homebrew | shared allowance", e));
        });
    },

    async onRoll(message) {
        const spent = (message.flags?.pf2e?.modifiers ?? []).filter((m) => m.enabled && m.slug);
        if (spent.length === 0) return;

        const scene = game.scenes.get(message.speaker?.scene) ?? canvas.scene;
        const actors = new Set((scene?.tokens ?? []).map((t) => t.actor).filter(Boolean));
        for (const actor of actors) {
            const copies = actor.itemTypes.effect.filter((effect) => {
                if (!effect.flags?.[LIB_ID]?.sharedAllowance) return false;
                return (effect.system.rules ?? []).some((rule) =>
                    spent.some((m) => ruleSlug(rule) === m.slug && samePredicate(rule.predicate, m.predicate)));
            });
            if (copies.length > 0) await actor.deleteEmbeddedDocuments("Item", copies.map((e) => e.id));
        }
    },
};

function ruleSlug(rule) {
    return rule.slug ?? game.pf2e.system.sluggify(rule.label ?? "");
}

function samePredicate(a, b) {
    return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}

function isWriter() {
    return game.users?.activeGM ? game.users.activeGM.isSelf : game.user.isGM;
}
