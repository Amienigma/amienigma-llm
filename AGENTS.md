# Amienigma AI — agent notes

Brand-owned notes for **Amienigma/amienigma-llm** (product: **Amienigma AI**).

> Ask anything. Paint stills. Film short clips.

Studio: The Original Enigma Studios / Amienigma Studios. Aesthetic DNA: Neglect Archive · Dark Romanticism · 108 LOCK (teal weather, magenta pulse, one true object) — carry lightly in product copy; do not gothic every reply.

This repo was scaffolded from Grok App Builder. Platform files under `.grok/`, `server/`, `scripts/grok-pwa-*`, and `public/__grok/` are still needed for build, preview, and deploy. Soften brand voice; do **not** strip those contracts.

Depth for scaffold/auth/deploy still lives in `.grok/references/*.md` and `.grok/skills/*/SKILL.md` — open on demand.

---

## Product identity

- Name: **Amienigma AI** (never Meta AI / Orbit).
- System voice: `prompts/system-amienigma-ai.md` (source of truth); live chat embeds a compact form in `src/routes/api/chat.ts`.
- Discover / starters: `src/data/discover.ts` — mix usable presets with Neglect Archive + 108 LOCK DNA; not every card is cybercore.
- Visual IP companion: [Amienigma/108-lock](https://github.com/Amienigma/108-lock) → **108 LOCK**.

---

## Hard contracts (do not break)

1. **Preview / port:** app listens on `0.0.0.0:8080` via `npm run dev` (never raw `vite`). Keep `/workspace/startup.sh` in sync and idempotent.
2. **Do not delete:** `public/__grok/`, `server/`, `scripts/grok-pwa-*`, `grokPwaPlugin()`, `<PreviewHostBridge />`, nitro `serverDir: "./server"`.
3. **Env:** never commit `.env`. `XAI_API_KEY` is server-only. Browser only gets `VITE_*`. Auth/db stay OFF unless the product ask requires accounts (`VITE_AUTH_ENABLED` / `.grok/app-env.json`).
4. **Deploy target:** Vercel via Nitro preset `vercel` (see `.grok/references/deploy-target.md`). `npm run build` + `npm run typecheck` must pass; smoke the built preview, not only dev.
5. **Shell files:** keep `src/router.tsx` (`getRouter`), `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/styles.css` contracts from `.grok/references/scaffold.md`.

---

## Skills (consult before building)

Open matching `.grok/skills/*/SKILL.md` before shipping UI/games/auth/data work:

- DOM / overlay UI → `design-ui`
- Games / canvas / 3D → `building-games` (+ `controls` before WASD)
- Viewer connector data → `app-data`
- Auth / Neon → only when accounts or shared DB are explicitly required

Only call `imagine_*` tools when they appear in your available tools list.

---

## Communication

Speak in product terms to the user. Do not ask them to open localhost, run shell commands, or QA your preview. Verify renders yourself (browser smoke / screenshots under `screenshots/`).

---

## Quick reference

```text
brand:   Amienigma AI · Neglect Archive · 108 LOCK (light touch)
auth/db: OFF by default
never:   strip Grok platform chrome; invent imagine_* calls; abandon startup.sh
prompts: prompts/  |  discover: src/data/discover.ts
```

For the full historical App Builder sandbox contract, see git history of this file prior to the Amienigma soft-pass. Prefer this shorter brand-owned note going forward.
