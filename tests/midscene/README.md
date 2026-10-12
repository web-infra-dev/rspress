# Midscene AI E2E

Search for a deployment page, follow guide links, and navigate the documentation on a phone-sized viewport. The fixture runs the checked-out Rspress CLI and default theme.

Existing Rstest and Playwright suites are unchanged. This isolated npm package uses
`@midscene/test` 1.15.1, not Vitest. Each case starts in a fresh browser context.
`app.open` only prepares the browser; all product interactions use `aiAct`.
Separate `aiAssert` steps check outcomes instead of treating an AI action's completion
as proof of success. Browser requests stay on the local fixture origin.

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

The fixture listens on `http://127.0.0.1:4173`. Set
`MIDSCENE_INCLUDE_TAGS=search` (Rspress) or `MIDSCENE_INCLUDE_TAGS=assets`
(Rsdoctor) to run one flow. Retries are disabled so the first failure remains visible.

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
