import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * An affliction: stages, each with its damage and its conditions, and the save that moves between them.
 *
 * *Spider Sting*: "Failure The target is afflicted with spider venom at stage 1. Critical Failure … at stage 2. …
 * Maximum Duration 4 rounds; Stage 1 1d4 poison damage and Enfeebled 1 (1 round); Stage 2 1d4 poison damage and
 * Enfeebled 2 (1 round)". pf2e's own affliction item is not available outside its development builds, so the
 * affliction is an effect: its badge is the stage, its rules grant the stage's conditions (gone with it), and its
 * flag holds the stages, the DC and the rounds it has run. A stage's damage is rolled and applied as the stage
 * begins; at the end of each of the creature's turns it saves — a critical success two stages down, a success one,
 * a failure one up, a critical failure two — and below stage 1 it ends, as it does when its maximum duration passes.
 * A new stage is a new effect, so the conditions it grants are that stage's and no other's.
 */

const FLAG = "affliction";

/** How far one save moves the stage. */
export const STAGE_STEP = { criticalSuccess: -2, success: -1, failure: 1, criticalFailure: 2 };
const DEGREES = ["criticalFailure", "failure", "success", "criticalSuccess"];

/** The stage after a save: below 1 is cured (0), above the last is the last. */
export function nextStage(stage, outcome, maxStage) {
    const next = stage + (STAGE_STEP[outcome] ?? 0);
    return next < 1 ? 0 : Math.min(next, maxStage);
}

/** The effect that is the affliction at one stage. `state`: `{ name, stages, dc, maxRounds, rounds, img, level, origin }`. */
export function afflictionEffect(state, stage, conditionUuid = (slug) => `Compendium.pf2e.conditionitems.Item.${slug}`) {
    const current = state.stages[stage - 1] ?? { conditions: [] };
    const rules = (current.conditions ?? []).map((c) => ({
        key: "GrantItem",
        uuid: conditionUuid(c.slug),
        allowDuplicate: false,
        ...(c.value ? { alterations: [{ mode: "override", property: "badge-value", value: c.value }] } : {}),
    }));
    return {
        type: "effect",
        name: `${state.name} (${t("Affliction.Stage", { stage })})`,
        img: state.img ?? "icons/svg/poison.svg",
        system: {
            level: { value: state.level ?? 1 },
            badge: { type: "counter", value: stage, max: state.stages.length },
            duration: { value: -1, unit: "unlimited", expiry: null, sustained: false },
            tokenIcon: { show: true },
            traits: { value: [], rarity: "common" },
            rules,
        },
        flags: { [LIB_ID]: { [FLAG]: { ...state, stage } } },
    };
}

export const Affliction = {
    /** Afflict the rider's creature — or, already afflicted by it, take it further by the stage this exposure gives. */
    async apply(rider, context, { dc, item }) {
        const actor = context.actor;
        const spec = rider.apply;
        if (!actor || !dc) return null;
        const stage = Math.max(1, Number(spec.stage) || 1);
        const name = game.i18n.localize(spec.name ?? "");
        const existing = afflictionsOn(actor).find((e) => stateOf(e).name === name);
        if (existing) {
            const state = stateOf(existing);
            const next = Math.min(state.stage + stage, state.stages.length);
            context.notes.push(t("Affliction.Again", { actor: actor.name, name, stage: next }));
            return toStage(existing, next);
        }
        const state = {
            name,
            stages: spec.stages ?? [],
            save: spec.save ?? "fortitude",
            dc,
            maxRounds: Number(spec.maxRounds) || null,
            rounds: 0,
            img: item?.img ?? null,
            level: Number(spec.level) || item?.level || 1,
            origin: context.originActor?.uuid ?? null,
            // What kind of affliction — a poison, a disease, a curse — for whatever eases it (`cleanse.mjs`).
            traits: spec.traits ?? [],
        };
        return begin(actor, state, stage);
    },

    /**
     * One stage down, once per case — *Cleanse Affliction*'s "If it has advanced past stage one, reduce the stage by
     * one. This reduction can be applied only once to a given case". The case remembers (`cleansed`). The effect
     * that is the new stage, or the one there was.
     */
    async ease(effect) {
        const state = stateOf(effect);
        if (!state || state.cleansed || state.stage <= 1) return effect;
        await effect.update({ [`flags.${LIB_ID}.${FLAG}.cleansed`]: true });
        return toStage(effect, state.stage - 1);
    },

    /** The end of the creature's turn: a save against each affliction it carries. Active GM only. */
    async recover(actor) {
        for (const effect of afflictionsOn(actor)) {
            const state = stateOf(effect);
            const rounds = (Number(state.rounds) || 0) + 1;
            const statistic = actor.getStatistic?.(state.save);
            const roll = statistic ? await statistic.roll({ dc: { value: state.dc }, skipDialog: true, label: state.name, extraRollOptions: ["affliction", "poison"] }) : null;
            const outcome = DEGREES[roll?.degreeOfSuccess ?? -1];
            const stage = outcome ? nextStage(state.stage, outcome, state.stages.length) : state.stage;
            if (stage === 0 || (state.maxRounds && rounds >= state.maxRounds)) {
                await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${t(stage === 0 ? "Affliction.Cured" : "Affliction.Expired", { actor: actor.name, name: state.name })}</p>` });
                await effect.delete();
                continue;
            }
            await toStage(effect, stage, rounds);
        }
    },

    registerHooks() {
        Hooks.on("pf2e.endTurn", (combatant) => {
            if (game.users.activeGM?.id === game.user.id) Affliction.recover(combatant?.actor);
        });
    },
};

function afflictionsOn(actor) {
    return actor?.itemTypes?.effect?.filter((e) => e.flags?.[LIB_ID]?.[FLAG]) ?? [];
}

function stateOf(effect) {
    return effect.flags[LIB_ID][FLAG];
}

/** The affliction at a stage, and that stage's damage. */
async function begin(actor, state, stage) {
    const [created] = await actor.createEmbeddedDocuments("Item", [afflictionEffect(state, stage, conditionUuid)]);
    await stageDamage(actor, state, stage);
    return created ?? null;
}

/** Another stage — or the same one again, which is its damage again. */
async function toStage(effect, stage, rounds = stateOf(effect).rounds) {
    const actor = effect.actor;
    const state = { ...stateOf(effect), rounds };
    if (stage === state.stage) {
        await effect.update({ [`flags.${LIB_ID}.${FLAG}.rounds`]: rounds });
        await stageDamage(actor, state, stage);
        return effect;
    }
    await effect.delete();
    return begin(actor, state, stage);
}

function conditionUuid(slug) {
    return game.pf2e?.ConditionManager?.getCondition?.(slug)?.sourceId ?? `Compendium.pf2e.conditionitems.Item.${slug}`;
}

async function stageDamage(actor, state, stage) {
    const parts = (state.stages[stage - 1]?.damage ?? []).map((d) => `(${d.formula})[${d.type ?? "untyped"}]`);
    const DamageRoll = CONFIG.Dice.rolls.find((cls) => cls.name === "DamageRoll");
    if (parts.length === 0 || !DamageRoll || !actor) return;
    const roll = await new DamageRoll(parts.length === 1 ? parts[0] : `{${parts.join(",")}}`).evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `${state.name} — ${t("Affliction.Stage", { stage })}` });
    await actor.applyDamage({ damage: roll, token: actor.getActiveTokens?.(true, true)?.[0] ?? null });
}
