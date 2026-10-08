import { CastPipeline } from "../cast-pipeline.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { counteracts } from "./apply.mjs";
import { RiderExtensions } from "./extensions.mjs";

/**
 * A ward against one named spell.
 *
 * *Spell Immunity*: "Spell immunity attempts to counteract that spell whenever spell immunity's target is the target of
 * the named spell or in that spell's area. Successfully counteracting a spell that targets an area or multiple targets
 * with spell immunity negates the effects only for the target affected by spell immunity." An effect carries
 * `immuneTo: { slug, rank, casterUuid, statistic }` — the spell named at the cast, the ward's rank and who warded
 * (`apply.mjs`). When the named spell is cast with the holder among its confirmed targets, the warder's statistic
 * rolls against the caster's spell DC; a counteract drops the holder from the targets before the card is posted, so
 * nothing the spell does reaches it, and everyone else is still caught.
 */

const FLAG = "immuneTo";
const DEGREES = ["criticalFailure", "failure", "success", "criticalSuccess"];

/** The ward this creature carries against this spell, or null. */
export function wardAgainst(actor, slug) {
    return (actor?.itemTypes?.effect ?? []).find((effect) => slug && effect.flags?.[LIB_ID]?.[FLAG]?.slug === slug) ?? null;
}

export const SpellImmunity = {
    register() {
        // After the aim (10), so an area's catch is the target list; before the card, so the card never names the warded.
        CastPipeline.before("a ward against one named spell", 12, async (spell, options) => {
            await SpellImmunity.ward(spell, Number(options?.rank) || Number(spell?.rank) || 1);
            return true;
        });
    },

    async ward(spell, rank) {
        for (const token of [...(game.user?.targets ?? [])]) {
            const effect = wardAgainst(token.actor, spell?.slug);
            if (!effect) continue;
            const spec = effect.flags[LIB_ID][FLAG];
            const warder = spec.casterUuid ? await fromUuid(spec.casterUuid).catch(() => null) : null;
            const statistic = RiderExtensions.statistic(warder, spec.statistic ?? "spellcasting");
            const dc = spell.spellcasting?.statistic?.dc?.value ?? RiderExtensions.statistic(spell.actor, "spellcasting")?.dc?.value;
            if (!statistic || !Number.isFinite(dc)) continue;
            const roll = await statistic.roll({
                dc: { value: dc },
                skipDialog: true,
                label: t("SpellImmunity.Check", { name: effect.name, spell: spell.name }),
                extraRollOptions: [`${LIB_ID}:counteract`],
            });
            const outcome = DEGREES[roll?.degreeOfSuccess ?? -1];
            const held = counteracts(outcome, Number(spec.rank) || 1, rank);
            if (held) token.setTarget(false, { user: game.user, releaseOthers: false });
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: token.actor }),
                content: `<p>${t(held ? "SpellImmunity.Held" : "SpellImmunity.Failed", { actor: token.name, spell: spell.name })}</p>`,
            });
        }
    },
};
