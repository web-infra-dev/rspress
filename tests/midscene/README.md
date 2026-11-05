# Midscene E2E

AI cases supplement the original deterministic tests. Interactions use `aiAct`,
with independent `aiAssert` checks and no case retries.

## Run locally

Use Node.js 24 and the repository's pinned pnpm version:

```sh
pnpm install --frozen-lockfile
pnpm build
cd tests/midscene
pnpm exec playwright install chromium
cp .env.example .env
# Fill in .env with your vision model configuration.
pnpm run check:model
pnpm test
```

Set `MIDSCENE_FILE_CONCURRENCY` to change local concurrency (default: 1).
Reports: `midscene_run/report/`. Type checking: `pnpm run typecheck`.

## CI

[Workflow](../../.github/workflows/midscene.yml): relevant upstream main pushes
and trusted manual runs. Model calls consume tokens.

In repository settings or the `Model` environment, configure the four
`MIDSCENE_MODEL_*` secrets from [.env.example](.env.example).

Midscene Action writes native test results to Summary and uploads downloadable
HTML report artifacts. Cloudflare is optional: to also publish online reports,
set secret `CLOUDFLARE_API_TOKEN` with Workers Scripts edit permission and variable
`CLOUDFLARE_ACCOUNT_ID`. Enable Worker Preview URLs if no URL is returned.

If either Cloudflare credential is missing, tests still run and Summary explains
why online publication was skipped. Manual `publish_pages=false` also disables
publication. Invalid configured credentials still cause a publication failure.
GitHub Pages is not required.

The offline `assets/rspress-logo.svg` comes from
https://assets.rspack.rs/rspress/rspress-logo.svg (2026-10-15).

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
