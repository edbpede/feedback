# Development CI and dependency updates

Every PR, default-branch push and manual repair dispatch runs `ci`. Require
`ci / required` from GitHub Actions, strict up-to-date PRs and administrator
enforcement, without mandatory approvals or bypasses. The aggregate rejects
missing, skipped, cancelled or failed quality/browser jobs. Generated PR dispatches
verify the exact current PR head before and after validation.

Run `bun install --frozen-lockfile`, `bash scripts/ci/check.sh`, then
`bunx playwright install chromium` and `bun run test:e2e`. The script uses public
fixture credentials, read-only Biome, Astro plus Svelte checking, six Bun tests
and one Vercel production build. Complementary prek hooks run hygiene and secret
checks. Vendor assets are excluded from newline repair, and the bundled system
prompt is excluded from trailing-whitespace rewriting to preserve its text.
Existing Biome advisory diagnostics remain visible. CI rejects tracked changes.

Three Playwright scenarios test the built Vercel fetch handler: actual inline
script hashes against `vercel.json` CSP, authentication/cookie flags and unauthorized
API requests, and Chromium hydration plus login. Main/enhanced tokens are now bound
to their intended purpose; the fixtures reproduced cross-cookie substitution
before the fix and reject it afterward. Unit checks cover expiry/tampering, model
fallback path isolation, the TEE-only PII registry, locale/model-label parity and
byte-identical PDF parser/worker versions. The browser job receives the same build
as a tar artifact, preserving traced function files. Its local HTTP adapter applies
the repository's Vercel headers; this does not emulate every Vercel edge behavior.
Both server and browser fixtures block outbound provider requests. No production
credentials, student text, paid calls or Vercel deployment are used.

Coverage still excludes actual AI responses, full document parsing/chat journeys,
commercial-model authorization beyond the checked session endpoint, and live Vercel
routing/deployment. In particular, `/api/chat`'s independent enforcement of the
optional enhanced access policy needs separate review. The browser test proves
hydration and the password gate, not every UI interaction. Vercel deployment remains
owned by the existing Vercel integration.

The versioned `engels74/automation` preset owns common managers/grouping; automerge
is off pending the shared pre-1.0 policy correction and activation. TypeScript is
capped below 7 for the Astro/Svelte JavaScript compiler API. `pdfjs-dist` updates
remain separate and manual: copy its installed worker to `public/pdf.worker.min.mjs`
and pass byte-parity plus CI. Full action version tags are updated by Renovate.
The official Biome version manager and isolated repair workflow maintain schema
versions/migrations/safe source formatting, then explicitly dispatch all CI checks
for the repaired SHA. Future Astro updates that change inline scripts must also
update their verified CSP hashes; CI deliberately blocks a stale hash.
