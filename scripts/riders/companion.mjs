import { t } from "../i18n.mjs";

/**
 * A caster's familiar, called to its side from wherever it is.
 *
 * *Familiar's Call*: "Your familiar dissolves and rematerializes in your space." `{ type: "fetch-familiar" }` finds the
 * familiar whose master is the caster. On the caster's scene it moves to a free square beside them; on another scene,
 * or on none, its token there is taken away and one is set down beside them. The world has no miles, so every scene is
 * within reach: the heightened ranges only ever widened a reach the table already grants.
 */

/** The familiar this actor is master of, or null. */
export function familiarOf(actor, actors = game.actors) {
    return actors?.find?.((a) => a.type === "familiar" && a.system?.master?.id === actor?.id) ?? null;
}

/** The squares around a token's own, nearest first: right, left, below, above, then the corners. */
export function besideSquares({ x, y }, grid) {
    return [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([dx, dy]) => ({ x: x + dx * grid, y: y + dy * grid }));
}

export async function fetchFamiliar(_rider, context) {
    const caster = context.originActor;
    const scene = canvas?.scene;
    const casterToken = (context.originToken?.parent === scene ? context.originToken : null)
        ?? caster?.getActiveTokens?.(true, true).find((token) => token.parent === scene);
    const familiar = familiarOf(caster);
    if (!casterToken || !familiar) {
        context.notes.push(t("Companion.None", { actor: caster?.name ?? "" }));
        return;
    }
    const grid = scene.grid.size;
    const at = { x: casterToken._source?.x ?? casterToken.x, y: casterToken._source?.y ?? casterToken.y };
    const taken = (point) => scene.tokens.some((token) => token.actor !== familiar && token._source.x === point.x && token._source.y === point.y);
    const spot = besideSquares(at, grid).find((point) => !taken(point)) ?? at;

    const here = familiar.getActiveTokens(true, true).find((token) => token.parent === scene);
    if (here) {
        await here.update(spot, { animate: false });
    } else {
        // Its tokens on every other scene: `getActiveTokens` sees only the scene on the canvas.
        for (const other of game.scenes) {
            const ids = other.tokens.filter((token) => token.actorId === familiar.id).map((token) => token.id);
            if (ids.length > 0) await other.deleteEmbeddedDocuments("Token", ids);
        }
        const source = (await familiar.getTokenDocument(spot)).toObject();
        await scene.createEmbeddedDocuments("Token", [source]);
    }
    context.notes.push(t("Companion.Arrives", { familiar: familiar.name, actor: caster.name }));
}
