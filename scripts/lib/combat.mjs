/**
 * The encounter an actor is fighting in.
 *
 * Not `game.combat`: that is whichever encounter the GM is viewing, and a scene can hold two — an old one
 * left running at round 27 and the fight that is actually happening. Among the started encounters this
 * actor is in, the active one wins, then the viewed one, then any.
 */
export function combatOf(actor, combats = globalThis.game?.combats, viewed = globalThis.game?.combat) {
    if (!actor) return null;
    const fighting = (combats?.filter?.((c) => c.started && c.combatants.some((cb) => cb.actor === actor || cb.actorId === actor.id)) ?? []);
    return fighting.find((c) => c.active) ?? fighting.find((c) => c === viewed) ?? fighting[0] ?? null;
}

/** This actor's combatant in its encounter. */
export function combatantOf(actor, combat = combatOf(actor)) {
    return combat?.combatants.find((cb) => cb.actor === actor || cb.actorId === actor?.id) ?? null;
}
