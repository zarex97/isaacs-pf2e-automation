import { DetectionModes } from "../lib/detection-modes.mjs";
import { LIB_ID } from "../id.mjs";

/**
 * Light that gives a creature away.
 *
 * *Revealing Light*: "A creature affected by revealing light is Dazzled. If the creature was Invisible, it becomes
 * Concealed instead. If the creature was already concealed for any other reason, it is no longer concealed." An
 * effect with `reveals` marks its holder. Every token that sees gets one more detection mode, *revealed*, which sees a
 * marked creature (within sight, not through walls) — and, when it is invisible, through the hidden, undetected or
 * unnoticed that pf2e hides an invisible creature with — so the creature shows on the board.
 * And `concealment` answers, for an attack, whether its target counts as concealed: a revealed creature only if it is
 * invisible; otherwise a concealed one, or — *See the Unseen*: "You can see invisible creatures as though they weren't
 * invisible, although their features are blurred, making them Concealed" — an invisible one to an attacker with
 * see-invisibility.
 */

const FLAG = "reveals";
export const REVEALED_MODE = "isaacsRevealed";

/** Is this actor under a revealing effect? */
export function isRevealed(actor) {
    return (actor?.itemTypes?.effect ?? []).some((e) => e.flags?.[LIB_ID]?.[FLAG]);
}

/** Can this actor see invisible creatures — pf2e's see-invisibility sense? */
export function seesInvisible(actor) {
    const senses = actor?.perception?.senses;
    return typeof senses?.has === "function" ? senses.has("see-invisibility") : false;
}

/** Does the target count as concealed to this attacker? */
export function concealment({ revealed, invisible, concealed, seesInvisibility }) {
    if (revealed) return invisible;
    if (invisible && seesInvisibility) return true;
    return concealed;
}

/** The facts `concealment` reads, off the two actors. */
export function concealmentOf(attacker, target) {
    return concealment({
        revealed: isRevealed(target),
        invisible: !!target?.hasCondition?.("invisible"),
        concealed: !!target?.hasCondition?.("concealed"),
        seesInvisibility: seesInvisible(attacker),
    });
}

/** Does the revealed mode see this creature: revealed, and — if it is unseen at all — unseen only for its invisibility? */
export function revealedSees(actor) {
    if (!isRevealed(actor)) return false;
    const unseen = actor.hasCondition?.("hidden", "undetected", "unnoticed");
    return !unseen || !!actor.hasCondition?.("invisible");
}

export const Reveal = {
    /** The detection mode, at `init`: Foundry reads `CONFIG.Canvas.detectionModes` as tokens prepare. */
    registerMode() {
        const Base = foundry.canvas.perception.DetectionMode;
        class RevealedDetectionMode extends Base {
            _canDetect(_visionSource, target) {
                const document = target?.document;
                if (!document?.actor || document.hidden) return false;
                return revealedSees(document.actor);
            }
        }
        CONFIG.Canvas.detectionModes[REVEALED_MODE] = new RevealedDetectionMode({
            id: REVEALED_MODE,
            // Foundry localizes the label as it shows it; the key is the module's.
            label: `ISAACS_AUTOMATION.${"Reveal.Mode"}`,
            type: Base.DETECTION_TYPES.SIGHT,
            walls: true,
            angle: false,
        });
        DetectionModes.after("a revealed creature is seen", 50, (token) => {
            const modes = token.detectionModes;
            if (!modes || Array.isArray(modes)) return;
            const sees = modes.lightPerception?.enabled || modes.basicSight?.enabled;
            if (sees) modes[REVEALED_MODE] = { enabled: true, range: Infinity };
        });
    },
};
