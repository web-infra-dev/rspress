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

## Attribution

<details>
<summary>Adapted Rome fixture support — MIT License</summary>

Fixture support adapted from https://github.com/rome-os/rome
at commit 5adc5748163718dd7af69d789965a3700ba9cea0.

MIT License

Copyright (c) 2026 Rome OS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

</details>
