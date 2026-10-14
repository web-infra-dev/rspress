# Midscene AI E2E

Exercise search, translated and versioned navigation, documentation components,
generated API pages, previews, playgrounds, HMR, and production/static rendering.
The fixture launcher runs the checked-out CLI against original `e2e/fixtures`;
the initial documentation examples remain separate smoke cases.

`migration-inventory.json` records the original E2E cases and their migration
decisions. Original exact DOM, CSS, timing, build-output, and browser-event
assertions remain unchanged. A visible AI flow does not replace those contracts.
The 112 AI cases include counterparts for visible behavior in 129 of the 237
original tests; 108 tests remain deterministic-only. Multiple original tests can
map to one AI flow. Inventory evidence identifies local runs, not remote CI passes.

Existing Rstest and Playwright suites are unchanged. This isolated npm package uses
`@midscene/test` 1.15.1, not Vitest. Each case starts in a fresh browser context.
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

Start the fixture in one terminal:

```sh
cd tests/midscene
npm run serve
```

Run the suite in another terminal:

```sh
cd tests/midscene
npm run check:model-vision
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
and rejects atomic AI operations or custom product-interaction nodes. Report tests
cover missing cases, failed attempts, screenshot deep links, native report merging,
publication failures, and bounded Pages history.

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

The final **Midscene results** Summary always shows available counts and artifact
downloads. For the screenshot-and-report table and clickable HTML entry:

1. Ensure this repository's GitHub Pages site is dedicated to these reports.
   **Do not enable this if Pages already hosts the project's documentation.**
2. Set **Settings → Pages → Source** to **GitHub Actions**.
3. Set the Actions variable `MIDSCENE_PUBLISH_REPO` to the exact repository name,
   for example `quanru/rspress`.
4. Allow the trusted workflow branch in the `github-pages` environment.

Pages remains opt-in to avoid overwriting an existing docs site. Without Pages,
download the native HTML report and screenshots together from the artifact.
With Pages, the Summary table links each case screenshot to its native report step.
The top report entry uses Midscene's native merged report, not a custom HTML index.

Publication retains the latest three trusted runs within a 900 MiB budget.
Older Summary links expire when their run is pruned; artifacts expire after 14 days.

## Dependency audit

`npm audit` reports advisories in the current Midscene 1.15.1 dependency tree,
including image processing and Puppeteer archive dependencies. These packages
stay in this isolated test harness, not the product's runtime dependencies.
Use synthetic local fixtures and a dedicated quota-limited model key. Do not run
`npm audit fix --force`: its suggested framework downgrades are incompatible with
this integration.
