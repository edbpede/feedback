# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Danish AI feedback chatbot for grades 7–9 (Astro SSR + one SolidJS island + UnoCSS, deployed to Vercel).

## Essential Commands

Package manager is Bun, pinned to `bun@1.3.14` via `packageManager` in `package.json`. Run everything from the repository root.

| Command | Purpose |
| --- | --- |
| `bun install` | Install dependencies (CI uses `bun install --frozen-lockfile`) |
| `bun run dev` | Astro dev server — the only way to run the app locally (see gotchas) |
| `bun run build` | Production build; also the only compile check for the Vercel bundle |
| `bun run check` | `astro check` — type gate, **must report 0 errors** |
| `bun run lint` | `biome check .` (format + lint) |
| `bun run lint:fix` | `biome check --write .` |
| `bunx biome ci .` | Exactly what CI gates on; non-writing |

`dev`, `build`, and the CI smoke test all refuse to start without `PASSWORD_HASH`, `SESSION_SECRET`, and `NANO_GPT_API_KEY`, because `astro.config.ts` sets `validateSecrets: true`. Copy `.env.example` to `.env` and fill it, or run the interactive wizard `scripts/devserver/run.sh setup` (requires `gum`), which generates the hash and secret for you.

There is no test suite and no test runner in this repository. Full local validation is:

```bash
bunx biome ci . && bun run check && bun run build
```

CI adds one tier-1 smoke test (`.github/workflows/smoke.yml`): it boots `bun run dev` on 127.0.0.1:4321, fetches `/`, and asserts the body contains `<title>`. It does **not** exercise the island, so client-side breakage after a `solid-js` or `unocss` bump will pass CI — verify hydration manually in `bun run dev`.

## Architecture Overview

- **One page, one island.** `src/pages/index.astro` is the only page route; it renders `<App client:idle />`. The entire UI — password gate, onboarding, PII review, chat — lives inside that single SolidJS island (`src/components/App.tsx`). Everything else under `src/pages` is `/api/**`.
- **Server responsibilities are thin.** API routes verify the session, then proxy to NanoGPT. `/api/chat` returns `nanoGptResponse.body` untouched as `text/event-stream`; the client parses `data:` lines and accumulates usage in `src/lib/api.ts`. Retry policy (10 attempts, quick phase then exponential backoff) is client-side only.
- **All persistence is `localStorage`.** `src/lib/storage.ts` owns every `feedback-bot-*` key (messages, costs, onboarding state, model path, anonymization state). There is no database and no server-side session store — the cookie is a self-contained signed token.
- **Auth is HMAC-signed cookies.** `src/lib/auth.ts` signs `payload:timestamp` with `SESSION_SECRET` and verifies with `timingSafeEqual` plus a 7-day age check. Two independent cookies: `session` (main gate, `/api/auth`) and `enhanced-session` (commercial-model gate, `/api/auth-enhanced`). Every route re-verifies; there is no middleware.
- **Two model paths, deliberately isolated.** `ModelPath` is `"privacy-first"` (TEE models, hardware enclave, no anonymization) or `"enhanced-quality"` (commercial models, PII anonymization required). `src/config/models.ts` is the single registry and encodes the rule that fallbacks never cross paths.
- **PII detection is server-side and always TEE.** `/api/pii-detect` prompts a TEE model for JSON findings, validates them, and applies replacements via `applyAnonymizations`. `src/lib/api.ts` walks `PII_DETECTION_FALLBACK_MODELS` on failure.
- **Prompts are bundled, not loaded at runtime.** Subject prompts are TypeScript modules under `src/config/systemPrompts/`, registered in that directory's `index.ts`, and reached from `/api/chat` through `src/lib/promptLoader.ts`. `clearPromptCache()` is an intentional no-op kept for compatibility.
- **i18n is a signal plus two JSON files.** `src/lib/i18n/` exposes `t("dot.path")` backed by `locales/da.json` and `locales/en.json` (currently 232 keys each, in exact parity). Default locale is `da`.

## Project Boundaries

| Path | Status |
| --- | --- |
| `public/pdf.worker.min.mjs` | Vendored 1.2 MB pdf.js worker. No build step regenerates it — copy it by hand (see gotchas). |
| `tailwind.config.js` | Empty stub kept only for shadcn CLI compatibility. Real styling config is `uno.config.ts`. |
| `src/components/ui/` | shadcn-solid generated primitives (`ui.config.json`). Re-export new ones from `ui/index.ts`. |
| `.astro/`, `dist/`, `.vercel/` | Generated and gitignored; never edit or commit. |
| `.augment/rules/*.md` | General stack best-practice reference (`type: agent_requested`), not repository law. Prefer this file and actual code. |

## Common Change Workflows

**Add or change an AI model** — three files must stay in sync, or cost display and validation silently fall back:

1. Add the `ModelConfig` entry to `AVAILABLE_MODELS` in `src/config/models.ts` with the correct `pathType` (`"tee"` vs `"commercial"`).
2. Add pricing to `MODEL_PRICING` in `src/config/pricing.ts` — a missing entry silently uses `DEFAULT_PRICING`, so the cost badge lies.
3. Add `name`, `description`, `bestFor` under `onboarding.models.<key>` in **both** `da.json` and `en.json`.
4. If the model rejects the `system` role, add its id to `STRICT_ALTERNATION_MODELS` in `models.ts`; `/api/chat` then merges the system prompt into the first user message.
5. Run `bun run check` — `nameKey`/`descriptionKey`/`bestForKey` are typed as `TranslationKey`, so missing English keys fail the type gate.

**Add a subject prompt:**

1. Create `src/config/systemPrompts/<subject>.ts` exporting `SYSTEM_PROMPT`.
2. Import it and add it to both `SubjectKey` and `SUBJECT_PROMPTS` in `src/config/systemPrompts/index.ts` — an unregistered subject silently falls back to the default prompt via `getSystemPrompt`.
3. Add the key to `SUBJECT_PROMPT_MAP` in `src/config/subjectPrompts.ts`.
4. To surface it in the UI, add it to `SUBJECTS` in `src/components/onboarding/SubjectGradeStep.tsx` and add `onboarding.subjects.<key>` to both locale files.
5. Optionally map it in `SUBJECT_MODEL_MAP` (`src/config/models.ts`) to recommend a model.

**Add a user-facing string:** add the key to `en.json` first (it is the type source — `Translations = typeof en`), then to `da.json`. A key present only in `da.json` will not type-check; a key missing from `da.json` renders the raw dot-path at runtime, since `getNestedValue` returns the key as its fallback.

**Bump `pdfjs-dist`:** after the dependency bump, copy the matching worker and commit it:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

## Implementation Decisions

| Situation | Preferred approach | Avoid |
| --- | --- | --- |
| Reading a secret or API base URL | Import from `astro:env/server` (schema in `astro.config.ts`) | `process.env` / `import.meta.env`; the schema is what enforces presence at boot |
| Persisting client state | A named helper in `src/lib/storage.ts` | Calling `localStorage` directly; every helper is try/catch-wrapped so it is SSR-safe |
| Handing an error back from an API route | `ApiResponse<T>` with a populated `ErrorDetails` (`status`, `message`, `retryable`) | Bare strings or thrown errors — the retry loop in `src/lib/api.ts` and `ChatWindow`'s `retriesExhausted` flag both key off `retryable` |
| Composing class names | `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) | Manual template strings, which break UnoCSS variant de-duplication |
| Adding a heavy client dependency | Dynamic `await import()` plus a `manualChunks` entry in `astro.config.ts` | Static top-level import; see `src/lib/fileParser.ts` for the pattern |

## Repository Conventions

- Import through the `tsconfig.json` aliases: `@/*`, `@components/*`, `@lib/*`, `@config/*`. Relative imports are used only within a directory (e.g. `systemPrompts/index.ts` importing its siblings).
- `verbatimModuleSyntax` is on: type-only imports must be `import type { … }`, or the build breaks.
- Biome owns formatting: 100-char lines, 2-space indent, double quotes, `es5` trailing commas, LF. `noUnusedImports` and `noUnusedVariables` are deliberately **off**, so unused symbols are not errors here.
- Dark mode is driven by `data-kb-theme` on `<html>` (Kobalte convention, wired via `darkSelector` in `uno.config.ts`); use `oklch(var(--token))` CSS variables rather than hard-coded colors.

## Critical Gotchas

- **`bun run preview` does not work.** The Vercel adapter rejects `astro preview` outright, so `bun run preview` and `scripts/devserver/run.sh preview` both fail. Use `bun run dev` for local verification; `bun run build` is the only signal about the production bundle.
- **`vercel.json` pins inline-script SHA-256 hashes in the CSP.** The first hash (`sha256-tWgYCKflfnAc/…`) is the FOUC-prevention script in `src/pages/index.astro`. Editing that script — even whitespace — breaks all JS in production until the hash is recomputed (`sha256` of the exact script body, base64) and updated in `vercel.json`.
- **The vendored pdf.js worker must match `pdfjs-dist` exactly.** pdf.js compares `apiVersion` against the worker's hardcoded version and throws synchronously on mismatch, breaking every PDF upload. Nothing automates this; follow the copy step above on any `pdfjs-dist` bump.
- **Never let a commercial model become a fallback for a TEE model.** The privacy-first path skips PII anonymization because the enclave is the protection, so crossing paths would ship un-anonymized student work to an unconsented provider. `getFallbackModels` enforces this and assumes `"tee"` for unknown ids — keep that bias if you touch it.
- **Only add secrets through the `astro.config.ts` env schema.** A variable read from `astro:env/server` that is absent from the schema is a build-time failure, and one added to the schema without `optional: true` immediately blocks `dev`, `build`, and both CI workflows until the value is supplied.

## Additional Documentation

- `README.md` / `README.en.md` — Read for the end-user flow and UI screenshots when changing onboarding or chat UX.
- `.github/workflows/code-quality.yml` — Read before changing lint/type/build gating; its header comments explain the Renovate-only `biome-migrate` write path and why it is scoped that way.
- `.github/workflows/smoke.yml` — Read before changing dev-server startup or the root route; its comments document what the smoke test deliberately does not cover.
- `.env.example` — Read when adding or changing environment variables, alongside the `env.schema` block in `astro.config.ts`.
- `scripts/devserver/run.sh` — Read when you need the interactive local setup wizard or want to see the expected `.env` shape.
- `src/config/systemPrompt.ts` — Read before altering the bot's pedagogical behavior; it is the default prompt every unmapped subject falls back to.
