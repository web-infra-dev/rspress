# Midscene AI E2E

Exercise search, translated and versioned navigation, documentation components,
generated API pages, previews, playgrounds, HMR, and production/static rendering.
The fixture launcher runs the checked-out CLI against original `e2e/fixtures`;
the initial documentation examples remain separate smoke cases.

`migration-inventory.json` records the original E2E cases and their migration
decisions. Exact DOM, CSS, timing, build-output, and browser-event contracts
remain deterministic. Candidate mappings alone do not prove full replacement.
The initial assessment mapped 129 of the 237 originals to the 112 AI cases and
classified 108 as deterministic-only. These historical labels do not prove full
assertion equivalence or exclude mixed UI scope. Multiple originals can map to
one AI flow. Inventory evidence identifies local runs, not remote CI passes.
The current suite contains 114 AI cases, including separate production checks
for the `/base` and `/base/` homepage entries.

The reviewed replacement batches remove 50 pure UI tests from the legacy
suite. Each is marked `replaced-by-midscene` in the baseline inventory, whose
`sourceCommit` preserves its original source. Other mappings still await
assertion-level review and splitting; the inventory's 237 is the original count,
not a claim that 237 legacy tests still execute. There are 187 remaining legacy
tests after these replacements. Rstest continues to run the
remaining tests through `pnpm test:e2e`; existing Linux, macOS, and Windows CI
workflows keep that command. Mixed tests are retained until their technical
assertions have been separated. No replaced case is disabled with `skip`.
Twenty-seven mixed tests are split. Midscene verifies tab switching, navigation,
localized home heroes and search, custom layouts/outlines, rendered code and
callouts, footer text, and banner dismissal. The legacy tests retain exact DOM
structure, CSS classes, callback order, browser errors, installed React/router
versions, metadata, image attributes, and storage keys/values.
Deterministic clicks remain only where needed to prepare a technical contract
check, such as writing localStorage; they are not the visible E2E proof.
LAYOUT-05 now checks all five translated/fallback strings in all three languages.
Twenty mapped originals have been reviewed as technical-only and remain
unchanged, explicitly marked `retained-technical`. Examples include exact URL,
href, RGB, DOM-index/count, browser-error and one-pixel scroll-offset contracts.
They are not counted as removed or split. There are 32 mapped originals still
awaiting assertion-level review. Of the initial 108 deterministic-only
classifications, fourteen have been reviewed and retained: Shiki DOM/CSS,
heading font-size/anchor, feature-card URL events, generated head metadata,
TOC serialization/depth attributes, and icon build output.
The other 94 still need review for mixed UI scope. The icon output test now
awaits its filesystem check; a truthy Promise previously allowed missing files
to pass.
The latest replacements cover complete nested overview groups and article lists,
both production base-path homepage entries, complete generated sidebars, and all
four original code-search queries. Local run `20261015140840-f52308ac` passed
seven of eight flows; the Level 1 overview assertion initially confused the page
title with its group heading. After clarifying those regions without removing
entries, `20261015141616-e6d3f80e` passed that flow. Case retries remain disabled.
Overview content is checked in separate sections before following links. Japanese
search covers all four original queries and result counts; localized search also
returns to English. Dynamic TOC checks wait for the heading update before asserting
both the article heading and its outline entry.
Generated API tables check every original column, property description, type and
default value; search checks result counts before opening the table. Preview tests
read rendered internal/external outputs separately from source code; the legacy
tests retain explicit preview and iframe counts.

This isolated npm package uses
`@midscene/test` 1.15.3, not Vitest. Each case starts in a fresh browser context.
`app.open` only prepares the browser; all product interactions use `aiAct`.
Separate `aiAssert` steps check outcomes instead of treating an AI action's completion
as proof of success. Browser requests stay on the local fixture origin; preview
fixtures may additionally load loopback origins declared by their iframe sources.
Public network requests remain blocked.
The original Playground's pinned Monaco 0.43.0 and Babel 7.22.20 CDN URLs are
fulfilled from matching local npm packages. This preserves its editor/compiler
runtime without allowing public requests or substituting a newer runtime version.

`fixture.update` changes only allowlisted source text in an isolated temporary
fixture copy for HMR checks. It does not operate the UI or modify original sources.
Temporary copies and their owned CLI processes are cleaned up after the run.

## Run locally

Use Node.js 24 and the repository's pinned pnpm version.

```sh
corepack enable
pnpm install --frozen-lockfile
cd tests/midscene
npm ci
npx playwright install chromium
cp .env.example .env
```

Fill in the four model variables in `.env` with a vision-capable model.
Keep credentials out of Git. Environment variables override `.env`; unset inherited
`MIDSCENE_*` configuration when testing a different provider.

The framework setup starts the synthetic fixture and tears down its owned process
after the run. An already-running local fixture can be reused.

Run the suite:

```sh
cd tests/midscene
npm run check:model
npm test
```

The smoke fixture listens on `http://127.0.0.1:4173`; original fixtures use owned
dynamic ports. Set `MIDSCENE_INCLUDE_TAGS=original-search` to run the original
search flows. Retries are disabled so the first failure remains visible.

Native reports live under `midscene_run/report/`; structured results live under
`.midscene/test-results/`. Reports contain screenshots and test data, so use only
the synthetic local fixture.

## Model-free checks

```sh
cd tests/midscene
npm run collect
npm run typecheck
npm run test:summary
```

Collection validates YAML with the framework, checks the committed case inventory,
and rejects atomic AI operations or custom product-interaction nodes. Trust-policy checks reject reports from untrusted sources. The framework owns
report rendering and Markdown results.

## GitHub Actions

The workflow validates definitions on PRs without model credentials. Relevant
upstream `main` pushes run the AI suite automatically; maintainers can also dispatch
it manually. Forks run AI tests only by manual dispatch. Every AI run consumes model
tokens; do not configure secrets on an untrusted fork.

Configure these repository Actions secrets before the first AI run:

- `MIDSCENE_MODEL_BASE_URL`: OpenAI-compatible chat-completions base URL.
- `MIDSCENE_MODEL_API_KEY`: dedicated, quota-limited API key.
- `MIDSCENE_MODEL_NAME`: vision model or endpoint name.
- `MIDSCENE_MODEL_FAMILY`: the corresponding Midscene adapter, such as `doubao-seed`.

Missing credentials or a failed image-reading preflight fails the job explicitly.
Credentials are passed only to model preflight and test steps, not installation
or fixture processes. Native reports are uploaded after failures too.

The **Midscene E2E** job writes the framework-generated `result.md` directly to
its Summary, and uploads `midscene-results` even after failures. The
**Publish Midscene Pages report** job adds the online native HTML report link.
This follows Rome PR #974 at `d1b3183`: no custom report merger or
custom screenshot-table renderer is involved.

To enable publication:

1. Ensure the repository Pages site is dedicated to these reports. Do not enable
   this if Pages already hosts project documentation.
2. Select **Settings → Pages → Source → GitHub Actions**.
3. Set `MIDSCENE_PUBLISH_REPO` to `quanru/rspress` (or the upstream repository
   name after integration), and allow the trusted branch in `github-pages`.
4. Configure model credentials in repository settings or the `Model` environment.
   The API key remains a secret; model name, family, and base URL can be variables
   or secrets. The environment does not create a deployment record.

Manual dispatch can disable publication with `publish_pages`. Without Pages,
download the report and screenshots together from the artifact. The stable run
entry redirects to the native framework index. Runs are serialized across branches
to preserve recent report history.

Publication retains the latest three trusted runs within a 900 MiB budget.
Older Summary links expire when their run is pruned; artifacts expire after 14 days.

## Dependency audit

`npm audit` reports advisories in the current Midscene 1.15.3 dependency tree,
including image processing and Puppeteer archive dependencies. These packages
stay in this isolated test harness, not the product's runtime dependencies.
Use synthetic local fixtures and a dedicated quota-limited model key. Do not run
`npm audit fix --force`: its suggested framework downgrades are incompatible with
this integration.
