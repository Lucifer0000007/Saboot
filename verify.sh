#!/usr/bin/env bash
# Every quality gate, in the order the README lists them ("Quality gates and measured budgets").
#
# A RECONSTRUCTION. The original verify.sh was never committed (docs/AUDIT-REPORT.md, A-13), so this is rebuilt from the
# README's list of what the gate fails on, using the commands that already exist in package.json. Compare it with the
# README list before relying on it for anything the list does not name.
#
#   verify.sh            the full gate: static checks, build, budgets, the whole QA matrix and axe, Lighthouse
#   verify.sh --quick    the same without Lighthouse, and the quick QA matrix (fewer viewports and languages)
#   verify.sh --hook     --quick, but skipped when no source input has changed since the last pass (for a stop hook)
#
# Run it through `npm run verify` (scripts/run-sh.mjs finds Git Bash on Windows). Nothing here deploys.
set -eu
cd "$(dirname "$0")"

mode=full
case "${1:-}" in
  '') ;;
  --quick) mode=quick ;;
  --hook) mode=hook ;;
  *) echo "usage: verify.sh [--quick | --hook]" >&2; exit 2 ;;
esac

PASS=.cache/verify-pass
if [ "$mode" = hook ]; then
  mkdir -p .cache
  if [ -f "$PASS" ] && [ "$(cat "$PASS")" = "$(node scripts/tree-hash.mjs)" ]; then
    echo "verify: no source input changed since the last pass"
    exit 0
  fi
fi

step() { echo; echo "▶ $*"; }

step "typecheck"
npm run --silent typecheck
step "lint"
npm run --silent lint
step "unit tests"
npm test --silent
step "i18n parity and review flags"
node scripts/i18n-check.mjs
step "scenario numbers quoted in the docs"
npm run --silent facts:check
step "validation harness on its fixture"
npm run --silent validate:fixture
step "token contrast"
node scripts/contrast.mjs
step "build"
npm run --silent build
step "size budgets and third-party URLs"
node scripts/budgets.mjs

if [ "$mode" = full ]; then
  step "QA matrix and axe: every state, viewport and language"
  npx playwright test
  step "Lighthouse"
  node scripts/lighthouse.mjs
else
  step "QA matrix and axe: quick"
  QA_QUICK=1 npx playwright test --project=qa
fi

mkdir -p .cache
node scripts/tree-hash.mjs > "$PASS"
echo
echo "✓ verify ($mode): every gate passed"
