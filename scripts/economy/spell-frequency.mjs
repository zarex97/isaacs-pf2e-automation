/**
 * A spell's **Frequency**, which pf2e writes down and never reads.
 *
 * `system.frequency` is a real field on a spell — the sheet accepts it, the card prints it, and pf2e even
 * builds a `frequency:limited` roll option from it — but both halves of the machinery skip spells:
 *
 *  - the spend is `createUseActionMessage` in `chat-message/helpers.ts`, which only runs for an **ability
 *    or feat** posted to chat;
 *  - the refill is `Actor#recharge`, whose loop is `[this.itemTypes.action, this.itemTypes.feat].flat()`.
 *
 * So "Frequency once per round" on a spell is decoration. Driven live, *Lanza del Relámpago* cast twice in
 * one round posted two cards and left `frequency.value` at 1 both times. Five spells in the content say it
 * — Lanza, Hirviendo's Boil, Kita: Tenchi Kaijin, The Miracle's Growth and Trident — and not one of them
 * was limited by anything.
 *
 * Both halves live here, and both are deliberately narrow: only spells, and only the intervals pf2e's own
 * `recharge` would have handled had it looked at them. An ISO interval on a spell still belongs to
 * `Recharge`, which already walks every item on the actor.
 */
/** The intervals pf2e refills for an action or a feat, and therefore the ones a spell is owed too. */
const ENCOUNTER_INTERVALS = new Set(["turn", "round"]);

export const SpellFrequency = {
    registerHooks() {
        // pf2e recharges a combatant's own `round` allowances at the start of their turn, and everybody
        // else's `turn` allowances at the same moment (`encounter/combatant.ts`, `encounter/document.ts`).
        // Mirroring that exactly is what keeps a spell's Frequency meaning the same thing as an action's.
        Hooks.on("pf2e.startTurn", (combatant) => SpellFrequency.onStartTurn(combatant));
    },

    /**
     * Refuse a spell whose allowance is spent, and spend it otherwise.
     *
     * Called from `CastPipeline.beforeCast` after the area has been aimed, so backing out of a placement
     * costs nothing — the same ordering the Focus Point and the Soulbound's own cap already rely on.
     */
    async beforeCast(spell) {
        const frequency = spell?.system?.frequency;
        if (!frequency || typeof frequency.value !== "number") return true;

        if (frequency.value <= 0) {
            ui.notifications.warn(`${spell.name} has no uses left (${describe(frequency)}).`);
            return false;
        }
        await spell.update({ "system.frequency.value": frequency.value - 1 });
        return true;
    },

    async onStartTurn(combatant) {
        if (!isTimekeeper()) return;
        const encounter = combatant?.parent;
        if (!encounter) return;

        await refill(combatant.actor, "round");
        for (const other of encounter.combatants) {
            if (other !== combatant) await refill(other.actor, "turn");
        }
    },
};

/** Hand back every spell allowance on this actor that runs on `per`. */
async function refill(actor, per) {
    if (!actor) return;
    const updates = (actor.itemTypes?.spell ?? [])
        .filter((spell) => {
            const frequency = spell.system?.frequency;
            return (
                frequency
                && frequency.per === per
                && ENCOUNTER_INTERVALS.has(frequency.per)
                && (frequency.value ?? 0) < (frequency.max ?? 0)
            );
        })
        .map((spell) => ({ _id: spell.id, "system.frequency.value": spell.system.frequency.max }));
    if (updates.length > 0) await actor.updateEmbeddedDocuments("Item", updates);
}

function describe(frequency) {
    const per = String(frequency.per ?? "round");
    return frequency.max === 1 ? `once per ${per}` : `${frequency.max} per ${per}`;
}

/** One client does the refilling, or five players refill the same spell five times. */
function isTimekeeper() {
    return game.users.activeGM?.id === game.user.id;
}
