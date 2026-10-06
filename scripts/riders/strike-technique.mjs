import { LIB_ID } from "../id.mjs";
import { STRIKE_TECHNIQUE_FLAG, armedTechniqueId, ridersOn } from "./data.mjs";

/**
 * Which Technique the caster's next Strike belongs to.
 *
 * Five Techniques in the class are shaped *"make one Strike, and then…"* — Ryūsenka, Ikkotsu,
 * Shitonegaeshi, Hitotsume: Nadegiri, Shūkei: Hakuteiken. The Strike is made with a weapon, so the chat
 * message's item is the weapon and the consequence is written on the spell; only a search of the whole
 * sheet can bring the two together, and `collectRiders` does exactly that for `strike-resolved`.
 *
 * Which meant **every one of them fired on every Strike, for free**. Driven live in world `pf`: a
 * 17th-level Soul Reaper in Shikai, having cast nothing, made one bare critical Strike and applied both
 * *Ryūsenka: Off-Guard* and *Hitotsume: Nadegiri: Off-Guard*, and an earlier bare Strike rolled Ryūsenka's
 * Fortitude save at DC 33. The pool never moved: 1 point before, 1 point after. Guide §1.4 is one line —
 * *"Every technique costs 1 Reiatsu Point"* — and a character who knew three Strike Techniques got all
 * three riders on every Strike, at no cost, for ever.
 *
 * So the cast leaves a marker and the Strike spends it. One cast, one Strike, one set of riders:
 *
 *  - `arm` on a successful cast, from `CastPipeline` — **after** the spell has reached the table, so a
 *    cancelled placement or a refused frequency arms nothing;
 *  - `armedTechniqueId` read by `scopedAway`, which is the only thing that lets a spell into the wide
 *    search at all;
 *  - `disarm` by the first `strike-resolved` that consults it, hit or miss, because the Strike the
 *    Technique paid for has happened either way;
 *  - and a sweep at turn end, so a cast that never found a Strike does not arm one next round.
 *
 * Deliberately **not** a predicate on the content. Thirty-odd riders would each need one, none of them
 * should have to, and a rider authored without it would silently go back to firing free — which is the
 * failure this replaces, not a different one.
 */
export const StrikeTechnique = {
    /**
     * Is this the kind of spell that waits on a Strike somebody else's item will roll?
     *
     * Three conditions, and each excludes a real case:
     *
     *  - a **spell**, because the seventeen non-spell sources of `strike-resolved` riders — Hyōrinmaru's
     *    own Shikai crit rider, Thunderbolt Form's arcs, the Sky Ascendants — are passive by design and
     *    must keep firing on every Strike, which is the whole of what they are for;
     *  - without the **attack** trait, because a spell that rolls its own attack *is* the message's item
     *    and needs no marker — `scopedAway` keeps those out of other weapons' Strikes on its own;
     *  - carrying a `strike-resolved` rider at all, so a marker is not written for every cast in the game.
     */
    isOne(item) {
        if (item?.type !== "spell") return false;
        if (item.system?.traits?.value?.includes?.("attack")) return false;
        return ridersOn(item).some((rider) => rider?.event === "strike-resolved");
    },

    /** Does this candidate own the Strike that is resolving? */
    isArmed(actor, item) {
        // `original` is what a cast variant points back at: a variant is a clone carrying the same id, but
        // a Technique read off the sheet during collection may be either. Asking both makes the two ends
        // agree however the item arrived.
        const id = item?.original?.id ?? item?.id;
        return !!id && armedTechniqueId(actor) === id;
    },

    async arm(spell) {
        const actor = spell?.actor;
        if (!actor || !StrikeTechnique.isOne(spell)) return;
        const itemId = spell.original?.id ?? spell.id;
        await actor.setFlag(LIB_ID, STRIKE_TECHNIQUE_FLAG, { itemId, name: spell.name });
    },

    async disarm(actor) {
        if (!actor?.getFlag?.(LIB_ID, STRIKE_TECHNIQUE_FLAG)) return;
        await actor.unsetFlag(LIB_ID, STRIKE_TECHNIQUE_FLAG);
    },

    registerHooks() {
        // A Technique cast and never followed by a Strike is over at the end of the turn. Without this a
        // marker left on one turn arms the first Strike of the next, which is the original bug wearing a
        // longer fuse.
        Hooks.on("pf2e.endTurn", async (combatant) => {
            if (!game.user.isGM) return;
            await StrikeTechnique.disarm(combatant?.actor);
        });
        Hooks.on("deleteCombat", async (combat) => {
            if (!game.user.isGM) return;
            for (const combatant of combat.combatants) await StrikeTechnique.disarm(combatant.actor);
        });
    },
};
