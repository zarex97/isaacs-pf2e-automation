import { LIB_ID } from "../id.mjs";
import { t } from "../i18n.mjs";
import { isAutomated, rowsFor } from "./describe.mjs";

/**
 * A mark on everything this module automates — the item sheet's header and the item's chat card — that
 * opens a panel saying what happens, where each piece comes from, and what was left to another module.
 *
 * Everyone sees it: a player is better off knowing the spell will apply frightened for them. Only the GM
 * switches anything, because whether the table runs is a rule of the table.
 */

const ICON = "fa-solid fa-wand-magic-sparkles";
const CLASS = "isaacs-automation-indicator";

/** The item a switch writes to: a cast variant's original, so the switch outlives the cast. */
const owning = (item) => item?.original ?? item;

async function openPanel(item) {
    const rows = rowsFor(item);
    const gm = game.user.isGM;
    const target = owning(item);
    const canWrite = gm && !!target?.parent && !target.pack;
    const escape = foundry.utils.escapeHTML;
    const content = `
        <div class="${CLASS}-panel">
            ${rows.map((row) => `
                <section class="${CLASS}-row${row.applies ? "" : " is-off"}">
                    <header>
                        <strong>${escape(row.label)}</strong>
                        ${row.switchable && canWrite
                            ? `<label class="${CLASS}-switch"><input type="checkbox" name="${row.key}" ${row.applies ? "checked" : ""}> ${escape(t("Indicator.Applies"))}</label>`
                            : ""}
                    </header>
                    ${row.lines.length ? `<ul>${row.lines.map((line) => `<li>${escape(line)}</li>`).join("")}</ul>` : ""}
                    <p class="hint">${escape(row.source)}</p>
                </section>`).join("")}
            ${gm && !canWrite ? `<p class="hint">${escape(t("Indicator.NotOwned"))}</p>` : ""}
        </div>`;

    const buttons = canWrite && rows.some((row) => row.switchable)
        ? [
            { action: "save", label: t("Indicator.Save"), icon: "fa-solid fa-check", default: true, callback: (_event, button) => new foundry.applications.ux.FormDataExtended(button.form).object },
            { action: "close", label: t("Indicator.Close") },
        ]
        : [{ action: "close", label: t("Indicator.Close"), default: true }];

    const answer = await foundry.applications.api.DialogV2.wait({
        window: { title: t("Indicator.Title", { name: item.name }), icon: ICON },
        classes: [`${CLASS}-dialog`],
        content,
        buttons,
        rejectClose: false,
    });
    if (!answer || typeof answer !== "object") return;

    for (const row of rows.filter((r) => r.switchable)) {
        const wanted = !!answer[row.key];
        if (wanted === row.applies) continue;
        if (wanted) await target.unsetFlag(LIB_ID, row.key);
        else await target.setFlag(LIB_ID, row.key, false);
    }
}

function iconFor(item) {
    const link = document.createElement("a");
    link.className = CLASS;
    link.dataset.tooltip = t("Indicator.Tooltip");
    link.setAttribute("aria-label", t("Indicator.Tooltip"));
    link.innerHTML = `<i class="${ICON}"></i>`;
    link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openPanel(item);
    });
    return link;
}

export const Indicator = {
    registerHooks() {
        // pf2e 8's item sheets are Application V1: a header button, on every item sheet.
        Hooks.on("getItemSheetHeaderButtons", (sheet, buttons) => {
            const item = sheet.item ?? sheet.document;
            if (!item || !isAutomated(item)) return;
            buttons.unshift({ label: t("Indicator.Button"), class: CLASS, icon: ICON, onclick: () => openPanel(item) });
        });

        // The item's chat card: the mark beside its name.
        Hooks.on("renderChatMessageHTML", (message, html) => {
            const item = message.item;
            if (!item || !isAutomated(item)) return;
            // In order of preference — a selector list would answer with whichever comes first in the document.
            const heading = [".card-header h3", ".card-header", "header.message-header .flavor-text"].map((selector) => html.querySelector(selector)).find(Boolean);
            if (!heading || heading.querySelector(`.${CLASS}`)) return;
            heading.append(iconFor(item));
        });
    },

    /** For a macro or the console. */
    open: openPanel,
};
