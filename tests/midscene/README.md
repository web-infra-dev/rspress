# Midscene E2E

131 AI-driven cases supplement the original deterministic E2E tests.
Cases use `aiAct` for interactions and independent `aiAssert` checks, with case
retries disabled. Each YAML file owns an isolated browser context.

## Local execution

Use Node.js 24 and the repository's pinned pnpm version. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
cd tests/midscene
npm ci
npx playwright install chromium
cp .env.example .env
```

Fill in `.env` with a vision-capable model configuration. Exported environment
variables take precedence. Then run:

```sh
npm run check:model
npm test
```

`npm run typecheck` checks fixture support without model calls. Local execution is
serial by default; use `MIDSCENE_FILE_CONCURRENCY=5 npm test` for concurrency.
The setup starts and cleans up its fixture services. Reports are written to
`midscene_run/report/`, with structured results in `.midscene/test-results/`.

## CI configuration

[The workflow](../../.github/workflows/midscene.yml) runs AI tests on relevant
upstream `main` pushes and trusted manual dispatch, with 40 concurrent files
by default. PRs do not run model-backed tests. Each AI run consumes model tokens.

Set these Actions secrets in the repository or the `Model` environment:

- `MIDSCENE_MODEL_BASE_URL`: provider base URL, without `/chat/completions`.
- `MIDSCENE_MODEL_API_KEY`: dedicated model API key.
- `MIDSCENE_MODEL_NAME`: vision-capable model name.
- `MIDSCENE_MODEL_FAMILY`: matching Midscene model adapter.
- `CLOUDFLARE_API_TOKEN`: report account token with Workers Scripts edit permission.

Set `CLOUDFLARE_ACCOUNT_ID` as an Actions variable. The Worker name is
`rspress-midscene-reports`; enable Preview URLs if no preview URL is returned.
Missing configuration or failed model preflight fails the job explicitly.

Midscene Action uploads artifacts, publishes the native HTML report to Cloudflare,
and adds screenshot/report links to the job Summary. Manual dispatch can set
`publish_pages=false` for artifacts only. GitHub Pages is not required.
The Action currently uses a fork commit pending
[upstream screenshot-summary support](https://github.com/web-infra-dev/midscene-action/pull/1).

Original fixtures run through the checked-out Rspress CLI. HMR changes use isolated
copies. Playground assets are served from pinned local packages. The offline
`assets/rspress-logo.svg` was copied from
https://assets.rspack.rs/rspress/rspress-logo.svg on 2026-10-15; these tests check
rendering, not CDN availability.

See [NOTICE](NOTICE) for attribution of adapted Rome fixture support.
