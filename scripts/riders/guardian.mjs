import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { DamageBus } from "../lib/damage-bus.mjs";

/**
 * Something that floats around a creature and takes a Strike for it, then bursts on whoever broke it.
 *
 * *Shattering Gem*: "The gem has 5 Hit Points. Each time a creature Strikes the target, the target attempts a DC 11
 * flat check. On a success, the gem blocks the attack, so the attack first damages the gem and then applies any
 * remaining damage to the target. If the gem is reduced to 0 Hit Points, it shatters, immediately dealing 1d8
 * slashing damage (basic Reflex save) to the creature that destroyed it, as long as that creature is within 10 feet
 * of the target." An effect carries `guardian: { hp, flatDc, dc, burst: { formula, type, save, range } }` — its
 * Hit Points, the flat check, the caster's DC and the burst — written when the rider makes it (`apply.mjs`).
 *
 * Read after the Strike's damage lands: on a successful flat check the guardian's Hit Points give back what they
 * absorb, which leaves the creature exactly where "the gem first, then the rest" would.
 */

const FLAG = "guardian";
const MULTIPLIER = [2, 1, 0.5, 0];

/** The guardian a creature carries, with Hit Points left, or null. */
export function guardianOf(actor) {
    return (actor?.itemTypes?.effect ?? []).find((e) => (e.flags?.[LIB_ID]?.[FLAG]?.hp ?? 0) > 0) ?? null;
}

/** How much of a blow a guardian with `hp` takes, and what it has left. */
export function absorb(hp, lost) {
    const taken = Math.max(0, Math.min(hp, lost));
    return { taken, left: hp - taken };
}

const isStrike = (params) => ["weapon", "melee"].includes(params?.item?.type) || (params?.rollOptions ?? []).includes?.("action:strike");

async function afterStrike(called, params, before) {
    if (game.users?.activeGM?.id !== game.user?.id) return;
    // The creature the blow landed on, as the world now holds it: the one `applyDamage` was called on still reads
    // its hit points from before (`encounter-damage.mjs` reads it the same way).
    const passed = params?.token?.document ?? params?.token ?? null;
    const actor = passed?.actor ?? (called.id ? game.actors?.get(called.id) : null) ?? called;
    const effect = guardianOf(actor);
    if (!effect || !isStrike(params)) return;
    const lost = before - (actor.hitPoints?.value ?? before);
    if (lost <= 0) return;
    const spec = effect.flags[LIB_ID][FLAG];
    const speaker = ChatMessage.getSpeaker({ actor });
    const flat = await new Roll("1d20").evaluate();
    const blocks = flat.total >= (spec.flatDc ?? 11);
    await flat.toMessage({ speaker, flavor: t(blocks ? "Guardian.Blocks" : "Guardian.Misses", { actor: actor.name, name: effect.name, dc: spec.flatDc ?? 11 }) });
    if (!blocks) return;

    const { taken, left } = absorb(spec.hp, lost);
    await actor.update({ "system.attributes.hp.value": (actor.hitPoints?.value ?? 0) + taken });
    if (left > 0) {
        await effect.update({ [`flags.${LIB_ID}.${FLAG}.hp`]: left });
        await ChatMessage.create({ speaker, content: `<p>${t("Guardian.Takes", { name: effect.name, taken, left })}</p>` });
        return;
    }
    await effect.delete();
    await ChatMessage.create({ speaker, content: `<p>${t("Guardian.Shatters", { name: effect.name, taken })}</p>` });
    await burst(actor, spec, params);
}

/** The guardian's burst on whoever broke it, when that creature is near enough: a basic save. */
async function burst(actor, spec, params) {
    const breaker = params?.item?.actor ?? null;
    const holderToken = actor.getActiveTokens?.(true, false)?.[0] ?? actor.getActiveTokens?.()?.[0];
    const breakerToken = breaker?.getActiveTokens?.(true, false)?.[0] ?? breaker?.getActiveTokens?.()?.[0];
    if (!breaker || !spec.burst || !holderToken || !breakerToken) return;
    const range = Number(spec.burst.range ?? 10);
    if (canvas.grid.measurePath([holderToken.center, breakerToken.center]).distance > range) return;
    const save = breaker.saves?.[spec.burst.save ?? "reflex"];
    if (!save) return;
    const rolled = await save.roll({ dc: { value: spec.dc }, skipDialog: true, extraRollOptions: ["guardian-burst"] });
    const degree = rolled?.degreeOfSuccess ?? 1;
    const DamageRoll = CONFIG.Dice.rolls.find((r) => r.name === "DamageRoll");
    const damage = await new DamageRoll(`{(${spec.burst.formula})[${spec.burst.type}]}`).evaluate();
    const dealt = Math.floor(damage.total * MULTIPLIER[degree]);
    await damage.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: t("Guardian.Burst", { target: breaker.name }) });
    if (dealt > 0) await breaker.applyDamage({ damage: dealt, token: breakerToken.document ?? breakerToken });
}

export const Guardian = {
    register() {
        DamageBus.after("a guardian that takes a Strike first", 62, afterStrike);
    },
};
