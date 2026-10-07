import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { RiderExtensions } from "./extensions.mjs";

/**
 * A creature stitched to where it is.
 *
 * *Planar Tether*: "While the target is affected by planar tether, the spell attempts to counteract any teleportation
 * effect that would move the target, or any effect that would transport it to a different plane." An effect with
 * `tether` keeps its caster and rank. Before this module moves a creature by a spell with the teleportation trait, or
 * banishes it, the tether rolls its caster's counteract check against the moving effect's DC; counteracted, the
 * creature stays.
 */

const FLAG = "tether";
const DEGREES = ["criticalFailure", "failure", "success", "criticalSuccess"];
const REACH = { criticalSuccess: 3, success: 1, failure: -1, criticalFailure: -Infinity };

/** The tether on this actor, or null. */
export function tetherOn(actor) {
    return (actor?.itemTypes?.effect ?? []).find((e) => e.flags?.[LIB_ID]?.[FLAG]) ?? null;
}

/** Does a counteract of this degree, at this rank, stop an effect of that rank? */
export function counteracts(outcome, ourRank, theirRank) {
    return (Number(theirRank) || 1) <= (Number(ourRank) || 1) + (REACH[outcome] ?? -Infinity);
}

/** Is this a move the tether answers: a teleportation spell's, or a banishment? */
export function tethers(item, kind) {
    return kind === "banish" || (item?.system?.traits?.value ?? []).includes("teleportation");
}

export const PlanarTether = {
    /**
     * Before `kind` ("teleport" or "banish") moves `context.actor`: true when a tether holds it in place.
     * `item` is the moving spell; `dc` its DC, `rank` its rank.
     */
    async holds(context, kind, { item = null, dc = null, rank = null } = {}) {
        const effect = tetherOn(context?.actor);
        if (!effect || !tethers(item, kind)) return false;
        const spec = effect.flags[LIB_ID][FLAG];
        const caster = spec.casterUuid ? await fromUuid(spec.casterUuid) : null;
        const statistic = caster ? RiderExtensions.statistic(caster, spec.statistic ?? "spellcasting") : null;
        if (!statistic || !dc) return false;
        const roll = await statistic.roll({ dc: { value: Number(dc) }, skipDialog: true, label: t("Tether.Check", { name: effect.name }), extraRollOptions: [`${LIB_ID}:counteract`] });
        const outcome = DEGREES[roll?.degreeOfSuccess ?? -1];
        const held = counteracts(outcome, spec.rank, rank);
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: context.actor }),
            content: `<p>${t(held ? "Tether.Held" : "Tether.Slipped", { actor: context.actor.name, name: effect.name, spell: item?.name ?? "" })}</p>`,
        });
        return held;
    },
};
