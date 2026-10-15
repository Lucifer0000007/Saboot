#!/usr/bin/env bash
# Deploy to Netlify — run by a person, never by an agent. Refuses unless every gate passes AND no
# {{VERIFY}} marker remains. `--prod` publishes the site publicly.
# First time: npx netlify-cli login && npx netlify-cli sites:create --name saboot   (or `link` an existing site)
set -eu
cd "$(dirname "$0")/.."
echo "▶ verify (full)"
node scripts/run-sh.mjs verify.sh || { echo "✗ Refusing to deploy: verify failed."; exit 1; }
echo "▶ markers (strict)"
node scripts/markers.mjs --strict || exit 1
echo "▶ netlify deploy --prod (publishes publicly)"
npx --yes netlify-cli deploy --prod --dir dist
