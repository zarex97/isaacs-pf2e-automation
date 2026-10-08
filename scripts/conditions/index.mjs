import { key, t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { CastPipeline } from "../cast-pipeline.mjs";
import { ActorPreparation } from "../lib/actor-preparation.mjs";
import { CheckPipeline } from "../lib/check-pipeline.mjs";
import { combatantOf } from "../lib/combat.mjs";
import { DamageBus } from "../lib/damage-bus.mjs";
import { MovementCost } from "../lib/movement-cost.mjs";
import { wrap } from "../lib/wrap.mjs";
import { concealmentOf } from "../riders/reveal.mjs";
import * as R from "./rules.mjs";

/**
 * pf2e's conditions, made to do what their text says.
 *
 * pf2e carries most of a condition's numbers — the penalties, the conditions one grants, the overrides — and
 * leaves the rest to the table: frightened never drops, stunned never counts down, dying never rolls its
 * recovery or kills, healing wakes nobody. Each sentence is a clause of `Docs/clauses/pf2e-conditions.md`, and
 * what pf2e leaves undone is done here, behind the **Automate conditions** setting. Everything that writes to a
 * sheet runs on the active GM, who may write to every one.
 */

const SETTING = "conditions";

export function conditionsAutomated() {
    try {
        return !!game.settings.get(LIB_ID, SETTING);
    } catch {
        return false;
    }
}

const activeGM = () => game.users?.activeGM?.id === game.user?.id;
const valueOf = (actor, slug) => {
    const c = actor?.getCondition?.(slug);
    if (!c?.active) return 0;
    return Number(c.value ?? 1) || 1;
};
const holds = (actor, slug) => valueOf(actor, slug) > 0;
const say = (actor, text, whisper = false) =>
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${text}</p>`, ...(whisper ? { whisper: ChatMessage.getWhisperRecipients("GM").map((u) => u.id) } : {}) });

/** Set a valued condition to exactly `value` (0 removes it). */
async function setValue(actor, slug, value) {
    const current = actor.getCondition(slug);
    if (value <= 0) {
        if (current) await actor.decreaseCondition(slug, { forceRemove: true });
        return;
    }
    if (!current) await actor.increaseCondition(slug, { value });
    const now = actor.getCondition(slug);
    if (now && now.value !== value) await now.update({ "system.value.value": value });
}

/** Actors this module is writing dying to itself, so the hooks on dying do not answer their own writes. */
const writing = new Set();

/* -------------------------------------------------------------------------------------------- */
/*  Death                                                                                         */
/* -------------------------------------------------------------------------------------------- */

/** May this module kill this actor? The **Automate death effects** setting decides, as it does for riders. */
function mayKill(actor) {
    let mode = "npcs";
    try {
        mode = game.settings.get(LIB_ID, "automateDeath");
    } catch {
        /* the rider engine stood down; its default holds */
    }
    if (mode === "off") return false;
    return mode === "all" || !actor.hasPlayerOwner;
}

const deciding = new Set();

/** CND-12b, CND-10c, CND-10d: dying at its maximum kills, and a dead creature is no longer doomed. */
async function checkDeath(actor) {
    // CND-10c: "If your maximum dying value is reduced to 0, you instantly die" — dying or not.
    const dying = valueOf(actor, "dying");
    const max = actor.attributes?.dying?.max ?? 4;
    if ((!dying && max > 0) || !R.diesAt({ dying, max })) return;
    if (actor.statuses?.has?.("dead") || deciding.has(actor.uuid)) return;
    deciding.add(actor.uuid);
    try {
        await decideDeath(actor, dying);
    } finally {
        deciding.delete(actor.uuid);
    }
}

async function decideDeath(actor, dying) {
    if (!mayKill(actor)) {
        await say(actor, t("Conditions.WouldDie", { actor: actor.name, dying }), true);
        return;
    }
    await actor.toggleStatusEffect?.("dead", { overlay: true, active: true });
    const combatant = combatantOf(actor);
    if (combatant && !combatant.isDefeated) await combatant.update({ defeated: true });
    if (actor.getCondition("doomed")) await actor.decreaseCondition("doomed", { forceRemove: true });
    await say(actor, t("Conditions.Dies", { actor: actor.name, dying }));
}

/* -------------------------------------------------------------------------------------------- */
/*  Turn upkeep                                                                                    */
/* -------------------------------------------------------------------------------------------- */

/** The start of a creature's turn: actions regained, stunned counted down, dying's recovery check. */
async function onStartTurn(combatant) {
    const actor = combatant?.actor;
    if (!actor || !conditionsAutomated() || !activeGM()) return;

    // CND-33a, CND-36b, CND-37c, CND-37e: what the turn's actions come to.
    const stunnedCondition = actor.getCondition("stunned");
    const stunned = stunnedCondition?.active ? Number(stunnedCondition.value ?? 0) : 0;
    const slowed = valueOf(actor, "slowed");
    const quickened = holds(actor, "quickened");
    // CND-37d: "Stunned might also have a duration instead, such as 'stunned for 1 minute', causing you to lose
    // all your actions for the duration" — a stunned another item grants and holds, or one with no value.
    const forDuration = stunnedCondition?.active && (!stunnedCondition.value || !!stunnedCondition.grantedBy || stunnedCondition.isLocked);
    if (forDuration) {
        await say(actor, t("Conditions.StunnedAll", { actor: actor.name }));
    } else if (stunned || slowed || quickened) {
        const turn = R.actionsAtTurnStart({ stunned, slowed, quickened });
        await say(actor, t("Conditions.Actions", { actor: actor.name, regained: turn.regained, offered: turn.offered, stunned: turn.lostToStunned, slowed: turn.lostToSlowed }));
        if (stunned) await setValue(actor, "stunned", turn.stunnedLeft);
    }

    // CND-12c: "you must attempt a recovery check at the start of your turn each round".
    // Its result is applied where every recovery check is (`onRecoveryCheck`), the sheet's button included.
    if (holds(actor, "dying") && typeof actor.rollRecovery === "function") await actor.rollRecovery();
}

/**
 * CND-12c: a recovery check's result, applied — pf2e prints what it means and changes nothing. Critical success:
 * dying −2; success −1; failure +1; critical failure +2. Losing dying then gives wounded, and reaching the
 * maximum kills, through the hooks on dying.
 */
async function onRecoveryCheck(message) {
    if (!conditionsAutomated() || !activeGM()) return;
    const context = message.flags?.pf2e?.context;
    if (context?.type !== "flat-check" || !(context.options ?? []).includes("check:statistic:dying-recovery")) return;
    const actor = message.actor;
    const degree = message.rolls?.[0]?.degreeOfSuccess ?? message.rolls?.[0]?.options?.degreeOfSuccess;
    if (!actor || !Number.isInteger(degree)) return;
    const dying = valueOf(actor, "dying");
    if (!dying) return;
    await setValue(actor, "dying", dying + R.recoveryStep(degree));
}

/** The end of a creature's turn: frightened drops by 1. */
async function onEndTurn(combatant) {
    const actor = combatant?.actor;
    if (!actor || !conditionsAutomated() || !activeGM()) return;
    // CND-19c: "at the end of each of your turns, the value of your frightened condition decreases by 1" —
    // "unless specified otherwise": a frightened another item grants and holds is left alone.
    const frightened = actor.getCondition("frightened");
    if (frightened?.active && !frightened.isLocked) await actor.decreaseCondition("frightened");
}

/**
 * CND-30b, CND-30c: the persistent damage pf2e rolls at the end of a turn is taken, and the recovery check is
 * rolled. pf2e posts the roll from the condition (`flags.pf2e.origin.uuid`) and leaves both to buttons.
 */
async function onPersistentRoll(message) {
    if (!conditionsAutomated() || !activeGM()) return;
    const uuid = message.flags?.pf2e?.origin?.uuid;
    if (!uuid || message.flags?.pf2e?.context || !message.rolls?.length) return;
    const condition = fromUuidSync(uuid);
    if (condition?.slug !== "persistent-damage" || !condition.actor) return;
    const actor = condition.actor;
    const token = actor.getActiveTokens?.(true, true)?.[0] ?? null;
    await actor.applyDamage({ damage: message.rolls[0], token, item: condition });
    if (actor.items.has(condition.id)) await condition.rollRecovery();
}

/* -------------------------------------------------------------------------------------------- */
/*  Hit points: knocked out, hurt while dying, healed awake                                        */
/* -------------------------------------------------------------------------------------------- */

const isCritical = (params) =>
    params?.outcome === "criticalSuccess" || (params?.rollOptions ?? []).some?.((o) => o === "check:outcome:critical-failure" || o === "check:outcome:critical-success");

async function afterDamage(actor, params, before) {
    if (!conditionsAutomated() || !activeGM() || actor.type !== "character") return;
    const after = actor.hitPoints?.value ?? 0;
    const dealt = typeof params?.damage === "number" ? params.damage : Number(params?.damage?.total ?? 0);
    const healed = after > before;
    const dying = valueOf(actor, "dying");

    if (healed) {
        // CND-12f, CND-39g: "You lose the dying condition automatically and wake up if you ever have 1 Hit Point or more."
        if (dying && after > 0) {
            await actor.decreaseCondition("dying", { forceRemove: true });
            if (actor.getCondition("unconscious")) await actor.decreaseCondition("unconscious", { forceRemove: true });
            await say(actor, t("Conditions.Revived", { actor: actor.name }));
            return;
        }
        // CND-39j, CND-39l: "If you are healed, you lose the unconscious condition."
        if (!dying && holds(actor, "unconscious") && after > 0) {
            await actor.decreaseCondition("unconscious", { forceRemove: true });
            await say(actor, t("Conditions.Woken", { actor: actor.name }));
        }
        return;
    }
    if (dealt <= 0 || after > 0 || actor.statuses?.has?.("dead")) return;

    // CND-12d: hurt while dying. CND-39k, CND-43c: knocked out — dying 1 (2 on a critical), plus wounded.
    const critical = isCritical(params);
    const next = R.dyingAfterDamage({ dying, wounded: valueOf(actor, "wounded"), critical, knockedOut: before > 0 });
    if (next <= dying) return;
    writing.add(actor.uuid);
    try {
        await setValue(actor, "dying", next);
    } finally {
        writing.delete(actor.uuid);
    }
    await say(actor, t(dying ? "Conditions.DyingWorse" : "Conditions.KnockedOut", { actor: actor.name, dying: next }));
}

/** CND-05h: "Each time you take damage from an attack or spell, you can attempt a flat check to recover." */
async function confusedRecovery(actor, params, before) {
    if (!conditionsAutomated() || !activeGM() || !holds(actor, "confused")) return;
    const after = actor.hitPoints?.value ?? 0;
    const type = params?.item?.type;
    const fromAttackOrSpell = ["spell", "weapon", "melee"].includes(type) || (params?.rollOptions ?? []).some?.((o) => o === "action:strike" || o.startsWith?.("item:type:spell"));
    if (!fromAttackOrSpell || after >= before) return;
    const roll = await new Roll("1d20").evaluate();
    const passed = roll.total >= 11;
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: t(passed ? "Conditions.ConfusedRecovered" : "Conditions.ConfusedStays", { actor: actor.name }) });
    if (passed) await actor.decreaseCondition("confused", { forceRemove: true });
}

/* -------------------------------------------------------------------------------------------- */
/*  Dying and wounded                                                                            */
/* -------------------------------------------------------------------------------------------- */

/** CND-43c: gaining dying while wounded adds the wounded value — when anything but this module grants it. */
async function onDyingCreated(item) {
    if (item.slug !== "dying" || !conditionsAutomated() || !activeGM()) return;
    const actor = item.actor;
    if (!actor) return;
    if (!writing.has(actor.uuid)) {
        const wounded = valueOf(actor, "wounded");
        if (wounded) {
            writing.add(actor.uuid);
            try {
                await setValue(actor, "dying", Number(item.value ?? 1) + wounded);
            } finally {
                writing.delete(actor.uuid);
            }
        }
    }
    await checkDeath(actor);
}

async function onDyingUpdated(item) {
    if (!["dying", "doomed"].includes(item.slug) || !conditionsAutomated() || !activeGM() || !item.actor) return;
    await checkDeath(item.actor);
}

/**
 * CND-12g, CND-43a, CND-43b: losing dying gives wounded 1, or raises it by 1. CND-12e: still at 0 Hit Points,
 * the creature stays unconscious — pf2e takes the unconscious dying granted away with it.
 */
async function onDyingDeleted(item) {
    if (item.slug !== "dying" || !conditionsAutomated() || !activeGM()) return;
    const actor = item.actor;
    if (!actor || actor.statuses?.has?.("dead")) return;
    await setValue(actor, "wounded", valueOf(actor, "wounded") + 1);
    if ((actor.hitPoints?.value ?? 0) <= 0 && !actor.getCondition("unconscious")) await actor.increaseCondition("unconscious");
}

/**
 * CND-15c: fascinated "ends if a creature uses hostile actions against you or any of your allies". A hostile
 * action is an attack or damage roll against a creature (`isHostileUse`); every fascinated creature that is that
 * creature, or its ally, is freed.
 */
async function onHostileAction(message) {
    if (!conditionsAutomated() || !activeGM()) return;
    const context = message.flags?.pf2e?.context;
    if (!["attack-roll", "damage-roll", "spell-attack-roll"].includes(context?.type)) return;
    const victim = context.target?.actor ? fromUuidSync(context.target.actor) : null;
    const attacker = message.actor;
    if (!victim || !attacker || victim === attacker) return;
    const freed = (canvas.scene?.tokens ?? []).map((tok) => tok.actor).filter((actor) =>
        actor && holds(actor, "fascinated") && (actor === victim || actor.isAllyOf?.(victim)));
    for (const actor of new Set(freed)) {
        await actor.decreaseCondition("fascinated", { forceRemove: true });
        await say(actor, t("Conditions.FascinationBroken", { actor: actor.name, attacker: attacker.name }));
    }
}

/**
 * CND-43d: wounded "ends if someone successfully restores Hit Points to you using Treat Wounds". CND-07d: cursebound
 * is removed by Refocusing — pf2e's Refocus is text, so its card is the moment.
 */
async function onTreatmentOrRefocus(message, userId) {
    if (!conditionsAutomated()) return;
    const context = message.flags?.pf2e?.context;
    const options = context?.options ?? [];
    // Run where the check was rolled: a Medicine check carries no target, but its roller's targets are the patients.
    if (options.includes("action:treat-wounds") && ["success", "criticalSuccess"].includes(context?.outcome)) {
        if (userId !== game.user.id) return;
        const patients = context.target?.actor ? [fromUuidSync(context.target.actor)] : [...(game.user.targets ?? [])].map((tok) => tok.actor);
        for (const patient of patients) {
            if (!patient?.isOwner || !holds(patient, "wounded")) continue;
            await patient.decreaseCondition("wounded", { forceRemove: true });
            await say(patient, t("Conditions.WoundsTreated", { actor: patient.name }));
        }
        return;
    }
    if (!activeGM()) return;
    const item = message.item;
    if (item?.slug === "refocus" && holds(message.actor, "cursebound")) {
        await message.actor.decreaseCondition("cursebound", { forceRemove: true });
        await say(message.actor, t("Conditions.Refocused", { actor: message.actor.name }));
    }
}

/**
 * CND-26d: "If you become invisible while someone can already see you, you start out hidden to them (instead of
 * undetected)." pf2e's hidden is for every observer at once, so a creature turning invisible starts hidden.
 */
async function onInvisible(item) {
    if (item.slug !== "invisible" || !conditionsAutomated() || !activeGM()) return;
    const actor = item.actor;
    if (!actor || ["hidden", "undetected", "unnoticed"].some((s) => holds(actor, s))) return;
    await actor.increaseCondition("hidden");
}

/** CND-39e: "drop items you're holding". */
async function onUnconscious(item) {
    if (item.slug !== "unconscious" || !conditionsAutomated() || !activeGM()) return;
    const actor = item.actor;
    const held = (actor?.items ?? []).filter((i) => i.system?.equipped?.carryType === "held");
    if (held.length === 0) return;
    await actor.updateEmbeddedDocuments("Item", held.map((i) => ({ _id: i.id, "system.equipped.carryType": "dropped", "system.equipped.handsHeld": 0 })));
    await say(actor, t("Conditions.Dropped", { actor: actor.name, items: held.map((i) => i.name).join(", ") }));
}

/* -------------------------------------------------------------------------------------------- */
/*  What a condition refuses                                                                     */
/* -------------------------------------------------------------------------------------------- */

const heldSlugs = (actor) => (actor?.conditions?.active ?? []).map((c) => c.slug);

function refuse(actor, name, condition) {
    ui.notifications?.warn(t("Conditions.Refused", { actor: actor?.name ?? "", name, condition }));
    return true;
}

/** An action its holder's condition refuses (CND-24a, CND-29b, CND-34b, CND-37a, CND-39a). */
export function actionRefused(action) {
    if (!conditionsAutomated() || !action?.actor) return false;
    const traits = action.system?.traits?.value ?? [];
    const condition = R.refusedBy({ held: heldSlugs(action.actor), what: ["action", ...traits], slug: action.slug });
    return condition ? refuse(action.actor, action.name, condition) : false;
}

/** A flat check a condition asks before an action or a spell takes effect (CND-09d, CND-20b, CND-38c). */
export async function flatCheckPassed(item, { spell = false } = {}) {
    if (!conditionsAutomated() || !item?.actor) return true;
    const actor = item.actor;
    const owed = R.flatCheckOwed({
        conditions: { deafened: holds(actor, "deafened"), grabbed: holds(actor, "grabbed"), stupefied: valueOf(actor, "stupefied") },
        traits: item.system?.traits?.value ?? [],
        spell,
    });
    if (!owed) return true;
    const roll = await new Roll("1d20").evaluate();
    const passed = roll.total >= owed.dc;
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: t(passed ? "Conditions.FlatPassed" : "Conditions.FlatFailed", { actor: actor.name, name: item.name, condition: owed.slug, dc: owed.dc }) });
    return passed;
}

/** CND-35c: "You can't willingly ingest anything—including elixirs and potions—while sickened." */
const INGESTED = ["potion", "elixir", "ingested"];

/* -------------------------------------------------------------------------------------------- */
/*  Registration                                                                                  */
/* -------------------------------------------------------------------------------------------- */

export const Conditions = {
    registerSettings() {
        game.settings.register(LIB_ID, SETTING, {
            name: key("Settings.Conditions.Name"),
            hint: key("Settings.Conditions.Hint"),
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        });
    },

    registerHooks() {
        Hooks.on("pf2e.startTurn", (combatant) => void onStartTurn(combatant));
        Hooks.on("pf2e.endTurn", (combatant) => void onEndTurn(combatant));
        Hooks.on("createChatMessage", (message, _options, userId) => {
            void onPersistentRoll(message);
            void onRecoveryCheck(message);
            void onHostileAction(message);
            void onTreatmentOrRefocus(message, userId);
        });
        Hooks.on("createItem", (item) => {
            if (item.type !== "condition") return;
            void onDyingCreated(item);
            void onUnconscious(item);
            void onInvisible(item);
            if (item.slug === "doomed") void onDyingUpdated(item);
        });
        Hooks.on("updateItem", (item) => {
            if (item.type === "condition") void onDyingUpdated(item);
        });
        Hooks.on("deleteItem", (item) => {
            if (item.type === "condition") void onDyingDeleted(item);
        });
        // CND-24a: an immobilized creature's token does not move, unless the GM moves it.
        Hooks.on("preUpdateToken", (token, changes) => {
            if (!conditionsAutomated() || game.user.isGM) return true;
            if (!("x" in changes || "y" in changes) || !holds(token.actor, "immobilized")) return true;
            refuse(token.actor, t("Conditions.Move"), "immobilized");
            return false;
        });
    },

    register() {
        DamageBus.after("a condition's hit points: knocked out, dying, woken", 60, afterDamage);

        // CND-29b, CND-31a, CND-37a, CND-39a: a cast refused; CND-38c: stupefied's flat check before a spell.
        CastPipeline.before("a cast a condition refuses", 3, (spell) => {
            if (!conditionsAutomated()) return true;
            const condition = R.refusedBy({ held: heldSlugs(spell?.actor), what: ["cast"], slug: spell?.slug });
            return condition ? !refuse(spell.actor, spell.name, condition) : true;
        });
        CastPipeline.before("a condition's flat check before a spell", 45, (spell) => flatCheckPassed(spell, { spell: true }));
        DamageBus.after("confused: a flat check on being hurt", 61, confusedRecovery);

        // CND-13d: "this can't reduce your Speed below 5 feet".
        ActorPreparation.after("a Speed penalised no lower than 5 feet", 40, (actor) => {
            if (!conditionsAutomated()) return;
            for (const speed of Object.values(actor.system?.movement?.speeds ?? {})) {
                if (!speed || typeof speed.value !== "number" || speed.type === "travel") continue;
                const penalized = (speed.modifiers ?? []).some((m) => (m.modifier ?? m.value ?? 0) < 0 && m.enabled !== false);
                speed.value = R.flooredSpeed({ base: speed.base, value: speed.value, penalized });
            }
        });

        // CND-01b: "All normal terrain is difficult terrain to you."
        MovementCost.after("blinded: every square difficult", 40, (token, step, cost) =>
            conditionsAutomated() && holds(token.actor, "blinded") ? R.blindedStepCost(cost, step.distance) : cost);

        // CND-29b, CND-34b, CND-37a, CND-39a: an attack its holder's condition refuses.
        CheckPipeline.gate("an attack a condition refuses", 14, (_check, context) => {
            if (!conditionsAutomated() || context?.type !== "attack-roll") return true;
            const actor = context.origin?.actor ?? context.actor;
            const condition = R.refusedBy({ held: heldSlugs(actor), what: ["attack"] });
            return condition ? !refuse(actor, context.title ?? t("Conditions.Attack"), condition) : true;
        });

        // CND-08a, CND-22d, CND-26b, CND-40e: an attack on a creature the attacker cannot see.
        CheckPipeline.gate("an attack on an unseen creature", 22, async (_check, context) => {
            if (!conditionsAutomated() || context?.type !== "attack-roll") return true;
            const attacker = context.origin?.actor ?? context.actor;
            const target = context.target?.actor;
            if (!attacker || !target) return true;
            const dc = R.attackFlatCheck({
                attacker: { dazzled: holds(attacker, "dazzled") },
                target: { hidden: holds(target, "hidden"), undetected: holds(target, "undetected"), unnoticed: holds(target, "unnoticed"), invisible: holds(target, "invisible") },
                concealedAlready: !!concealmentOf(attacker, target),
            });
            if (!dc) return true;
            const roll = await new Roll("1d20").evaluate();
            const passed = roll.total >= dc;
            await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: attacker }), flavor: t(passed ? "Conditions.UnseenPassed" : "Conditions.UnseenFailed", { attacker: attacker.name, target: target.name, dc }) });
            return passed;
        });

        // CND-22c, CND-40c: a creature is off-guard to an attacker hidden from or undetected by it.
        CheckPipeline.before("off-guard to an unseen attacker", 32, (_check, context) => {
            if (!conditionsAutomated() || context?.type !== "attack-roll" || !context.dc?.value) return;
            const attacker = context.origin?.actor ?? context.actor;
            const defender = context.target?.actor;
            if (!defender || holds(defender, "off-guard")) return;
            if (!R.offGuardToUnseen({ attacker: { hidden: holds(attacker, "hidden"), undetected: holds(attacker, "undetected"), unnoticed: holds(attacker, "unnoticed"), invisible: holds(attacker, "invisible") } })) return;
            const label = t("Conditions.OffGuardToUnseen", { name: defender.name });
            return { ...context, dc: { ...context.dc, value: context.dc.value - 2, ...(context.dc.label ? { label: `${context.dc.label} (–2 ${label})` } : {}) } };
        });

    },

    /** After `init`, so the system's document classes exist to be wrapped. */
    install() {
        // CND-35c: a potion or an elixir, refused while sickened.
        wrap(
            "CONFIG.PF2E.Item.documentClasses.consumable.prototype.consume",
            async function (wrapped, ...args) {
                const traits = this.system?.traits?.value ?? [];
                if (conditionsAutomated() && holds(this.actor, "sickened") && traits.some((tr) => INGESTED.includes(tr))) {
                    refuse(this.actor, this.name, "sickened");
                    return undefined;
                }
                return wrapped(...args);
            },
            { feature: "what sickened refuses", type: "MIXED" },
        );
    },
};
