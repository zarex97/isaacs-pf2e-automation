import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { flagOf } from "../lib/flags.mjs";
import { playersOf } from "./message.mjs";

/**
 * A place where rituals fail.
 *
 * *Ritual Obstruction*: "You establish a zone of magical feedback that makes it impossible to succeed at rituals of
 * this spell's rank or lower in the area. Ritual obstruction ignores all cover, including walls and ceilings … Anyone
 * attempting to cast a ritual within the area knows, when they begin to cast the ritual, the area is cursed to impede
 * rituals. Any ritual cast in the area can't have a final result better than failure."
 *
 * A lingering area marked `obstructsRituals` keeps its cast rank. A ritual posted by a creature standing in one of at
 * least the ritual's rank tells its players the area is cursed, and marks the creature: its next check with a skill the
 * ritual's primary check names, within a day, ends no better than failure — pf2e's own degree adjustment, so the card
 * says why. A Region is not cut by walls, so the area already reaches past them.
 */

const MARK = "obstructedRitual";
const SKILLS = ["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism", "performance", "religion", "society", "stealth", "survival", "thievery"];

/** The skills a ritual's primary check names: "Arcana or Occultism (expert)" is arcana and occultism. */
export function ritualSkills(check) {
    const text = String(check ?? "").toLowerCase();
    return SKILLS.filter((skill) => text.includes(skill));
}

/** The obstructing areas a token stands in, with their ranks. */
function obstructing(token) {
    const scene = token?.parent;
    if (!scene) return [];
    const centre = token.object?.center ?? { x: token.x + (token.width * scene.grid.size) / 2, y: token.y + (token.height * scene.grid.size) / 2 };
    return scene.regions.filter((region) => flagOf(region, "lingering")?.obstructsRituals && region.testPoint({ ...centre, elevation: token.elevation ?? 0 }))
        .map((region) => ({ region, rank: Number(flagOf(region, "lingering")?.rank) || 1 }));
}

export const Obstruction = {
    register() {
        CheckPipeline.before("a ritual in a place that impedes it", 43, (_check, context) => {
            const actor = context?.actor;
            const mark = actor?.flags?.[LIB_ID]?.[MARK];
            if (!mark || !context.dc || game.time.worldTime > mark.until) return;
            const slug = context.domains?.find((d) => mark.skills.includes(d));
            if (!slug) return;
            const label = t("Obstruction.Label", { name: mark.area });
            context.dosAdjustments = [...(context.dosAdjustments ?? []), { adjustments: { criticalSuccess: { label, amount: "failure" }, success: { label, amount: "failure" } } }];
            context.options?.add?.(`${LIB_ID}:ritual-obstructed`);
            if (actor.isOwner) void actor.unsetFlag(LIB_ID, MARK);
        });
    },

    registerHooks() {
        // A ritual begun inside: its caster knows, and its primary check is marked.
        Hooks.on("createChatMessage", async (message, _options, userId) => {
            if (userId !== game.user?.id) return;
            const item = message.item;
            if (!item?.system?.ritual || message.rolls?.length) return;
            const token = message.token ?? item.actor?.getActiveTokens?.(true, true).find((tk) => tk.parent === canvas.scene);
            const rank = Number(item.rank) || Number(item.system?.level?.value) || 1;
            const area = obstructing(token).find((a) => a.rank >= rank);
            if (!area) return;
            await item.actor.setFlag(LIB_ID, MARK, { area: area.region.name, skills: ritualSkills(item.system.ritual.primary?.check), until: game.time.worldTime + 86400 });
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: item.actor }), whisper: playersOf(item.actor), content: `<p>${t("Obstruction.Cursed", { name: item.name, area: area.region.name })}</p>` });
        });
    },
};
