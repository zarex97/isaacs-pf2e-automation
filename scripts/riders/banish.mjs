import { LIB_ID } from "../id.mjs";

const SETTING = "banishments";

/** World seconds per duration unit. A round is six seconds, which is how pf2e advances the clock. */
const UNIT_SECONDS = { seconds: 1, rounds: 6, minutes: 60, hours: 3600, days: 86400 };

export function durationSeconds(duration) {
    if (!duration) return 0;
    return (Number(duration.value) || 0) * (UNIT_SECONDS[String(duration.unit ?? "rounds")] ?? 6);
}

/**
 * Taking a creature off the board, and putting it back.
 *
 * Three Techniques banish: *Another Dimension* folds space around someone for a minute (ten on a critical
 * failure), *Rikudō Rinne* sends a soul to one of the six realms, and *Freezing Coffin* seals a creature in
 * ice. All three were whispers — "banished into folded space for 1 minute, then returns to the square it
 * left" — and a whisper is exactly the thing that did not happen at the table.
 *
 * There is no Foundry state for "out of play". A hidden token is still targetable and still takes area
 * damage; an unconscious one is still standing there. The only honest answer is to remove the token and put
 * an identical one back, which is what this does — so the register below is not an implementation detail,
 * it *is* the feature: the token's whole source, its place in the initiative order, and the moment it comes
 * back, held somewhere that survives a reload.
 *
 * Two details matter more than they look:
 *
 *  - **The full source, not a reference.** An unlinked NPC token carries its own actor data — its damage,
 *    its conditions, the effects the party spent three rounds landing on it. Deleting the token deletes
 *    that actor. `toObject()` keeps the delta, and `keepId` brings the same token id back, so a macro or a
 *    module holding a uuid finds what it was holding.
 *  - **The clock, not a timer.** `setTimeout` dies with the page. Every record carries the world time it
 *    expires at, and the sweep runs on anything that moves the clock — which in combat is every turn.
 */
export const Banish = {
    registerSettings() {
        game.settings.register(LIB_ID, SETTING, {
            scope: "world",
            config: false,
            type: Object,
            default: {},
        });
    },

    registerHooks() {
        Hooks.on("updateWorldTime", () => Banish.sweep());
        Hooks.on("pf2e.startTurn", () => Banish.sweep());
        Hooks.on("deleteCombat", () => Banish.sweep());
        Hooks.once("ready", () => Banish.sweep());
    },

    records() {
        return game.settings.get(LIB_ID, SETTING) ?? {};
    },

    /** Is this token currently folded away? Used to keep a second banishment from stacking. */
    isBanished(tokenUuid) {
        return Object.values(Banish.records()).some((record) => record.tokenUuid === tokenUuid);
    },

    /**
     * Fold a creature out of the world.
     *
     * Returns the record, or null if there was nothing to take. The chat card is public on purpose: a
     * creature vanishing from the map is the single most visible thing a Technique can do, and the table
     * needs to know when it is coming back.
     */
    async take(token, { seconds, label, originActor, returnsToSquare = true }) {
        const scene = token?.parent;
        if (!token || !scene || seconds <= 0) return null;
        if (Banish.isBanished(token.uuid)) return null;

        const combatant = token.combatant;
        const record = {
            id: foundry.utils.randomID(),
            sceneId: scene.id,
            tokenId: token.id,
            tokenUuid: token.uuid,
            name: token.name,
            source: token.toObject(),
            combat: combatant
                ? { combatId: combatant.parent.id, initiative: combatant.initiative, hidden: combatant.hidden }
                : null,
            expiresAt: game.time.worldTime + seconds,
            label: label ?? "Banished",
            originUuid: originActor?.uuid ?? null,
            returnsToSquare,
        };

        // Written before the token is deleted: if the delete throws, a stale record is a chat message the
        // GM can act on, while a deleted token with no record is a creature gone from the game.
        await game.settings.set(LIB_ID, SETTING, { ...Banish.records(), [record.id]: record });
        await scene.deleteEmbeddedDocuments("Token", [token.id]);

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: originActor }),
            content:
                `<p><strong>${record.name}</strong> — ${record.label}. It returns in `
                + `${describeSeconds(seconds)}${returnsToSquare ? ", to the square it left" : ""}.</p>`,
        });
        return record;
    },

    /** Anything whose time is up comes back. Active GM only: this creates documents. */
    async sweep() {
        if (game.users?.activeGM?.id !== game.user?.id) return;
        const now = game.time.worldTime;
        for (const record of Object.values(Banish.records())) {
            if (record.expiresAt > now) continue;
            await Banish.restore(record.id);
        }
    },

    /** Bring one creature back, whether its time is up or not — a counteract, or a GM changing their mind. */
    async restore(id) {
        const record = Banish.records()[id];
        if (!record) return null;

        // Drop the record first, so a scene that has since been deleted cannot wedge the sweep into
        // retrying the same failure on every tick of the clock.
        const remaining = { ...Banish.records() };
        delete remaining[id];
        await game.settings.set(LIB_ID, SETTING, remaining);

        const scene = game.scenes.get(record.sceneId);
        if (!scene) {
            ui.notifications.warn(`${record.name} was banished from a scene that no longer exists.`);
            return null;
        }
        if (scene.tokens.has(record.tokenId)) return null; // already back, by hand

        const [token] = await scene.createEmbeddedDocuments("Token", [record.source], { keepId: true });
        if (!token) return null;

        // Back into the initiative order at the number it left with. Foundry removed the combatant along
        // with the token, so this is a re-creation rather than an update.
        const combat = record.combat ? game.combats.get(record.combat.combatId) : null;
        if (combat && !combat.combatants.some((c) => c.tokenId === record.tokenId)) {
            await combat.createEmbeddedDocuments("Combatant", [
                {
                    tokenId: record.tokenId,
                    sceneId: record.sceneId,
                    actorId: token.actorId,
                    initiative: record.combat.initiative,
                    hidden: record.combat.hidden,
                },
            ]);
        }

        await ChatMessage.create({
            content: `<p><strong>${record.name}</strong> returns — ${record.label} has ended.</p>`,
        });
        return token;
    },

    /** Everything, now. Reachable from the API for a GM who needs the board back. */
    async restoreAll() {
        for (const id of Object.keys(Banish.records())) await Banish.restore(id);
    },
};

function describeSeconds(seconds) {
    if (seconds % 3600 === 0) return `${seconds / 3600} hour${seconds === 3600 ? "" : "s"}`;
    if (seconds % 60 === 0) return `${seconds / 60} minute${seconds === 60 ? "" : "s"}`;
    return `${Math.round(seconds / 6)} round${seconds === 6 ? "" : "s"}`;
}
