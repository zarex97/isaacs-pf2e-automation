import { t } from "../i18n.mjs";
import { LIB_ID } from "../id.mjs";
import { flagOf } from "../lib/flags.mjs";
import { Relay } from "./relay.mjs";

/**
 * A page that says something else.
 *
 * *Secret Page*: "You change the target's text to different text entirely. If the text is a spellbook or a scroll, you
 * can change it to show a spell you know of secret page's level or lower … You can also transform the text into some
 * other text you have written … You can specify a password that allows a creature touching the page to change the text
 * back and forth." The page is a Foundry journal page. `{ type: "secret-page" }` reads the cast's choices — `page` (its
 * name or uuid), `text` and `password` — keeps the page's own text in a flag and shows the new text: the description of
 * one of the caster's spells when `text` names it and its rank is low enough, the words written otherwise. A card
 * carries a button for whoever touches the page: the right password swaps the two texts, back and forth.
 */

const FLAG = "secretPage";

/** A journal page by uuid, or the first of that name. */
export function findPage(ref) {
    const value = String(ref ?? "").trim();
    if (!value) return null;
    try {
        const direct = value.includes(".") ? fromUuidSync(value) : null;
        if (direct?.documentName === "JournalEntryPage") return direct;
    } catch { /* not a uuid */ }
    for (const entry of game.journal ?? []) {
        const page = entry.pages.find((p) => p.name === value);
        if (page) return page;
    }
    return null;
}

/** What the page shows: the named spell's description, if the caster knows it at this rank or lower; the words otherwise. */
export function shownText(text, spells, rank) {
    const known = spells.find((spell) => spell.name.toLowerCase() === String(text ?? "").trim().toLowerCase() && (Number(spell.rank) || 0) <= rank);
    return known ? `<h2>${foundry.utils.escapeHTML(known.name)}</h2>${known.system?.description?.value ?? ""}` : `<p>${foundry.utils.escapeHTML(String(text ?? ""))}</p>`;
}

async function swap({ pageUuid }) {
    const page = await fromUuid(pageUuid);
    const spec = flagOf(page, FLAG);
    if (!page || !spec) return;
    const showing = page.text?.content ?? "";
    await page.update({ "text.content": spec.other, [`flags.${LIB_ID}.${FLAG}.other`]: showing });
}

export async function changePage(_rider, context, chosen = {}, rank = 1) {
    const page = findPage(chosen.page);
    if (!page) {
        context.notes.push(t("SecretPage.NoPage", { page: chosen.page ?? "" }));
        return;
    }
    const spells = context.originActor?.itemTypes?.spell ?? [];
    await page.update({
        "text.content": shownText(chosen.text, spells, rank),
        [`flags.${LIB_ID}.${FLAG}`]: { other: page.text?.content ?? "", password: String(chosen.password ?? ""), casterUuid: context.originActor?.uuid ?? null },
    });
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: context.originActor }),
        content: `<p>${t("SecretPage.Changed", { page: page.name })}</p>`
            + `<div class="isaacs-automation-choice"><button type="button" data-action="isaacs-automation-secret-page">${t("SecretPage.Touch")}</button></div>`,
        flags: { [LIB_ID]: { [FLAG]: { pageUuid: page.uuid } } },
    });
}

export const SecretPage = {
    registerHooks() {
        Relay.register("secretPageSwap", swap);
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const spec = flagOf(message, FLAG);
            const button = spec?.pageUuid && html?.querySelector?.('[data-action="isaacs-automation-secret-page"]');
            if (!button || button.dataset.bound) return;
            button.dataset.bound = "1";
            button.addEventListener("click", async () => {
                const page = await fromUuid(spec.pageUuid);
                const secret = flagOf(page, FLAG);
                if (!secret) return;
                const data = await foundry.applications.api.DialogV2.input({
                    window: { title: page.name },
                    content: `<p>${t("SecretPage.Password")}</p><div class="form-group"><input type="text" name="password"></div>`,
                    rejectClose: false,
                });
                if (!data) return;
                if (String(data.password ?? "") !== secret.password || !secret.password) {
                    ui.notifications.warn(t("SecretPage.Wrong"));
                    return;
                }
                await Relay.request({ action: "secretPageSwap", pageUuid: page.uuid });
            });
        });
    },
};
