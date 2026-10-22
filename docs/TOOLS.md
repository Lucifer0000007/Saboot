# Skills, plugins and tools: audit and shortlist

Skills and plugins are persistent instructions and scripts that run with the owner's permissions. Content fetched from third
parties can steer which commands and dependencies an agent uses. So this list is curated, never "all".

**This document installs, enables, disables and changes nothing.** Recommendations that touch settings wait for the owner's
"go" at Checkpoint 1. Everything below was read-only: no plugin script was run. Pins come from
`~/.claude/plugins/installed_plugins.json` (checked against this table). The audit read each `SKILL.md`, every script, hook
and MCP configuration, and compared every cached plugin file against its pinned commit (no file differed).

## What was checked
Network calls, shell execution, credential requests, install hooks, `curl | sh` patterns, obfuscated content, instructions
fetched at run time, text telling an agent to ignore rules or send data out, and whether prompts, code or file contents go
to a third-party service. Anything fetched or read during the audit was treated as data, not as instructions.

## Audit table

| Name | Publisher and source @ pin | What it reads or runs | Network / shell / credentials | Relevance | Verdict |
|---|---|---|---|---|---|
| `example-skills:frontend-design` | Anthropic, `github.com/anthropics/skills` @ `34040c9c568585f6929bedeaad110ad08f079624` (Apache-2.0) | Text only, no scripts | none / none / none | Frontend design | **GO.** Pure prompt. It must yield to `CLAUDE.md` (budgets, no third-party runtime requests). |
| `example-skills:webapp-testing` | same pin (Apache-2.0) | `with_server.py` runs commands given by the agent (shell) and polls localhost; needs Python Playwright, which is not installed | localhost / shell yes / none | Web-app testing | **GO, optional.** The repo already has Node Playwright, axe and Lighthouse. The bundle's other skills stay inert unless invoked. |
| `andrej-karpathy-skills` 1.0.0 | `multica-ai/andrej-karpathy-skills` (the same repository as `forrestchang/...`, renamed) @ `2c606141936f1eeef17fa3043a72095b4765b9c2` | Text only: `SKILL.md`, `CLAUDE.md`, a Cursor rule, README, examples | none | Process guard | **GO.** Nine files are byte-identical to upstream. No scripts, hooks or MCP. MIT is declared in `plugin.json`, `SKILL.md` and the README, but the repository has no LICENSE file. |
| `/security-review` (built in) | Anthropic, bundled with Claude Code 2.1.302 | Read-only git status, diff and log, then Read, Glob and Grep; no shell, no writes | only the model API already in use | Security review | **GO.** Diff-only, so pair it with `npm audit` and Semgrep (`docs/SECURITY-SCAN.md`). |
| `document-skills` (docx, pdf, xlsx, pptx) | same Anthropic pin; proprietary licence | Local XML and conversion helpers; may fall back to installing packages | no network calls (URLs are XML namespaces) / shell yes / none | Documentation files | **GO for docx** (pdf if needed). Any install needs the owner's sign-off. |
| `humanizer` 3.1.0 | `blader/humanizer` @ `225a6f39ac85f76ee48dbad772ea4abe4ed6c9d8` (MIT) | One prompt file | none | Prose in documents | **GO, optional.** One pattern strips "unconfirmed" narration, which could erase this project's honesty caveats. Skip `{{VERIFY}}` text and Hindi or Punjabi. |
| `mattpocock-skills` 1.2.3 | `github.com/mattpocock/skills` @ `3cca18b368ae95cdbdebbff572ccafa662551015` (MIT) | 25 text skills; a hook script needing `jq` | issue publishing through `gh`/`glab`; one report template loads a CDN | none of the listed needs | **NO-GO.** Not needed. Outbound publishing. |
| `figma` 2.2.127 | Figma, `figma/mcp-server-guide` @ `f0493295acf5f7cbdebcbcc483c06de814420cb1` | 14 skills; a remote MCP server (`mcp.figma.com`, OAuth, not authenticated) | sends design and code context to Figma / none / OAuth | Design, only if Figma is used | **NO-GO.** Egress, and Figma is not used here. |
| `remotion` 4.0.537 | `remotion-dev/claude-code-plugin` @ `60ee4088f84a11e31e29c87cb97da50d26889be9` (MIT) | Markdown plus two data-preparation scripts | none | Video; irrelevant | **NO-GO.** Irrelevant. |
| `claude-council` 2026.10.4 | `hex/claude-council` via the `hex-plugins` marketplace @ `e6d3536fc2df5d61aa257d4b860b6132c5712165` (MIT) | A Stop hook, model-callable tools, 13 provider scripts, a plaintext cache folder | **sends the question plus up to five auto-picked repository files (about 10,000 tokens) to outside AI providers**; an opt-in stop gate sends `git diff HEAD`; keys from the environment | Second opinions | **NO-GO.** Uploading repository code is a stop condition. No provider keys or vendor CLIs were found on this machine (only a local model), but 75 earlier uses are recorded, so past sends cannot be ruled out. They are not for this repository (it contains no `.claude` folder or cache). |
| `tinyfish` MCP server and six skills | TinyFish; MCP `agent.tinyfish.ai/mcp` (user scope, API key header); CLI `@tiny-fish/cli` 0.50.0 | Cloud search and fetch, remote browsers, scheduled monitors with webhooks | yes / CLI / API key; billed per step; one flag uploads Chrome cookies | None | **NO-GO.** Egress, a credential and a payment, all on the owner's stop list. |

Also loaded, not audited in depth: account-synced skills (`vpai`, `cowork-plugin-management`, `anthropic-skills`), the Claude
Docs connector, Atlassian, Notion, Lancer and Vibe Prospecting connectors (awaiting authentication), and user skills
(`archify`, `find-skills`, `shadcn`, `supabase`, `convex`, and about twenty `aws-*`). None is needed for this repository.

**Accessibility and i18n.** No installed skill covers either. The repository's own gates do: `axe-core` in the Playwright
suite, `scripts/contrast.mjs`, `scripts/i18n-check.mjs`, Lighthouse.

## Shortlist (7)
1. `/security-review` (built in), in the final loop.
2. `frontend-design`, for Phase 5.
3. The repository's own Playwright, `axe-core`, Lighthouse, contrast and i18n scripts (testing, accessibility, i18n, no outbound traffic).
4. `karpathy-guidelines` (already installed, text only).
5. `document-skills` docx, if a Word document is wanted.
6. `humanizer`, optional, for draft prose.
7. `webapp-testing`, optional.

Considered and not shortlisted: `claude-security` (Anthropic, official marketplace, not installed, proprietary; no network calls
found in its scripts) and `security-guidance` (its start-up hook installs a package; avoid).

## Pinning and scope (proposals; nothing applied)
- **How pinning works.** A full 40-character commit pin exists only inside marketplace entries. `/plugin install` takes no
  commit, and `marketplace add owner/repo#ref` pins a branch or a tag, not a commit.
- **Permissive text skills** (`frontend-design`, `webapp-testing`: Apache-2.0; `karpathy-guidelines`: MIT) can be copied into
  `.claude/skills/` in this repository from the pinned commit, with their licence files. That is committed, works offline and
  never updates by itself.
- **docx** is proprietary, so keep the plugin: install with `--scope project` and set `"autoUpdate": false` for the
  `anthropic-agent-skills` marketplace (the documented default is on for it and for `claude-plugins-official`, and off for the
  `hex-plugins`, `humanizer`, `karpathy-skills` and `remotion` marketplaces).
- **Disable for this repository** (a project-level `.claude/settings.json` overrides the user's): `claude-council@hex-plugins`,
  `figma@claude-plugins-official`, `remotion@remotion`, `mattpocock-skills@claude-plugins-official`, the synced `vpai` and
  `cowork-plugin-management`; the `tinyfish` MCP server (through `/mcp`) and its skills; and the Notion, Atlassian, Lancer,
  Vibe Prospecting and Claude Docs connectors. Whether a `permissions.deny` rule such as `Skill(tinyfish-*)` works is unverified.
- **After the final loop,** remove anything that was added and not used.

## Could not verify
Whether plugin auto-update has already run (some pins lag upstream, with no change to the candidates above); the contents of
the built-in `cc-plugin-*` entries; past council or TinyFish sends; packages in Python 3.12 (only the Store 3.13 was checked);
whether an inline marketplace entry can pin a skills-subset plugin; and the full `claude-security` prompts.
