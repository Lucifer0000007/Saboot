# Working rules for Saboot (Overflow)

Saboot is a disaster crop-loss evidence layer: Vite, Preact with signals, TypeScript, hand-written SVG, a service worker,
IndexedDB, WebCrypto, and English, Hindi and Punjabi. Spec: `docs/SABOOT-SPEC.md` (sections 14 and 15). Read
`README.md` first.

## How to work (Karpathy-style guidelines, paraphrased)
Source of the guidance: the `andrej-karpathy-skills` plugin. See `docs/TOOLS.md` for the pinned version.

1. **Think before coding.** State assumptions. If there are several readings of a task, name them. Push back when a simpler
   approach exists. If something is unclear, stop and say what is unclear.
2. **Simplicity first.** The minimum code that solves the problem. No speculative features, no abstraction for one use, no
   configuration nobody asked for, no error handling for cases that cannot happen.
3. **Surgical changes.** Touch only what the task needs. No drive-by refactors or formatting. Match the surrounding style.
   Mention unrelated dead code instead of deleting it. Every changed line traces to the task.
4. **Goal-driven.** Before each task write a check that can pass or fail (a test, a Playwright assertion, the budget script,
   axe, a screenshot). Make the smallest change, run the check, repeat. Three attempts at most, then log the task as blocked
   in `docs/DECISIONS.md` and move on.

One concern per commit. Work on a branch. Never deploy.

## Non-negotiables
- Saboot never decides a claim, eligibility or amount, and shows no rupee amount anywhere.
- Rules own detection and timing. AI only does perception and language.
- Every score shows its uncertainty. No invented statistics.
- Every screen is honest about where a value comes from: LIVE, REPLAY (real past data), SIMULATED, or entered by HAND.
- Consent is per farmer. Do not say translations are verified. Do not say detection is validated.
- Hindi and Punjabi strings keep their `// needs-native-review` flag until a native speaker has checked them.
- No runtime third-party requests. No new runtime dependency without written justification.
- Never edit `{{VERIFY}}` claims or `tests/unit/claims.test.ts` without the owner.

## Gates
`npm run verify` runs every gate (`verify.sh`, a reconstruction from the README list; `-- --quick` skips Lighthouse and uses the quick matrix). The separate commands:

- Fast loop after every task: `npm run typecheck`, `npm run lint`, `npm test`.
  Add `node scripts/i18n-check.mjs` when copy changes, `npm run facts:check` when docs or the model change, and
  `node scripts/contrast.mjs` when tokens change.
- UI change: fast loop, then `npm run build`, `node scripts/budgets.mjs`, and a targeted
  `npx playwright test --project=qa -g "<state>.*(360x640|1440x900).*en"`.
  The QA suite serves `dist/` and does not rebuild it.
- Before handing off: also `npx playwright test` and `node scripts/lighthouse.mjs`.
- Budgets: initial load 200 KB gzip, whole site 700 KB, lazy chunk 60 KB, scenario 40 KB. LCP has little headroom
  (2.41 s against a 2.5 s limit).

## Stop and hand over to the owner before
Creating an account, entering a credential or API key, paying, installing anything user-wide, uploading repository code to
any service, editing a `{{VERIFY}}` claim or `tests/unit/claims.test.ts`, deploying, or deleting data or branches.
