// Launches a world in the headless debug Chrome and joins it as Gamemaster, with no one at the keyboard.
//
//   npm run live:launch            # world pf
//   npm run live:launch -- other   # another world
//
// The admin password comes from FOUNDRY_ADMIN, else from ~/.config/isaacs-automation/foundry.env
// (`FOUNDRY_ADMIN=...`, mode 600). The Gamemaster's own password is FOUNDRY_GM there, if it has one; without it
// the launcher tries none, then the admin password. It is never printed. A GitHub secret will not do: the VPS cannot read one back.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const WORLD = process.argv[2] ?? "pf";
const CDP = "http://127.0.0.1:9222";
const ENV = path.join(os.homedir(), ".config", "isaacs-automation", "foundry.env");

function secret(key, required = true) {
    if (process.env[key]) return process.env[key];
    const line = fs.existsSync(ENV) ? fs.readFileSync(ENV, "utf8").split("\n").find((l) => l.startsWith(`${key}=`)) : null;
    if (!line) {
        if (required) throw new Error(`No ${key}, in the environment or in ${ENV}.`);
        return null;
    }
    return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
}
const adminPassword = () => secret("FOUNDRY_ADMIN");

async function tab() {
    const pages = await (await fetch(`${CDP}/json`)).json();
    const page = pages.find((p) => p.type === "page" && p.url.includes(":30000"));
    if (page) return page;
    return (await fetch(`${CDP}/json/new?http://127.0.0.1:30000/`, { method: "PUT" })).json();
}

async function evaluate(page, expression) {
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    const result = await new Promise((resolve) => {
        ws.addEventListener("message", (ev) => {
            const m = JSON.parse(ev.data);
            if (m.id === 1) resolve(m.result?.exceptionDetails ? null : m.result?.result?.value ?? null);
        });
        ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
    });
    ws.close();
    return result;
}

const status = async () => (await fetch("http://127.0.0.1:30000/api/status")).json();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const now = await status();
const page = await tab();
if (now.active && now.world !== WORLD) {
    await evaluate(page, `(async () => { game.shutDown?.(); return true; })()`);
    for (let i = 0; i < 20 && (await status()).active; i++) await sleep(1000);
}
if (!(await status()).active) {
    const pw = JSON.stringify(adminPassword());
    const out = await evaluate(page, `(async () => {
        // Setup's own form posts JSON; a 200 page can still be a refusal, so the launch is what tells.
        const auth = await fetch("/auth", { method: "POST", body: new URLSearchParams({ action: "adminAuth", adminPassword: ${pw} }) });
        const page = await auth.text();
        const said = /InvalidAdminKey/.test(page) && !auth.url.endsWith("/setup") ? "refused" : "accepted";
        const launch = await fetch("/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "launchWorld", world: ${JSON.stringify(WORLD)} }) });
        return JSON.stringify({ auth: auth.status, said, launch: launch.status, answer: (await launch.text()).slice(0, 160) });
    })()`);
    console.log("launch:", out);
    for (let i = 0; i < 60 && (await status()).world !== WORLD; i++) await sleep(1000);
}
const s = await status();
if (s.world !== WORLD) throw new Error(`World ${WORLD} did not come up: ${JSON.stringify(s)}`);
// /join renders its user list after load, so read it off the live page.
await evaluate(page, `location.href = "/join"; true`);
let joined = null;
for (let i = 0; i < 20 && !joined; i++) {
    await sleep(1000);
    joined = await evaluate(page, `(async () => {
        const gm = [...document.querySelectorAll('select[name="userid"] option')].find((o) => /gamemaster/i.test(o.textContent));
        if (!gm) return null;
        for (const password of ${JSON.stringify([secret("FOUNDRY_GM", false), "", secret("FOUNDRY_ADMIN", false)].filter((p) => p !== null))}) {
            const r = await fetch("/join", { method: "POST", body: new URLSearchParams({ action: "join", userid: gm.value, password }) });
            if (r.ok) { location.href = "/game"; return "joined"; }
        }
        return "refused";
    })()`).catch(() => null);
}
if (joined !== "joined") throw new Error(joined ? "The Gamemaster password was refused: set FOUNDRY_GM." : "No Gamemaster on /join.");
console.log(joined);
console.log(`World ${WORLD} is up; the tab is loading /game.`);
