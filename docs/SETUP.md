# Tooling setup notes

Notes for whoever works on this repository next. Nothing here is a product feature.

## Gates
`npm run verify` runs every gate (`verify.sh`); `npm run verify -- --quick` is the fast version. The separate commands are listed in `CLAUDE.md`.
On Windows PowerShell 5.1 there is no `&&`: run commands one by one, or use Git Bash.

## Browser tooling: Claude in Chrome (manual checks only)
- **Role.** Exploratory checks by a person: the laptop webcam scanning a QR code, console errors, a human look at spacing.
  **Playwright stays the only automated gate.** Nothing in the test suite depends on the extension.
- **Do not install it from the agent.** The extension comes from the Chrome Web Store and the owner installs it.
- **Requirements.**
  - Claude Code 2.0.73 or higher. This machine runs 2.1.302.
  - A direct Anthropic plan. Bedrock and Vertex are not supported.
  - Chrome with the extension installed.
  - Start with `claude --chrome`, or type `/chrome` inside a session.
- **Check status.** Type `/chrome` in the session. An agent cannot run that built-in command. From the agent's side the
  `claude-in-chrome` skill is listed but no browser tools were present in the session, so treat it as **not connected**.
  Nothing blocks on it. Some setups fail to connect; if that happens, use a normal browser by hand.
- **Safety.** The extension works inside your logged-in browser session. Use a **separate Chrome profile with no signed-in
  accounts**, and limit its site access to the local preview (`http://localhost:4173`) and the live site.

## The demo receiver (HTTPS on the laptop, certificate by you)
`scripts/receipt-server.mjs` serves the build over HTTPS and takes the signed code a phone sends (README, "The optional demo
receiver"). The phone must trust the certificate, so you make it; nothing here is installed by an agent.

1. `winget install FiloSottile.mkcert`, then `mkcert -install` once (it adds a local root to your trust store).
2. Find the laptop's Wi-Fi IPv4 (`ipconfig`). `mkcert -cert-file .cache/demo.pem -key-file .cache/demo-key.pem <ip> localhost 127.0.0.1`.
   `.cache/` is git-ignored; never commit the key. Add the hotspot address too if you may use it (Windows hotspots are usually 192.168.137.1).
3. Put the root on the phone: `mkcert -CAROOT` shows the folder; copy `rootCA.pem` to the phone. Android: Settings → Security →
   Encryption & credentials → Install a certificate → CA certificate. iPhone: open the file, Settings → Profile Downloaded →
   Install, then Settings → General → About → Certificate Trust Settings → enable full trust.
4. `npm run build`, then `node scripts/receipt-server.mjs --cert .cache/demo.pem --key .cache/demo-key.pem`.
5. Rehearse once, QR path and receiver path both. Afterwards delete `.cache/receipts.json`.

## Semgrep (security scan)
- **Not in `package.json`.** Install it in a virtual environment outside the repository so nothing user-wide changes:
  ```bash
  uv venv <folder> --python 3.13
  uv pip install --python <folder>/Scripts/python.exe "semgrep==1.182.1"
  ```
- **Run it** with metrics off and no login. Rules come from the public registry. Code stays on the machine.
  ```bash
  semgrep scan --config p/typescript --config p/javascript --config p/secrets --config p/owasp-top-ten \
    --config p/security-audit --config p/xss --metrics=off --disable-version-check \
    src scripts public tests index.html vite.config.ts playwright.config.ts netlify.toml package.json
  ```
- **Never** run `semgrep login`, use the Pro engine, or upload code. Set `PYTHONUTF8=1` on Windows.
- Exclusions and their reasons are in `.semgrepignore`. Results and decisions are in `docs/SECURITY-SCAN.md`.

## Other tooling
- Python with `fonttools` and `brotli` is only needed for `npm run fonts`.
- Node 24 and Google Chrome are needed for the QA suite and Lighthouse.
- Skills and plugins in use are listed, with pins, in `docs/TOOLS.md`.
