/**
 * A spell's description as plain text, for holding a tracker's clauses to the words pf2e prints.
 *
 * pf2e's descriptions are HTML with Foundry's enrichers in them — `@UUID[…]{Dazzled}`, `@Damage[2d6[fire]]`,
 * `@Template[burst|distance:10]`, `[[/r 1d4]]`. A clause is quoted from the text as a reader sees it, so the
 * enrichers are read the way the sheet shows them: a link by its label, a template as "10-foot burst", a roll
 * by its formula. One function for the index and the test, so both sides of the comparison are the same.
 */

/** The text inside a balanced pair of brackets starting at `open`, and the index after the closing one. */
function balanced(text, open, left = "[", right = "]") {
    let depth = 0;
    for (let i = open; i < text.length; i++) {
        if (text[i] === left) depth++;
        else if (text[i] === right && --depth === 0) return { inner: text.slice(open + 1, i), end: i + 1 };
    }
    return { inner: text.slice(open + 1), end: text.length };
}

function enricher(kind, inner) {
    if (kind === "Template") {
        const [type, ...rest] = inner.split("|");
        const distance = rest.find((part) => part.startsWith("distance:"))?.slice("distance:".length);
        return distance ? `${distance}-foot ${type}` : type;
    }
    if (kind === "UUID") return inner.split(".").pop();
    if (kind === "Check") {
        const [statistic] = inner.split("|");
        return statistic.replace(/^type:/, "");
    }
    return inner;
}

export function plainText(html) {
    let text = String(html ?? "");
    let out = "";
    for (let i = 0; i < text.length;) {
        const at = /^@(\w+)\[/.exec(text.slice(i, i + 40));
        if (at) {
            const { inner, end } = balanced(text, i + at[0].length - 1);
            let next = end;
            let label = null;
            if (text[next] === "{") {
                const close = text.indexOf("}", next);
                label = text.slice(next + 1, close);
                next = close + 1;
            }
            out += label ?? enricher(at[1], inner);
            i = next;
            continue;
        }
        if (text.startsWith("[[", i)) {
            const close = text.indexOf("]]", i);
            let next = close + 2;
            let label = null;
            if (text[next] === "{") {
                const end = text.indexOf("}", next);
                label = text.slice(next + 1, end);
                next = end + 1;
            }
            out += label ?? text.slice(i + 2, close).replace(/^\/\w+\s*/, "").replace(/\s*#.*$/, "");
            i = next;
            continue;
        }
        out += text[i++];
    }
    return out
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
}

/** The spells a clause tracker lists, from its spell table: `| VS-41 | \`floating-flame\` | …`. */
export function trackedSlugs(markdown) {
    return [...String(markdown).matchAll(/^\| VS-\d+ \| `([a-z0-9-]+)` \|/gm)].map((m) => m[1]);
}
