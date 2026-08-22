# AGENTS.md

This file provides guidance to AI coding agents when working with code in this
repository.

Danish AI feedback chatbot for grades 7–9. Astro SSR + one Svelte 5 island + UnoCSS, on Vercel.
Package manager is Bun, pinned to `bun@1.3.14` via `packageManager` in `package.json`.

## Commands

Run from the repository root.

| Command | Purpose |
| --- | --- |
| `bun install` | Install deps (CI uses `bun install --frozen-lockfile`) |
| `bun run dev` | Astro dev server — the only way to run the app locally |
| `bun run build` | Production build; the only compile signal for the Vercel bundle |
| `bun run check` | `astro check` — type gate, must report 0 errors |
| `bun run lint` / `lint:fix` | `biome check .` / `biome check --write .` |
| `bunx biome ci .` | Exactly what CI gates on; non-writing |

**There is no test suite and no test runner in this repository.** Do not go looking for one, and
do not report "tests pass". Full local validation is:

```bash
bunx biome ci . && bun run check && bun run build
```

`dev`, `build`, and both CI workflows refuse to start without `PASSWORD_HASH`, `SESSION_SECRET`,
and `NANO_GPT_API_KEY`, because `astro.config.ts` sets `validateSecrets: true`. Copy
`.env.example` to `.env`, or run `scripts/devserver/run.sh setup` (needs `gum`), which generates
the hash and secret.

## Architecture invariants

- **One page, one island.** `src/pages/index.astro` is the only page route and renders
  `<App client:idle />`. The whole UI — password gate, onboarding, PII review, chat — is inside
  that single island (`src/components/App.svelte`). Everything else in `src/pages` is `/api/**`.
- **`localStorage` is the only persistence.** `src/lib/storage.ts` owns every `feedback-bot-*`
  key. No database, no server-side session store.
- **Auth is HMAC-signed cookies, no middleware.** `src/lib/auth.ts` signs `payload:timestamp`
  with `SESSION_SECRET`, verifies with `timingSafeEqual` and a 7-day age check. Two independent
  cookies: `session` (main gate) and `enhanced-session` (commercial-model gate). Every route
  re-verifies for itself.
- **The two model paths never cross.** `ModelPath` is `"privacy-first"` (TEE models, no
  anonymization — the enclave is the protection) or `"enhanced-quality"` (commercial models, PII
  anonymization required). `src/config/models.ts` is the single registry; `getFallbackModels`
  filters by `pathType` and assumes `"tee"` for unknown ids. Keep that bias — a commercial
  fallback for a TEE model ships un-anonymized student work to an unconsented provider.
- **PII detection is server-side and always TEE.** `/api/pii-detect` only accepts model ids in
  `PII_DETECTION_FALLBACK_MODELS`; `src/lib/api.ts` walks that list on failure.
- **Prompts are bundled TypeScript, not loaded at runtime.** `src/config/systemPrompts/*.ts`,
  registered in that directory's `index.ts`, reached from `/api/chat` via
  `src/lib/promptLoader.ts`. `clearPromptCache()` is an intentional no-op.
- **`en.json` is the i18n type source.** `Translations = typeof en` (`src/lib/i18n/types.ts`),
  so `da.json` is never type-checked against it. Both currently hold 232 keys in exact parity.
- **Retry policy is client-side only.** `src/lib/api.ts` retries 10 times (5 quick, then
  backoff), keyed off `errorDetails.retryable`. `/api/chat` returns the upstream body untouched
  as `text/event-stream`; the client parses `data:` lines and accumulates usage.

## Multi-file changes that fail silently

**Add or change an AI model:**

1. `AVAILABLE_MODELS` in `src/config/models.ts`, with the right `pathType` (`tee` / `commercial`).
2. `MODEL_PRICING` in `src/config/pricing.ts` — a missing entry silently uses `DEFAULT_PRICING`,
   so the cost badge lies.
3. `onboarding.models.<key>.{name,description,bestFor}` in **both** `da.json` and `en.json`.
4. If the model rejects the `system` role, add its id to `STRICT_ALTERNATION_MODELS` in
   `models.ts`; `/api/chat` then merges the system prompt into the first user message.
5. `bun run check` catches a missing **English** key (the keys are typed `TranslationKey`), not a
   missing Danish one.

**Add a subject prompt:**

1. `src/config/systemPrompts/<subject>.ts` exporting `SYSTEM_PROMPT`.
2. Add it to both `SubjectKey` and `SUBJECT_PROMPTS` in `systemPrompts/index.ts` — unregistered
   subjects silently fall back to the default prompt via `getSystemPrompt`.
3. Add the key to `SUBJECT_PROMPT_MAP` in `src/config/subjectPrompts.ts`.
4. To surface it in the UI, add it to `SUBJECTS` in
   `src/components/onboarding/SubjectGradeStep.svelte` plus `onboarding.subjects.<key>` in both
   locale files. `SUBJECTS` currently lists 8 of the 14 registered keys.

**Add a user-facing string:** `en.json` first, then `da.json`. A key only in `da.json` will not
type-check; a key missing from `da.json` renders the raw dot-path at runtime, because
`getNestedValue` returns the key as its fallback.

## Gotchas

- **`bun run preview` does not work.** The Vercel adapter rejects `astro preview` outright, so
  `bun run preview` and `scripts/devserver/run.sh preview` both fail. Verify locally with
  `bun run dev`; `bun run build` is the only production-bundle signal.
- **`vercel.json` pins inline-script SHA-256 hashes in the CSP, and only one of the three is
  yours.** The page serves three inline scripts: the FOUC-prevention script in
  `src/pages/index.astro`, and two that Astro generates — the `client:idle` directive shim and
  the `astro-island` custom-element bootstrap. All three need a `'sha256-…'` entry in
  `script-src`. Editing the FOUC script — whitespace included — changes its hash; **so does
  bumping `astro`**, which silently rewrites the generated pair. A missing hash blocks that
  script in production, and a missing bootstrap hash means the island never hydrates while the
  server-rendered shell still looks fine. Nothing in CI catches it: the smoke test only asserts
  that `/` serves a `<title>`. Recompute all three from a real build rather than from source —
  build, serve `.vercel/output` (or deploy a preview), and hash every inline script in the
  response:

  ```bash
  curl -s <deployment>/ | python3 -c 'import sys,re,hashlib,base64
  for s in re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", sys.stdin.read(), re.S):
      print(base64.b64encode(hashlib.sha256(s.encode()).digest()).decode())'
  ```

- **UnoCSS is on `presetWind4`, and two of its config keys fail silently.** `theme.font` entries
  must be single strings — an array emits no `--font-*` variable at all, and `font-mono` then
  resolves to an undefined var. And `unocss-preset-shadcn` 1.0.1 still declares its radius scale
  under the `presetWind3` key `borderRadius`, which `presetWind4` ignores, so `uno.config.ts`
  restates that scale under `radius` to keep `rounded-lg/md/xl` tracking `--radius`. Neither
  failure produces a build error. Note also that Tailwind v4 renamed the shadow and blur scales:
  the old `shadow-sm` is now `shadow-xs` and the old `backdrop-blur-sm` is now `backdrop-blur-xs`.
- **`public/pdf.worker.min.mjs` is vendored and hand-synced.** pdf.js compares `apiVersion`
  against the worker's hardcoded version and throws synchronously on mismatch, breaking every
  PDF upload. No build step regenerates it — after any `pdfjs-dist` bump, run
  `cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs` and commit it.
- **Secrets only through the `astro.config.ts` env schema.** Read them from `astro:env/server`;
  nothing in `src/` uses `process.env` or `import.meta.env`. A variable absent from the schema is
  a build-time failure, and one added without `optional: true` immediately blocks `dev`, `build`,
  and both CI workflows until a value is supplied.
- **`scripts/devserver/run.sh clean` deletes `.env`** along with `node_modules`, `dist`, and
  `.astro` — it is in `BUILD_ARTIFACTS`. Back the file up first, or clean by hand.
- **CI cannot catch client-side breakage.** The smoke test asserts only that `/` serves a
  `<title>`; the island never hydrates in CI. After a `svelte`, `bits-ui`, or `unocss`
  bump, exercise the UI in `bun run dev` by hand.
- **`astro check` does not typecheck `.svelte` files.** It covers `.astro` and `.ts` only, so
  the components are outside the type gate. Verified by injecting a deliberate type error into
  a component and watching `bun run check` still report 0 errors. Run
  `bunx svelte-check --tsconfig ./tsconfig.json` to typecheck the UI; it is clean today but is
  not wired into CI.
- **Biome does not lint `.svelte` markup.** It formats and lints the `<script>` block only, so
  rules like `noNonNullAssertion` no longer see assertions that live in the template.

## Conventions

- Import through the `tsconfig.json` aliases `@/*`, `@components/*`, `@lib/*`, `@config/*`;
  relative imports only within a directory.
- `verbatimModuleSyntax` is on — type-only imports must be `import type { … }`.
- Biome owns formatting (100 cols, 2 spaces, double quotes, `es5` trailing commas, LF).
  `noUnusedImports` and `noUnusedVariables` are deliberately **off**.
- Compose classes with `cn()` from `src/lib/utils.ts`, not template strings.
- Dark mode is the `.dark` class on `<html>` — the shadcn/UnoCSS convention, and the selector
  presetWind4 compiles the `dark:` variant against, so the two cannot drift apart. The rule that
  actually applies the dark palette is hand-written in `src/styles/globals.css`; the class is
  written by `src/lib/theme.svelte.ts` and by the anti-FOUC inline script in
  `src/pages/index.astro`, and `<html>` ships with it already set so the default dark theme
  paints on the first frame. The `darkSelector` option in `uno.config.ts` emits nothing because
  `presetShadcn` is configured with `color: false`, but is kept equal to the real selector.
  Colors come from `oklch(var(--token))`, defined in `src/styles/globals.css`.
- `tailwind.config.js` is an empty stub for shadcn CLI compatibility — real config is
  `uno.config.ts`. The shadcn-style primitives in `src/components/ui/` are one component per
  `.svelte` file, built on `bits-ui`; re-export new ones from `ui/index.ts`. Prop types and
  `cva` variants live in sibling `.ts` files, because a `.svelte` file cannot export a type.
- Heavy client deps get a dynamic `await import()` plus a `manualChunks` entry in
  `astro.config.ts` (see `src/lib/fileParser.ts`).
- API routes hand errors back as `ApiResponse<T>` with a populated `ErrorDetails`
  (`status`, `message`, `retryable`) — the client retry loop keys off `retryable`.

## Reference

- `.agents/rules/astro-typescript-solidjs-unocss.md` — general TypeScript/Astro/SolidJS/UnoCSS
  best practices (`type: agent_requested`), not repository law. **Its SolidJS half is now
  out of date — this repo is Svelte 5** and the file is being replaced separately. Read it only
  for the Astro/UnoCSS material; where it conflicts with this file or actual code, the code wins.
- `.github/workflows/code-quality.yml` — read before changing lint/type/build gating; its header
  comments explain the Renovate-only `biome-migrate` write path.
- `.github/workflows/smoke.yml` — read before changing dev-server startup or the `/` route.
- `.env.example` — read alongside the `env.schema` block in `astro.config.ts` when adding or
  changing an environment variable.
- `scripts/devserver/run.sh` — interactive local setup wizard (`setup`) and the expected `.env`
  shape; requires `gum`.
- `src/config/systemPrompt.ts` — the default pedagogical prompt every unmapped subject falls back
  to. Read before altering the bot's behavior.
- `README.md` / `README.en.md` — end-user flow and UI screenshots. Read when changing onboarding
  or chat UX.
