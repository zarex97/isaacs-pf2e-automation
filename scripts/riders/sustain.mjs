import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { combatOf } from "../lib/combat.mjs";

/**
 * Sustaining a spell that grows.
 *
 * *Bless*: "Once per round on subsequent turns, you can Sustain the spell to increase the emanation's radius
 * by 10 feet." pf2e's own effect carries the aura and reads its radius off its badge — 15 ft at 1, 25 at 2 —
 * so a Sustain is one more on the badge. What pf2e lacks is the link: its Sustain action is a bare
 * "Sustain" in chat that names no spell, and a caster holding two sustainable effects could mean either.
 *
 * So the effect brings its own action, the way a grip brings its Escape: "Sustain Bless" on the caster's
 * sheet, spent like any action, and gone when the effect is.
 */

const FLAG = "sustain";

/** May it be Sustained now? Once per round, and not in the round it was cast. Out of combat, always. */
export function canSustain({ castRound = null, lastRound = null } = {}, round = null) {
    if (round === null || round === undefined) return true;
    if (castRound !== null && round <= castRound) return false;
    return lastRound !== round;
}

/**
 * The round of the encounter this actor is fighting in, or null out of combat. Not `game.combat`: that is
 * whichever encounter the GM is looking at, and a scene can hold two — the round a Sustain is judged by is
 * the caster's own.
 */
export function roundFor(actor, combats = game.combats) {
    return combatOf(actor, combats, null)?.round ?? null;
}

/** The granted action, as a plain source object. */
export function sustainActionSource({ item, effectId = null, regionUuid = null, spellUuid = null, step = 1, castRound = null, lapses = false, repeat = null }) {
    const name = item?.name ?? t("Rider.Name");
    return {
        type: "action",
        name: t("Sustain.Name", { name }),
        img: item?.img ?? "icons/svg/clockwork.svg",
        system: {
            actionType: { value: "action" },
            actions: { value: 1 },
            description: { value: `<p>${t(spellUuid ? "Sustain.KeepDescription" : "Sustain.Description", { name })}</p>` },
            traits: { value: ["concentrate"], rarity: "common" },
        },
        flags: {
            [LIB_ID]: {
                [FLAG]: { effectId, regionUuid, spellUuid, step, castRound, lastRound: null, lapses, repeat },
                riders: [{ apply: { type: "sustain" }, event: "action-used", self: true }],
            },
        },
    };
}

/** Does a sustained spell end at the end of this turn? Not in its casting round, not out of combat, not if Sustained. */
export function lapses({ castRound = null, lastRound = null } = {}, round = null) {
    if (round === null || round === undefined) return false;
    if (castRound !== null && round <= castRound) return false;
    return lastRound !== round;
}

/** An item that a sustained spell of this caster left. */
function isSustainedBy(item, caster, spellUuid) {
    const by = item.flags?.[LIB_ID]?.sustainedBy;
    return by?.spell === spellUuid && by?.origin === caster.uuid;
}

/** Every actor on the caster's scenes holding something the spell left. */
function heldBy(caster, spellUuid) {
    const actors = new Set();
    for (const scene of game.scenes) for (const token of scene.tokens) {
        if (token.actor?.items?.some((i) => isSustainedBy(i, caster, spellUuid))) actors.add(token.actor);
    }
    return [...actors];
}

export const Sustain = {
    /** Give the caster the action that Sustains `effect`. */
    async grant(rider, context, effect) {
        const actor = context.actor;
        if (!actor || !effect) return null;
        const item = context.item ?? context.riderItem ?? null;
        const step = Number(rider.apply.sustain?.step) || 1;
        const [created] = await actor.createEmbeddedDocuments("Item", [
            sustainActionSource({ item, effectId: effect.id, step, castRound: roundFor(actor) }),
        ]);
        return created ?? null;
    },

    /**
     * Give the caster the action that Sustains an area they left — *Malediction*'s emanation, which grows
     * and catches more. What growing means is the area's own business (`Sustain.onRegion`, set by
     * `lingering.mjs`, which this file does not import).
     */
    async grantForRegion(actor, item, region, spec = {}) {
        if (!actor || !region) return null;
        const [created] = await actor.createEmbeddedDocuments("Item", [
            sustainActionSource({ item, regionUuid: region.uuid, step: Number(spec.step) || 1, castRound: roundFor(actor), lapses: spec.lapses === true }),
        ]);
        return created ?? null;
    },

    /**
     * A spell that lasts only while it is Sustained — *Laughing Fit*. Its effects on its targets are marked
     * `sustainedBy`, and the caster holds one *Sustain* action for the spell however many it reached.
     */
    async grantForSpell(actor, spell, { repeat = null } = {}) {
        const spellUuid = (spell?.original ?? spell)?.uuid;
        if (!actor || !spellUuid) return null;
        if (actor.items.some((i) => i.flags?.[LIB_ID]?.[FLAG]?.spellUuid === spellUuid)) return null;
        const [created] = await actor.createEmbeddedDocuments("Item", [
            sustainActionSource({ item: spell, spellUuid, castRound: roundFor(actor), repeat }),
        ]);
        return created ?? null;
    },

    /**
     * The caster's turn is over: a sustained spell they did not Sustain this turn ends — every effect it
     * left, on everyone. Not in the round it was cast, and not out of combat. Active GM only.
     */
    async lapse(actor, endedRound = null) {
        if (game.users.activeGM?.id !== game.user.id || !actor) return;
        // The round of the turn that ended, as pf2e recorded it: skipping straight to the next round ends this
        // turn with the encounter already a round on, and a spell cast this turn would lapse before it began.
        const round = endedRound ?? roundFor(actor);
        // An area whose spell is "sustained" — *Floating Flame*, *Lightning Storm* — ends with the turn it wasn't.
        for (const action of actor.items.filter((i) => i.flags?.[LIB_ID]?.[FLAG]?.regionUuid && i.flags[LIB_ID][FLAG].lapses)) {
            const spec = action.flags[LIB_ID][FLAG];
            if (!lapses(spec, round)) continue;
            const region = await fromUuid(spec.regionUuid);
            const name = region?.name ?? action.name;
            // Every area of the cast goes — *Lightning Storm*'s second cloud is the same spell.
            const castId = region?.flags?.[LIB_ID]?.lingering?.castId;
            const areas = region ? region.parent.regions.filter((r) => r === region || (castId && r.flags?.[LIB_ID]?.lingering?.castId === castId)) : [];
            if (areas.length > 0) await region.parent.deleteEmbeddedDocuments("Region", areas.map((r) => r.id));
            if (actor.items.has(action.id)) await action.delete().catch(() => {});
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t("Sustain.Lapsed", { name, actor: actor.name })}</p>` });
        }
        for (const action of actor.items.filter((i) => i.flags?.[LIB_ID]?.[FLAG]?.spellUuid)) {
            const spec = action.flags[LIB_ID][FLAG];
            if (!lapses(spec, round)) continue;
            const ended = [];
            for (const holder of heldBy(actor, spec.spellUuid)) {
                const ids = holder.items.filter((i) => isSustainedBy(i, actor, spec.spellUuid)).map((i) => i.id);
                if (ids.length > 0) { await holder.deleteEmbeddedDocuments("Item", ids); ended.push(holder.name); }
            }
            if (actor.items.has(action.id)) await action.delete();
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `<p>${t("Sustain.Lapsed", { name: action.name.replace(t("Sustain.Name", { name: "" }).trim(), "").trim(), actor: actor.name })}</p>`,
            });
        }
    },

    /** `(region, spec, context) → label`: what Sustaining an area does. Set by `lingering.mjs`. */
    onRegion: null,

    /** The action was used: one step more on the effect's badge, if the rules allow it now. */
    async apply(rider, context) {
        const action = context.item;
        const spec = action?.flags?.[LIB_ID]?.[FLAG];
        const actor = context.actor;
        if (!spec || !actor) return;
        // A sustained spell: Sustaining it is the whole of it — keep it going this round.
        if (spec.spellUuid) {
            const round = roundFor(actor);
            const say = (key) => ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t(key, { name: action.name })}</p>` });
            if (!canSustain(spec, round)) return say(spec.castRound !== null && round <= spec.castRound ? "Sustain.NotYet" : "Sustain.Already");
            await action.setFlag(LIB_ID, FLAG, { ...spec, lastRound: round });
            // The spell again, as it was cast: its rank and its variant, a card to attack from.
            if (spec.repeat) {
                const spell = await fromUuid(spec.spellUuid);
                const again = spell?.loadVariant?.({ overlayIds: spec.repeat.overlayIds ?? [], castRank: spec.repeat.rank ?? spell.rank }) ?? spell;
                await again?.toMessage?.(undefined, { data: { castRank: spec.repeat.rank ?? spell?.rank } });
                return say("Sustain.Again");
            }
            return say("Sustain.Kept");
        }
        const effect = spec.effectId ? actor.items.get(spec.effectId) : null;
        const region = spec.regionUuid ? await fromUuid(spec.regionUuid) : null;
        const say = (key, data) => ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<p>${t(key, { name: effect?.name ?? region?.name ?? action.name, ...data })}</p>`,
        });
        if (!effect && !region) return say("Sustain.Gone");
        const round = roundFor(actor);
        if (!canSustain(spec, round)) return say(spec.castRound !== null && round <= spec.castRound ? "Sustain.NotYet" : "Sustain.Already");

        if (region) {
            const now = await Sustain.onRegion?.(region, spec, context);
            await action.setFlag(LIB_ID, FLAG, { ...spec, lastRound: round });
            return say("Sustain.Done", { now: now ?? "" });
        }

        const badge = effect.system?.badge;
        if (badge?.type === "counter") {
            const max = badge.max ?? badge.labels?.length ?? Infinity;
            await effect.update({ "system.badge.value": Math.min((badge.value ?? 0) + spec.step, max) });
        }
        await action.setFlag(LIB_ID, FLAG, { ...spec, lastRound: round });
        const label = effect.system?.badge?.labels?.[(effect.system.badge.value ?? 1) - 1];
        return say("Sustain.Done", { now: label ?? effect.system?.badge?.value ?? "" });
    },

    /** An effect gone takes its Sustain action with it. Active GM only. */
    registerHooks() {
        Hooks.on("deleteItem", async (item) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            const actor = item?.parent;
            if (!actor?.items || item.type === "action") return;
            const orphans = actor.items.filter((i) => i.type === "action" && i.flags?.[LIB_ID]?.[FLAG]?.effectId === item.id).map((i) => i.id);
            if (orphans.length > 0) await actor.deleteEmbeddedDocuments("Item", orphans);
        });
        // An effect from a sustained spell, wherever it lands, puts the spell's Sustain on its caster.
        Hooks.on("createItem", (item, _options, userId) => {
            if (userId !== game.user.id) return;
            const by = item.flags?.[LIB_ID]?.sustainedBy;
            if (!by?.origin || !by?.spell) return;
            (async () => Sustain.grantForSpell(await fromUuid(by.origin), await fromUuid(by.spell), { repeat: by.repeat ?? null }))().catch(() => {});
        });
        Hooks.on("pf2e.endTurn", (combatant) => Sustain.lapse(combatant?.actor, combatant?.flags?.pf2e?.roundOfLastTurnEnd ?? null));
        // An area gone — dismissed, or its minute up — takes its Sustain action off its caster.
        Hooks.on("deleteRegion", async (region) => {
            if (game.users.activeGM?.id !== game.user.id) return;
            const originUuid = region.flags?.[LIB_ID]?.lingering?.originUuid;
            const actor = originUuid ? await fromUuid(originUuid) : null;
            const orphans = actor?.items?.filter((i) => i.type === "action" && i.flags?.[LIB_ID]?.[FLAG]?.regionUuid === region.uuid).map((i) => i.id) ?? [];
            if (orphans.length > 0) await actor.deleteEmbeddedDocuments("Item", orphans);
        });
    },
};
