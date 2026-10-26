# Contributing

Saboot is a hackathon prototype of a disaster crop-loss evidence layer. Changes are welcome if they keep its promises.

## Read first

- [`README.md`](README.md): what it is, how to run it, the quality gates.
- [`CLAUDE.md`](CLAUDE.md): the working rules (think before coding, keep changes small and surgical, one concern per commit,
  a check that can pass or fail for every change) and the non-negotiables below.
- [`docs/SABOOT-SPEC.md`](docs/SABOOT-SPEC.md) and [`docs/DESIGN.md`](docs/DESIGN.md).

## The non-negotiables

- Saboot **never decides** a claim, eligibility or amount, and shows **no rupee amount**.
- Rules own detection and timing; "AI" only does perception and language (none is built).
- Every score shows its uncertainty. Do not invent a statistic, a user, a quote or a source.
- Every value says where it comes from: LIVE, REPLAY, SIMULATED, HAND, or FIELD (a consented interview).
- Consent is per farmer. Do not call a translation verified or the detection validated: Hindi and Punjabi lines keep their
  `// needs-native-review` flag until a native speaker has checked them.
- No runtime third-party request and no new runtime dependency without a written reason.
- A claim about the real world carries its source in a code comment, or is worded as Saboot's own design.

## Run it

```
npm ci
npm run dev                  # http://localhost:5173 (no service worker in dev)
npm run build && npm run preview
```

## Before you open a pull request

Fast loop (what CI runs on every push):

```
npm run typecheck && npm run lint && npm test
node scripts/i18n-check.mjs        # when copy changes
node scripts/contrast.mjs          # when design tokens change
npm run facts:check                # when docs or the model change
npm run build && node scripts/budgets.mjs
```

UI changes also need `npx playwright test` against the built `dist/` (the suite does not rebuild it), and
`node scripts/lighthouse.mjs`. `npm run verify` runs every gate.

Add a test for what you change. Keep a commit to one concern, work on a branch, and do not deploy from a pull request.
