import { DamageBus, describeActor, describeDamage } from "../../automation.mjs";
import { LIB_ID } from "../id.mjs";
import {
    bypassEntriesOn,
    ignoresHardness,
    ignoredImmunities,
    mergeBypass,
    resistanceReduction,
    selectEntries,
    shadowTarget,
} from "./bypass.mjs";
import { OUTCOMES, isAbilityUse, ridersOn } from "./data.mjs";
import { Relay } from "./relay.mjs";

/**
 * Where the engine's own damage-bus stages fall. Published, so another module's stage can say where it
 * sits relative to them: the bypass shadows a target before anything else reads it, and the riders read
 * the damage after whatever corrections land in between.
 */
export const RIDER_PRIORITY = { bypass: 0, riders: 30 };

/**
 * Where events come from.
 *
 * Each of these does the same small job: notice that something happened, work out the four things a rider
 * needs — which event, whose item, which target, what outcome — and hand it to the relay. None of them
 * decides what to apply; that is the GM's side, reading the riders off the item itself.
 *
 * Every source fires on exactly one client, which is what keeps a rider from being applied five times at a
 * five-player table. For chat messages that is the message's author; for `applyDamage` it is whoever
 * clicked apply; for turns it is the active GM.
 */
/**
 * Feet between two tokens, by the scene's own grid.
 *
 * `measurePath` is what pf2e's own range checks use, so a diagonal counts the way the table counts it.
 * Falls back to a straight line when there is no grid measurement to be had, which is better than
 * refusing to fire at all.
 */
function distanceBetween(a, b) {
    const measured = canvas.grid?.measurePath?.([a.center, b.center])?.distance;
    if (Number.isFinite(measured)) return measured;
    const feetPerPixel = (canvas.scene?.grid?.distance ?? 5) / (canvas.grid?.size ?? 100);
    return Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y) * feetPerPixel;
}

/**
 * The document that will actually be holding the new hit points.
 *
 * Never the one `applyDamage` was called on, and for two separate reasons:
 *
 *  - **A contextual clone.** pf2e's own apply button does
 *    `token.actor.getContextualClone(…).applyDamage(…)` (`chat-message/helpers.ts`), so `this` inside the
 *    wrapper is a throwaway built for the roll options. The update it issues reaches the real actor; the
 *    clone's own `hitPoints` never move again.
 *  - **A synthetic actor.** An unlinked token's actor is rebuilt from the token delta on every update, so
 *    even the real instance is replaced rather than mutated.
 *
 * Both were one bug wearing two faces, and fixing only the second is how this came back: an NPC read
 * correctly through `actor.token.actor` while every **character** — whose `token` is null — kept reading
 * the clone. Driven live, a character went from 41 hit points to 27 and the wrapper still read 41 four
 * hundred milliseconds later.
 *
 * So: the token the damage was applied *through* first, because pf2e passes it and it is the most
 * specific answer; then the token the actor is standing on; then the world actor the clone was made
 * from, which shares its id.
 */
function liveActorFor(actor, params) {
    const passed = params?.token?.document ?? params?.token ?? null;
    return passed?.actor ?? actor.token?.actor ?? (actor.id ? game.actors?.get(actor.id) : null) ?? actor;
}

export const Sources = {
    register() {
        // Saves, via pf2e-toolbelt's Target Helper. Fires on the client that rolled.
        Hooks.on("pf2e-toolbelt.rollSave", (payload) => Sources.onSave(payload));
        Hooks.on("pf2e-toolbelt.rerollSave", (payload) => Sources.onSave(payload));

        Hooks.on("createChatMessage", (message, _options, userId) => Sources.onMessage(message, userId));
        Hooks.on("pf2e.endTurn", (combatant) => Sources.onTurn("turn-end", combatant));
        Hooks.on("pf2e.startTurn", (combatant) => Sources.onTurn("turn-start", combatant));
        Hooks.on("pf2e.endTurn", (combatant) => Sources.onAuraTurn("turn-end", combatant));
        Hooks.on("pf2e.startTurn", (combatant) => Sources.onAuraTurn("turn-start", combatant));
        Hooks.on("createItem", (item, _options, userId) => Sources.onAuraTick(item, userId));

        Sources.registerDamageStages();
    },

    /**
     * A creature standing in an aura the caster is carrying.
     *
     * pf2e's own `Aura` rule element does the geometry, and only the geometry. The schema offers
     * `events: ["enter", "turn-start", "turn-end"]` and it reads that list **once**, to pick a default for
     * `removeOnExit`:
     *
     * ```ts
     * effect.removeOnExit ??= Array.isArray(effect.events) ? effect.events.includes("enter") : false;
     * ```
     *
     * That is the whole of it. `applyAreaEffects` never looks at `events` again — an aura effect is granted
     * the moment a token is inside, whenever `checkAuras` next runs, which is on token movement, a
     * disposition change or a scene preparation. So "enemies that end **their** turn in it" was paid out
     * whenever somebody walked past, and never at the end of anybody's turn.
     *
     * The marker is `Effect: Aura Tick` — content-free by design, so any Technique with a persistent aura
     * can reuse it. `flags.pf2e.aura` is stamped onto it natively by `applyAreaEffects`, and that is how
     * this is told which aura it belongs to and whose.
     *
     * The marker is deleted the moment it is read, win or lose: pf2e's re-grant check skips an effect the
     * target already carries (`itemTypes.effect.some(e => e.sourceId === uuid)`), so a marker left standing
     * would mean the aura fires exactly once, ever.
     *
     * **This path is the `enter` half only.** `turn-start` and `turn-end` are driven from the encounter
     * instead — see `onAuraTurn` — because pf2e will not time them, and the marker's arrival says nothing
     * about whose turn it is.
     */
    async onAuraTick(item, userId) {
        if (!enabled() || game.user.id !== userId) return;
        const stamp = item?.flags?.pf2e?.aura;
        if (!stamp || item.slug !== "effect-aura-tick") return;

        // `getActiveTokens` hands back the `TokenDocument` itself, not a canvas placeable — there is no
        // `.document` to go one step further through, and doing so anyway threw an error nothing here
        // caught: the marker was granted, read, and deleted, and the tick it was supposed to carry never
        // reached the relay at all.
        const target = item.actor;
        const targetToken = target?.getActiveTokens(true, true).at(0);
        const sourceId = item.sourceId;
        await item.delete();
        if (!target || !targetToken) return;

        const originActor = stamp.origin
            ? (await fromUuid(stamp.origin))?.actor ?? (await fromUuid(stamp.origin))
            : null;
        if (!originActor) return;

        // Only an aura that says `enter` pays out here. One that says `turn-end` gets its marker on contact
        // too, and paying that out would be the original bug with extra steps.
        const entry = originActor.auras?.get?.(stamp.slug)?.effects?.find((e) => e.uuid === sourceId);
        if (entry && !entry.events?.includes("enter")) return;

        await Sources.dispatchAuraTick(originActor, stamp.slug, targetToken);
    },

    /**
     * The half pf2e does not time: an aura that pays out at the start or end of a creature's **own** turn.
     *
     * Driven from the encounter rather than from the marker, because the marker's arrival is a fact about
     * where tokens are standing and says nothing about whose turn it is. Every token on the board is asked
     * whether the creature whose turn just turned is standing in an aura of theirs that named this moment.
     *
     * Runs on the active GM alone, the same as `onTurn`, so a five-player table pays out once.
     */
    async onAuraTurn(event, combatant) {
        if (!enabled() || game.users.activeGM?.id !== game.user.id) return;
        const token = combatant?.token;
        const standing = token?.actor;
        if (!token || !standing) return;

        for (const other of token.scene?.tokens ?? []) {
            const originActor = other.actor;
            if (!originActor || other.id === token.id) continue;
            for (const [slug, aura] of originActor.auras ?? []) {
                const entry = (aura.effects ?? []).find(
                    (e) => e.events?.includes(event) && auraCatches(e, originActor, standing),
                );
                if (!entry) continue;
                // The geometry stays pf2e's: `containsToken` is what the aura's own check uses.
                if (!other.auras?.get?.(slug)?.containsToken?.(token)) continue;
                await Sources.dispatchAuraTick(originActor, slug, token);
            }
        }
    },

    /**
     * Hand one aura's tick to the relay, with the rider that belongs to **that** aura.
     *
     * The riders that say what a tick is worth live on the origin's own effect, and that effect used to be
     * found by asking the actor for the first item carrying an `aura-tick` rider at all. A Ryūjin Jakka in
     * Full Release carries two — the pressure emanation, and whichever cardinal aspect is up — so Minami's
     * ash rolled the pressure's Will save instead of its own Reflex and the grab never happened. The
     * `Aura` rule's slug is stamped on the marker and written on the rule, so it is what they match by.
     *
     * The loose search is kept as a fallback for an aura whose rider lives on a different item from its
     * `Aura` rule, which is how the first one was written.
     */
    async dispatchAuraTick(originActor, slug, targetToken) {
        const originEffect = effectForAura(originActor.items ?? [], slug);
        if (!originEffect) return;

        await Relay.request({
            action: "applyRiders",
            event: "aura-tick",
            itemUuid: originEffect.uuid,
            originUuid: originActor.uuid,
            targetUuid: targetToken.uuid,
        });
    },

    /**
     * A save rolled by pf2e's own button, rather than through the Target Helper's rows.
     *
     * Every save rider in the module reached the relay through `pf2e-toolbelt.rollSave`, and the Target
     * Helper renders its per-target rows on a spell's own card and **not on a variant's**. The Heat's
     * *Burner Finger* is the only Technique in the class built out of variants, so its three area options
     * had no rows at all — and pf2e's own `Save` button rolled them perfectly well and told this module
     * nothing. Driven live: a dummy critically failed Burner Finger Four's Reflex save and took none of
     * the 1d4 persistent fire the clause promises.
     *
     * The two roads are disjoint, which is what makes a second source safe rather than a double
     * application: the Target Helper rolls with `createMessage: false` and writes the result onto the
     * card, so it creates no message for this hook to see, while pf2e's button creates exactly this one.
     *
     * No `itemUuid` travels with the request, deliberately. A variant spell's uuid is the *base* spell's —
     * the overlay lives only in `flags.pf2e.origin.variant` — so a uuid sent across the socket would
     * resolve GM-side to Burner Finger One and carry One's riders. `ChatMessagePF2e#item` rebuilds the
     * variant from those same flags, and `resolveContext` reads the item off the message for exactly that
     * reason.
     */
    async onSaveMessage(message, context) {
        if (!OUTCOMES.includes(context?.outcome)) return;

        // The loop guard. A save this module rolled itself (`runSave`) produces a message like any other,
        // and its riders have already been dispatched by the rider that asked for the save — dispatching
        // them again from here is how *Aurora Execution* forces a save that forces a save forever.
        if (context.options?.includes(`${LIB_ID}:rider-save`)) return;

        // The origin is on the roll's own context, put there by pf2e when the save knows what it is against.
        // A save rolled off a character sheet has none, and is not an event this module has anything to say
        // about.
        const originUuid = context.origin?.token ?? context.origin?.actor;
        const originDoc = originUuid ? await fromUuid(originUuid) : null;
        const originActor = originDoc?.actor ?? originDoc;
        if (!originActor || originActor === message.actor) return;

        // Both slots resolve to tokens, the rule this file keeps for every other event: `applyToTarget`
        // reads `.actor` off what it is handed, and an Actor uuid resolves to something whose `.actor` is
        // undefined — a silent no-op rather than an error.
        const origin = originDoc?.documentName === "Token" ? originDoc : originActor.getActiveTokens(true, true).at(0);
        const target = message.token ?? message.actor?.getActiveTokens(true, true).at(0);
        if (!origin?.uuid || !target?.uuid) return;

        await Relay.request({
            action: "applyRiders",
            event: "save-rolled",
            messageId: message.id,
            originUuid: origin.uuid,
            targetUuid: target.uuid,
            outcome: context.outcome,
        });
    },

    async onSave({ message, target, data }) {
        if (!enabled() || !message || !target || !OUTCOMES.includes(data?.success)) return;
        await Relay.request({
            action: "applyRiders",
            event: "save-rolled",
            messageId: message.id,
            targetUuid: target.uuid,
            outcome: data.success,
        });
    },

    /**
     * Strikes.
     *
     * The attack-roll message already carries the degree of success and the token that was attacked, so no
     * wrapping is needed. Two events come out of one message, because "when you hit" and "when something
     * hits you" are both things a Cloth says: Capricorn severs on its own critical hit, Pisces' roses
     * answer somebody else's.
     */
    async onMessage(message, userId) {
        if (!enabled() || game.user.id !== userId) return;
        const context = message?.flags?.pf2e?.context;
        if (context?.type === "saving-throw") return Sources.onSaveMessage(message, context);
        if (context?.type !== "attack-roll" || !OUTCOMES.includes(context.outcome)) {
            return Sources.onActionUsed(message);
        }

        // The attacker's *token*, not their actor. Both events put this uuid in a slot that has to resolve
        // to a token: `strike-received` swaps the two, so the attacker becomes the target, and `applyToTarget`
        // reads `target.actor` off it. An Actor uuid resolves to an Actor, whose `.actor` is undefined, and
        // the whole application returns silently — no error, no warning, nothing in chat. That is why Pisces'
        // roses never drew blood even after the predicate was fixed: theirs is the only `strike-received`
        // rider in the content, so it was the only one the swap could reach.
        //
        // It also makes `strike-resolved`'s origin survive an unlinked token, which `getActiveTokens(true, …)`
        // in `resolveContext` does not: that asks for linked tokens only, and an NPC's are not.
        const attackerUuid = message.token?.uuid ?? message.actor?.uuid;
        const targetUuid = context.target?.token;
        if (!attackerUuid || !targetUuid) return;

        await Relay.request({
            action: "applyRiders",
            event: "strike-resolved",
            messageId: message.id,
            originUuid: attackerUuid,
            targetUuid,
            outcome: context.outcome,
        });

        // The mirror image: the defender's own items get a look, with origin and target swapped.
        await Relay.request({
            action: "applyRiders",
            event: "strike-received",
            messageId: message.id,
            originUuid: targetUuid,
            targetUuid: attackerUuid,
            outcome: context.outcome,
        });
    },

    /**
     * An action or ability posted to chat.
     *
     * This is how the Zenith activities and *The Twelve Arms* reach their targets. Area targeting has just
     * run for them — it wraps `toMessage` as well as `cast` — so `game.user.targets` is the set the caster
     * confirmed, and reading it here is reading their answer rather than guessing at one.
     *
     * Spells qualify too. A Technique's *save* riders come through `save-rolled` when the target rolls, but
     * a Technique that simply hands something to whoever it caught has no save to wait for.
     *
     * `isAbilityUse` is what keeps this from being every message that so much as mentions the ability —
     * including the saves and damage rolls the ability's own riders produce, which is an infinite loop. See
     * its comment in `data.mjs`.
     */
    async onActionUsed(message) {
        if (!isAbilityUse(message)) return;

        const item = message?.item;
        if (!item) return;
        const riders = ridersOn(item).filter((rider) => rider.event === "action-used");
        if (riders.length === 0) return;

        const actor = message.actor;

        // Most riders land on one creature and are sent one request per target. A `strikes` rider is the
        // exception: a volley is one activity that visits every target in order, with a penalty that grows
        // as it goes, so it has to see the whole list at once. The list travels with every request — the
        // caster's client is the only one that knows what was targeted, and by the time the GM applies it
        // their own selection is irrelevant.
        const targetUuids = [...game.user.targets].map((token) => token.document.uuid);
        const request = (targetUuid, selfOnly) =>
            Relay.request({
                action: "applyRiders",
                event: "action-used",
                messageId: message.id,
                itemUuid: item.uuid,
                originUuid: actor?.uuid,
                targetUuid,
                targetUuids,
                selfOnly,
            });

        // A Technique that buffs its own caster is cast at nobody, so waiting for `game.user.targets` to
        // have something in it would mean *Excalibur* only worked when an enemy happened to be selected.
        //
        // `selfOnly` splits the work rather than letting both halves see everything. Without it, a caster
        // with three enemies targeted sends four requests that each route the `self` rider back to their
        // own token, and the receipt cannot be relied on to swallow the extras: for a player the relay is
        // a socket emit, so the four requests reach the GM as four independent jobs that can all read the
        // message's receipt before any of them writes one.
        if (riders.some((rider) => rider.self)) {
            const own = message.token ?? actor?.getActiveTokens(true, true).at(0);
            if (own?.uuid) await request(own.uuid, true);
        }

        for (const target of game.user.targets) {
            await request(target.document.uuid, false);
        }
    },

    /**
     * Damage landing on someone.
     *
     * pf2e emits nothing here, so these are stages on the damage bus rather than hooks. Their arguments
     * carry the one thing a rider cannot work without: the item the damage came from, and so the actor
     * responsible for it. The bus reads hit points either side of the call, so "reduce a creature to 0" is
     * a fact rather than an inference.
     */
    registerDamageStages() {
        DamageBus.before("the IWR bypass", RIDER_PRIORITY.bypass, (actor, params) => Sources.applyBypass(actor, params));
        DamageBus.after("damage riders", RIDER_PRIORITY.riders, (actor, params, before) => Sources.onDamage(actor, params, before));
    },

    /**
     * Merge the origin's IWR bypasses into this application, and shadow what bypass cannot reach.
     *
     * Returns the undo function; it is called in a `finally` so a throw inside `applyDamage` can never
     * leave a target with its Hardness or resistances quietly lowered.
     */
    applyBypass(actor, params) {
        const noop = () => {};
        if (!enabled()) return noop;

        const damage = params?.damage;
        // A plain number means IWR is being skipped entirely; there is no roll to attach a bypass to.
        if (!damage || typeof damage === "number" || !Array.isArray(damage.instances)) return noop;

        const damageTypes = damageTypesOf(damage);

        // The damage may have arrived from an item that no longer exists — every Severing Art ends the
        // Severance that granted it, and the chat card then resolves `item: null`. The roll carries the
        // entries that already matched, so that is the thread back. See `registerRollBypass`.
        const stamped = damage.options?.soulboundBypass;
        const origin = params.item?.actor;
        if (!origin || origin === actor) {
            if (!Array.isArray(stamped?.entries) || stamped.entries.length === 0) return noop;
            const carried = stamped.entries.map((entry) => ({ entry, item: null }));
            return shadowTarget(actor, {
                reduction: resistanceReduction(carried),
                hardness: ignoresHardness(carried),
                immunities: ignoredImmunities(carried, stamped.types ?? damageTypes),
            });
        }

        const entries = bypassEntriesOn(origin, params.item);
        if (entries.length === 0) return noop;

        const options = new Set([
            ...(params.rollOptions ?? []),
            ...damageTypes.map((type) => `damage:type:${type}`),
            ...describeDamage({ types: damageTypes, outcome: params.outcome ?? null }),
            ...(origin.getRollOptions?.() ?? []),
            ...(params.item?.getRollOptions?.("item") ?? []),
            ...describeActor(actor, "target"),
        ]);

        const matching = selectEntries(entries, options);
        if (matching.length === 0) return noop;

        try {
            damage.options.bypass = mergeBypass(damage.options.bypass, matching, damageTypes);
        } catch (error) {
            console.error("Isaac's Homebrew | could not merge damage bypass", error);
        }

        return shadowTarget(actor, {
            reduction: resistanceReduction(matching),
            hardness: ignoresHardness(matching),
            immunities: ignoredImmunities(matching, damageTypes),
        });
    },

    async onDamage(actor, params, before) {
        if (!enabled()) return;
        const item = params?.item;
        const origin = item?.actor;
        if (!origin || origin === actor) return;

        // **Read the hit points back off the live actor, not the one we were called on.**
        //
        // See `liveActorFor`. The short version: the thing this wrapper is called on is never the
        // document that ends up holding the new number, so `after` equalled `before` and `landed` was
        // always **0** — and since the attacker's half of this event is gated on `landed > 0` it was
        // never sent at all.
        const live = liveActorFor(actor, params);
        const after = live.hitPoints?.value ?? live.system?.attributes?.hp?.value ?? 0;
        const landed = before - after;

        // The token that *took* the damage — and `params.token` is not reliably it. pf2e hands this
        // wrapper whatever token the damage was applied through, which is the controlled one, so a GM
        // with the attacker selected sends the attacker's token here. Driven live, that pointed a
        // `damage-received` event at the creature that swung. Trust the actor we were called on, and
        // accept `params.token` only when it actually belongs to them.
        // …and it may arrive as a placeable rather than a document, which has no `uuid` at all. Both
        // spellings are normalised here, because the failure mode of getting it wrong is the quietest
        // one in this file: `!target?.uuid` returns, and no rider on either side ever runs.
        const asDocument = (t) => t?.document ?? t ?? null;
        const own = asDocument(actor.getActiveTokens(true, false).at(0));
        const passed = params?.token?.actor === actor ? asDocument(params.token) : null;
        const target = passed ?? own;
        if (!target?.uuid) return;

        const damage = {
            types: damageTypesOf(params?.damage),
            total: landed,
            outcome: params?.outcome ?? null,
        };

        // The attacker's half still asks that something actually landed: a rider that reads "for each
        // creature this damages" means damage, and healing arrives here too.
        if (landed > 0) {
            await Relay.request({
                action: "applyRiders",
                event: "damage-applied",
                itemUuid: item.uuid,
                originUuid: origin.uuid,
                targetUuid: target.uuid,
                outcome: params?.outcome ?? null,
                damage,
            });
        }

        // The mirror image, exactly as `strike-received` mirrors `strike-resolved`: the creature that
        // *took* the damage gets its own items looked at, with origin and target swapped.
        //
        // `damage-applied` is the attacker's event — `collectRiders` is handed the origin's items — so a
        // rider that has to answer "I was hurt" had nowhere to live. *Zanhyō Ningyō*'s doll is the case
        // that needed it: it reduces one blow and then shatters, and "shatters" is a clause that cannot
        // be written against an event the defender never sees.
        //
        // And unlike its twin, this one fires even when **nothing got through**. The doll is the reason
        // again: it reduces damage by twice the Soulbound's level, so the blow it was spent on is often
        // the blow that costs no hit points at all — and a doll that only shatters when it failed to do
        // its job would be permanent on exactly the character who used it well. `damage.total` is 0 in
        // that case, which is the honest number and what a rider predicating on it should see.
        if (landed < 0) return; // healing: nobody took a blow
        // Both slots must resolve to a **token**, and `getActiveTokens(true, true)` asks for linked ones
        // only — an NPC's are not. That is the exact silent no-op the `strike-received` mirror documents:
        // an Actor uuid resolves to an Actor, whose `.actor` is undefined, and the whole application
        // returns without a word. The attacker's token when there is one, the defender's own otherwise.
        const attackerToken = origin.getActiveTokens(true, false).at(0)?.document?.uuid ?? target.uuid;
        await Relay.request({
            action: "applyRiders",
            event: "damage-received",
            itemUuid: item.uuid,
            originUuid: target.uuid,
            targetUuid: attackerToken,
            outcome: params?.outcome ?? null,
            damage,
        });

        // …and the third reading of one blow: somebody *else* watched it land.
        await Sources.onAllyDamaged({
            target, item, damage, outcome: params?.outcome ?? null, attackerToken,
        });
    },

    /**
     * An ally was hurt, and somebody near them can do something about it.
     *
     * Two clauses in the guide are phrased this way and neither could be written before this existed:
     *
     * > **Trigger** You **or an ally within 30 feet** takes damage from a creature you can see.
     * >   — Antithesis, guide §7C (S-63b)
     * > Once per round, when an **ally** within 60 feet would take damage, you may redirect that damage
     * >   to yourself. — The Balance, at Night, guide §7C (S-74b)
     *
     * `damage-received` is the **defender's** event: the rider engine looks at the items of the creature
     * the damage landed on, and the Quincy's Technique is not among them. So the reaction was offered to
     * the wrong person, or — as shipped — to nobody at all, and both clauses were recorded ❌ rather than
     * fixed, twice, because the module had no shape for them.
     *
     * This is that shape, and the three decisions inside it are the ones worth stating:
     *
     *  - **The range lives on the rider**, because 30 feet and 60 feet are different clauses. The source
     *    cannot know it, so the source asks: it reads each nearby ally's own riders and dispatches only
     *    when that rider's range covers the distance. A rider with no range is refused rather than
     *    treated as unlimited — an ability that reaches the whole map is never what the guide meant, and
     *    failing closed makes the mistake visible at authoring time.
     *  - **Nobody is dispatched to speculatively.** The filter runs here, before the relay, so a table
     *    with no such Technique in play pays one `ridersOn` per friendly token and sends nothing. That is
     *    what keeps a single blow from becoming one socket job per creature on the scene.
     *  - **The damaged creature is excluded.** They already had `damage-received`; offering them the same
     *    reaction twice under two names is how a defensive ability gets taken twice for one blow.
     *
     * `isAllyOf` is pf2e's own alliance test, the same one `targeting/catch.mjs` uses for
     * `affects: "allies"`, so "ally" means here what it means everywhere else in the module.
     */
    async onAllyDamaged({ target, item, damage, outcome, attackerToken }) {
        const hurt = target?.object;
        if (!hurt || !canvas?.ready) return;
        const hurtActor = target.actor;
        if (!hurtActor) return;

        for (const candidate of canvas.tokens.placeables) {
            const actor = candidate.actor;
            if (!actor || candidate.document.uuid === target.uuid) continue;
            if (!actor.isAllyOf?.(hurtActor)) continue;

            // The widest range any of this ally's `ally-damaged` riders declares. One distance
            // measurement per ally rather than one per rider, and none at all for the overwhelming
            // majority who carry no such rider.
            let reach = 0;
            for (const owned of actor.items) {
                for (const rider of ridersOn(owned)) {
                    if (rider?.event !== "ally-damaged") continue;
                    const range = Number(rider.range);
                    if (!Number.isFinite(range) || range <= 0) {
                        console.warn(
                            `Isaac's Homebrew | ${owned.name}: an \`ally-damaged\` rider needs a \`range\` in `
                            + "feet, and has none. It will never fire.",
                        );
                        continue;
                    }
                    reach = Math.max(reach, range);
                }
            }
            if (reach <= 0) continue;
            if (distanceBetween(candidate, hurt) > reach) continue;

            await Relay.request({
                action: "applyRiders",
                event: "ally-damaged",
                itemUuid: item.uuid,
                originUuid: candidate.document.uuid,
                targetUuid: candidate.document.uuid,
                // Three creatures, not two, which is what makes this event different from every other
                // one: the **watcher** whose riders are read, the **striker** the harm came from, and the
                // **ally** it landed on. `eventTarget` keeps the meaning it has on `damage-received` —
                // the creature that struck — so `trigger: true` reads the same on both, and the ally
                // gets an address of its own.
                eventTargetUuid: attackerToken,
                eventAllyUuid: target.uuid,
                // A blow leaves no chat message of its own, and the reaction offer de-duplicates on one.
                // Without this every `ally-damaged` offer after the first shared a key — the item's uuid —
                // and was swallowed for a minute: driven live, the second ally hurt in the same encounter
                // got no card at all.
                dispatchId: foundry.utils.randomID(),
                outcome,
                damage,
            });
        }
    },

    /**
     * Turn boundaries, for the auras that tick on them.
     *
     * Only the active GM acts, because the turn hooks fire on every client and an aura that resolved once
     * per player would be five times the poison it should be.
     */
    async onTurn(event, combatant) {
        if (!enabled() || game.users.activeGM?.id !== game.user.id) return;
        const actor = combatant?.actor;
        const token = combatant?.token;
        if (!actor || !token) return;

        await Relay.request({
            action: "applyRiders",
            event,
            originUuid: actor.uuid,
            targetUuid: token.uuid, // the origin's own token; area riders fan out from it
        });
    },
};

function enabled() {
    return game.settings.get(LIB_ID, "riders");
}

/** Damage types present in a roll, for `rider:damage:type:cold` and friends. */
function damageTypesOf(damage) {
    if (!damage || typeof damage === "number") return [];
    const instances = damage.instances ?? [];
    return [...new Set(instances.map((instance) => instance.type).filter((type) => type))];
}

/**
 * Whether this aura effect catches that creature — pf2e's own `auraAffectsActor`, restated.
 *
 * Restated rather than imported because it is four lines and lives inside the system bundle with no
 * export. Kept in pf2e's own order so the two can be read against each other.
 */
export function auraCatches(entry, originActor, actor) {
    if (entry.includesSelf && originActor === actor) return true;
    if (entry.affects === "allies") return actor.isAllyOf(originActor);
    if (entry.affects === "enemies") return actor.isEnemyOf(originActor);
    return entry.affects === "all" && actor !== originActor;
}

/**
 * Which of these items carries the rider for that aura. Pure, so the matching can be exercised directly.
 *
 * Exact first, loose second. The exact match is the one that fixes the bug; the loose one is the shape the
 * first aura of this kind was written in, where the `Aura` rule and the rider live on different items.
 */
export function effectForAura(items, slug) {
    const carries = (item) => ridersOn(item).some((r) => r.event === "aura-tick");
    const declares = (item) =>
        (item.system?.rules ?? []).some((rule) => rule.key === "Aura" && rule.slug === slug);
    const all = [...items];
    return all.find((item) => carries(item) && declares(item)) ?? all.find(carries) ?? null;
}
