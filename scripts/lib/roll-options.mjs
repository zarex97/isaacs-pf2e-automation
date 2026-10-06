/**
 * The option set a targeting or rider predicate is tested against.
 *
 * Two families are in here. The first is the system's own: `Actor#getSelfRollOptions("target")` produces
 * `target:trait:undead`, `target:creature`, `target:size:large`, and those mean the same thing here that
 * they mean anywhere else in pf2e — a GM who knows the system's predicates already knows these.
 *
 * The second is ours, prefixed `rider:`. It exists because an escalating rider has to ask questions about
 * the target's *current* state — is it blinded yet, how many needles does it have, did that damage take it
 * to zero — and the answers have to be exact and stable. Reverse-engineering which of pf2e's internal
 * option strings happen to encode those, and depending on them not changing, is the fragile way to do it.
 * These are generated here, documented, and testable without Foundry.
 */

const RIDER = "rider";

export function targetingOptions(originActor, targetActor, item) {
    const options = new Set();
    for (const option of originActor?.getRollOptions?.() ?? []) options.add(option);
    for (const option of targetActor?.getSelfRollOptions?.("target") ?? []) options.add(option);
    for (const option of item?.getRollOptions?.("item") ?? []) options.add(option);
    // The module's own exact statements about the target, so a Technique can be aimed by the same facts a
    // rider is chosen by. Scorpio needs it: "one creature with at least 5 needles" is a requirement on the
    // target's counter, and pf2e's own option set says nothing about an effect's badge.
    for (const option of describeActor(targetActor, "target")) options.add(option);
    return options;
}

/**
 * The full option set for a rider, taken as a snapshot *before* anything is applied.
 *
 * The snapshot is what makes an escalation ladder work. Virgo's sense loss is four riders on the same
 * outcome, each predicated on the step before it; because every predicate is tested against the state as
 * it was when the Strike landed, exactly one of them can match, and the target loses exactly one sense per
 * hit rather than all four at once.
 */
export function riderOptions({ originActor, targetActor, item, extra = [] } = {}) {
    const options = targetingOptions(originActor, targetActor, item);
    for (const option of describeActor(targetActor, "target")) options.add(option);
    for (const option of extra) options.add(option);
    return options;
}

/** Module-owned, exact statements about an actor's current conditions, effects and health. */
export function describeActor(actor, prefix = "target") {
    const options = [];
    if (!actor) return options;
    const at = `${RIDER}:${prefix}`;

    for (const condition of actor.itemTypes?.condition ?? []) {
        if (condition.active === false) continue;
        const slug = condition.slug;
        options.push(`${at}:condition:${slug}`);
        const value = condition.system?.value?.value;
        if (typeof value === "number") {
            options.push(`${at}:condition:${slug}:${value}`);
            for (let n = 1; n <= value; n++) options.push(`${at}:condition:${slug}:${n}+`);
        }
    }

    for (const effect of actor.itemTypes?.effect ?? []) {
        const slug = effect.slug;
        if (!slug) continue;
        options.push(`${at}:effect:${slug}`);
        const badge = effect.system?.badge;
        if (badge?.type === "counter" && typeof badge.value === "number") {
            options.push(`${at}:effect:${slug}:${badge.value}`);
            for (let n = 1; n <= badge.value; n++) options.push(`${at}:effect:${slug}:${n}+`);
        }
    }

    const hp = actor.hitPoints;
    if (hp) {
        if (hp.value <= 0) options.push(`${at}:hp-zero`);
        if (hp.max > 0 && hp.value <= hp.max / 2) options.push(`${at}:hp-half-or-less`);
    }

    // Light sensitivity is an ability on the stat block, not a trait, so pf2e emits nothing for it.
    const LIGHT = ["light-blindness", "light-sensitivity", "light-sensitive"];
    if (actor.items?.some((i) => LIGHT.includes(i.slug ?? game.pf2e?.system?.sluggify?.(i.name)))) {
        options.push(`${at}:light-sensitive`);
    }

    return options;
}

/** What the damage was, for a `damage-applied` rider to predicate on. */
export function describeDamage({ types = [], total = 0, outcome = null } = {}) {
    const options = [`${RIDER}:damage`];
    for (const type of types) if (type) options.push(`${RIDER}:damage:type:${type}`);
    if (total > 0) options.push(`${RIDER}:damage:dealt`);
    if (outcome) options.push(`${RIDER}:damage:outcome:${outcome}`);
    return options;
}

/** Test a raw predicate array from an item flag. An empty or absent predicate passes. */
export function testPredicate(predicate, options) {
    if (!Array.isArray(predicate) || predicate.length === 0) return true;
    const Predicate = game.pf2e?.Predicate;
    if (!Predicate) return true;
    try {
        return new Predicate(predicate).test(options);
    } catch (error) {
        console.error("Isaac's Homebrew | invalid predicate", predicate, error);
        return true;
    }
}
