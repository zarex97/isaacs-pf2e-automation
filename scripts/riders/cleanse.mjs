import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Easing an affliction.
 *
 * *Cleanse Affliction*: "Choose an affliction on the target, such as a curse, disease, or poison. If it has advanced
 * past stage one, reduce the stage by one. This reduction can be applied only once to a given case of an affliction
 * … Heightened (3rd) Attempt to counteract the affliction if it is a disease or poison. Heightened (4th) … if it is a
 * curse, disease, or poison." The cast posts a card of the target's afflictions — an affliction this module runs
 * (`affliction.mjs`), or an effect with the curse, disease or poison trait — and the one chosen is eased: a stage
 * down once per case (the case keeps a `cleansed` mark), then, at the ranks that allow it, a counteract against
 * its own DC.
 */

const KINDS = ["curse", "disease", "poison"];

/** The kinds a cast of this rank may counteract. */
export function counteractKinds(rank, spec = {}) {
    const at = spec.counteractAtRank ?? { 3: ["disease", "poison"], 4: ["curse", "disease", "poison"] };
    return [...new Set(Object.entries(at).filter(([r]) => (Number(rank) || 0) >= Number(r)).flatMap(([, list]) => list))];
}

/** Is this item an affliction a cleansing may choose? */
export function isAffliction(item) {
    if (item?.type !== "effect") return false;
    if (item.flags?.[LIB_ID]?.affliction) return true;
    return (item.system?.traits?.value ?? []).some((trait) => KINDS.includes(trait));
}

function kindsOf(item) {
    const state = item.flags?.[LIB_ID]?.affliction;
    return [...(state?.traits ?? []), ...(item.system?.traits?.value ?? [])];
}

export const Cleanse = {
    /** The card: the target's afflictions, one button each. */
    async offer(rider, context, { castItem }) {
        const buttons = [];
        for (const token of context.targets ?? []) {
            const actor = token?.actor;
            for (const item of actor?.itemTypes?.effect ?? []) {
                if (!isAffliction(item)) continue;
                buttons.push(`<button type="button" data-action="isaacs-automation-cleanse" data-effect="${item.uuid}">${foundry.utils.escapeHTML(`${actor.name}: ${item.name}`)}</button>`);
            }
        }
        if (buttons.length === 0) {
            context.notes.push(t("Cleanse.Nothing"));
            return;
        }
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: context.originActor }),
            whisper: ChatMessage.getWhisperRecipients("GM").map((u) => u.id).concat(
                Object.entries(context.originActor?.ownership ?? {}).filter(([id, level]) => id !== "default" && level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER).map(([id]) => id)),
            flavor: castItem?.name ?? t("Cleanse.Title"),
            content: `<p>${t("Cleanse.Prompt")}</p><div class="isaacs-automation-choice">${buttons.join(" ")}</div>`,
            flags: { [LIB_ID]: { cleanse: {
                originUuid: context.originActor?.uuid ?? null,
                itemUuid: castItem?.uuid ?? null,
                rank: castItem?.rank ?? null,
                statistic: rider.apply.statistic ?? null,
                counteractAtRank: rider.apply.counteractAtRank ?? null,
            } } },
        });
    },

    /** The one chosen: a stage down once per case, then the counteract its rank allows. GM-side. */
    async resolve(payload) {
        let effect = await fromUuid(payload.effectUuid);
        const origin = await fromUuid(payload.originUuid);
        const caster = origin?.actor ?? origin;
        if (!effect || !caster) return;
        const lines = [];

        const state = effect.flags?.[LIB_ID]?.affliction;
        if (state) {
            if (state.cleansed) lines.push(t("Cleanse.Already", { name: state.name }));
            else if (state.stage > 1) {
                const { Affliction } = await import("./affliction.mjs");
                effect = await Affliction.ease(effect);
                lines.push(t("Cleanse.Eased", { name: state.name, stage: state.stage - 1 }));
            } else lines.push(t("Cleanse.FirstStage", { name: state.name }));
        }
        if (lines.length > 0) await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p>${lines.join(" ")}</p>` });

        const kinds = counteractKinds(payload.rank, { counteractAtRank: payload.counteractAtRank ?? undefined });
        const counteracts = !!effect && kindsOf(effect).some((kind) => kinds.includes(kind));
        // Nothing this casting may do — a curse below 4th rank — said rather than left silent.
        if (!counteracts && lines.length === 0) {
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p>${t("Cleanse.Beyond", { name: effect?.name ?? "" })}</p>` });
        }
        if (counteracts) {
            const { resolveCounteract } = await import("./apply.mjs");
            await resolveCounteract({
                originUuid: payload.originUuid, effectUuid: effect.uuid, itemUuid: payload.itemUuid, rank: payload.rank,
                statistic: payload.statistic ?? null, dc: effect.flags?.[LIB_ID]?.affliction?.dc ?? null,
            });
        }
    },
};
