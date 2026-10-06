/**
 * Every word this module shows a person comes from `lang/<language>.json`, under one prefix.
 *
 * Read at call time, never at import: the offline tests load these modules where `game` does not exist,
 * and there the key itself comes back — with its data appended, so a test can still see what was said.
 */
export const PREFIX = "ISAACS_AUTOMATION";

export function key(path) {
    return `${PREFIX}.${path}`;
}

export function t(path, data) {
    const i18n = globalThis.game?.i18n;
    const full = key(path);
    if (!i18n) return data ? `${full} ${JSON.stringify(data)}` : full;
    return data ? i18n.format(full, data) : i18n.localize(full);
}
