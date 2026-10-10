/**
 * Senses sharpened.
 *
 * *Enhance Senses*: "The target gains low-light vision, and all of the target's imprecise senses have their distances
 * doubled. If the target already has low-light vision, they gain darkvision." An effect with `enhanceSenses` reads the
 * creature's senses as it lands and adds pf2e `Sense` rules: low-light vision — darkvision instead, when it had low-light
 * vision already — and each imprecise sense with a range again at twice that range, which pf2e keeps over the shorter.
 */

/** A creature's senses as plain `{ type, acuity, range }`. */
export function sensesOf(actor) {
    const senses = actor?.perception?.senses ?? actor?.system?.perception?.senses ?? [];
    return [...(senses.contents ?? senses)].map((sense) => ({ type: sense.type, acuity: sense.acuity, range: sense.range }));
}

/** The rules that sharpen these senses. */
export function enhancedSenseRules(senses) {
    const has = (type) => senses.some((sense) => sense.type === type);
    const rules = [{ key: "Sense", selector: has("low-light-vision") ? "darkvision" : "low-light-vision" }];
    for (const sense of senses) {
        const range = Number(sense.range);
        if (sense.acuity !== "imprecise" || !Number.isFinite(range) || range <= 0) continue;
        rules.push({ key: "Sense", selector: sense.type, acuity: "imprecise", range: range * 2 });
    }
    return rules;
}
