import { key } from "../i18n.mjs";

/**
 * Languages a vanilla spell makes up.
 *
 * *Invent Code*: "You grant the targets the ability to understand a newly invented language." pf2e keeps only the
 * languages it knows on a creature, so the language the spell grants is made known at setup. Its effect then adds it
 * to each target's languages like any other.
 */

const languages = () => ({ "invented-code": key("Languages.InventedCode") });

export const Languages = {
    register() {
        const known = CONFIG.PF2E?.languages;
        if (!known) return;
        for (const [slug, label] of Object.entries(languages())) known[slug] ??= label;
    },
};
