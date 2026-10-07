import { DamageBus } from "../lib/damage-bus.mjs";
import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * A shield that ends when it blocks.
 *
 * *Shield*: "While the spell is in effect, you can use the Shield Block reaction with your magic shield …
 * After you use Shield Block, the spell ends and you can't cast it again for 10 minutes." pf2e blocks with the
 * spell's shield — its Hardness comes off the damage — and leaves the spell standing, since a shield with no
 * Hit Points records no damage to say a block happened. The damage call itself does say so
 * (`shieldBlockRequest`), and the effect that raised the shield is named by the shield (`itemId`): an effect
 * marked `endsOnBlock` ends there, and what it names (`immunity`, a pf2e effect uuid) goes on in its place.
 */

const PRIORITY = 85;

/** Did this damage call block with a shield raised by an effect that ends on a block? Returns that effect. */
export function blockingEffect(actor, params) {
    if (!params?.shieldBlockRequest) return null;
    const itemId = actor?.attributes?.shield?.itemId;
    const effect = itemId ? actor.items?.get?.(itemId) : null;
    return effect?.flags?.[LIB_ID]?.endsOnBlock ? effect : null;
}

export const ShieldBlock = {
    register() {
        DamageBus.after("a shield that ends when it blocks", PRIORITY, async (actor, params) => {
            const effect = blockingEffect(actor, params);
            if (!effect) return;
            const { immunity } = effect.flags[LIB_ID].endsOnBlock;
            const name = effect.name;
            await effect.delete();
            const source = immunity ? (await fromUuid(immunity))?.toObject() : null;
            if (source) await actor.createEmbeddedDocuments("Item", [source]);
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `<p>${t("ShieldBlock.Ended", { actor: actor.name, name })}</p>`,
            });
        });
    },
};
