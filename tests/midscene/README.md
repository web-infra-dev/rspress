# Midscene AI E2E

Exercise search, translated and versioned navigation, documentation components,
generated API pages, previews, playgrounds, HMR, and production/static rendering.
The fixture launcher runs the checked-out CLI against original `e2e/fixtures`;
the initial documentation examples remain separate smoke cases.

`migration-inventory.json` accounts for every test at the recorded baseline
commit. Assertion-level review is complete; no original is left pending.

| Original test disposition                              | Count |
| ------------------------------------------------------ | ----: |
| Pure UI originals removed and replaced by Midscene     |    54 |
| Mixed originals split; only technical contracts remain |    66 |
| Technical-only originals retained                      |   117 |
| Total baseline originals                               |   237 |

The suite contains **153 AI cases** and **183 remaining deterministic tests**.
This is not a one-to-one translation: one long original may require several
viewport-sized AI checks, while multiple originals can share a user flow.
No replaced test is disabled with `skip`; Git history preserves its source.
The existing Linux, macOS and Windows workflows continue to run the remaining
technical tests with `pnpm test:e2e`.

AI cases cover visible navigation, search, sidebars, generated API pages, previews,
playgrounds, code panels, language/version switching, package-manager commands,
HMR and production/static rendering. All five package managers are checked across
six synchronized panels (30 original commands). Long pages are checked in focused
sections; action completion is never used as an assertion.

Exact URL/href/src strings, DOM counts and classes, serialized HTML, CSS values,
metadata, browser events, controlled search races, transient loading fallbacks,
filesystem/build output and server restart counts remain deterministic. HMR tests
wait for an update to attach before measuring retained window/React state and
restart counts. Those waits are synchronization, not visible E2E proof.
The inventory deliberately does not claim that AI preserves every original matcher
literally; it records the replacement scope and per-case evidence instead.

The audit also added missing awaits to filesystem checks in icon, public-directory and
LLMS tests, made strict SSG failure reject an unexpectedly successful build, and
closed each asset-test preview process after its test.

Local validation on 2026-10-15:

- `pnpm test:e2e`: 183/183 deterministic tests passed across 62 files.
- `20261015171335-c8e822b8`: 35 completed cases passed and three failed before
  the run was deliberately stopped during a fourth incorrect prompt. This is
  **not** a successful full run; its individual completed result files remain.
- `20261015175519-35748856`: 21/21 passed, including the four corrected prompts,
  every unexecuted case and the generated raw-link regression.
- Together these runs verify 56 distinct cases, including every newly added or
  strengthened case. Automatic retries remain disabled. Local evidence does not
  substitute for a full remote run on the final commit.

Prompt corrections describe the actual UI: Nested is a directory card, an empty
custom home has no configured hero, a vertical Playground preview sits above its
editor, a tablet hamburger offers Theme, and the sidebar badge belongs to the
Introduction label rather than its internal overview identifier.

Remote run [38718473488](https://github.com/quanru/rspress/actions/runs/38718473488)
on `db99ff7` passed 148/153 cases with no retries. Its five failures exposed
ambiguous or inaccurate prompts: group labels were compared across groups,
the overview title panel was mistaken for an article column, an iframe action
tried to uncover its whole border, the small social popup was called large,
and a bottom-of-page counter was described only as a global component.
The corrected five cases passed twice locally without retries:
`20261015205824-e76a6c8c` and `20261015210312-9771190c` (5/5 each).
The social popup additionally checks absence before hover and after moving away.
These focused runs do not constitute a successful full remote run.

Remote run [38740264126](https://github.com/quanru/rspress/actions/runs/38740264126)
on `03908bb` passed 152/153 cases with no retries, including all five corrections.
NAV-04 timed out while the model repeatedly clicked the selected version instead
of opening the adjacent language menu. Its instruction now targets the English
language menu directly; the independent assertion checks the Chinese article,
selected language and unchanged v1 version. The corrected case passed three
independent local runs on 2026-10-16 with no retries:
`20261016001537-8c860a86`, `20261016001928-a8b102b0` and
`20261016002019-cecc0dd3`. Full remote validation is still required.

Remote run [38768414212](https://github.com/quanru/rspress/actions/runs/38768414212)
on `df7d1b4` passed 151/153 cases with no retries, including NAV-04.
PREVIEW-06's screenshot contained the expected rendered text, but the model
misread the line at the preview's upper edge as a title above an empty preview.
Its assertions now describe the visible line at that edge, distinct from the
colored source code. VIRTUAL-03's GitHub icon was already visible; the plural
"social icons" instruction made the model search for nonexistent extra icons.
The redundant action is removed; its independent icon assertion and actual
counter interaction remain. The counter action now identifies the bottom status
row explicitly. Both corrected cases passed three independent local runs:
`20261016021850-5b53d0de`, `20261016022001-bf219da4` and
`20261016022105-6306a45b` (2/2 each, no retries). These are focused checks,
not a successful full remote run.

A separate local negative control on 2026-10-16 first passed the corrected JSX
assertion against the real fixture, then hid only the first iframe body's rendered
output while retaining the matching source code. The same assertion correctly
failed for the blank preview. This fault injection changed only the temporary
browser session, not fixture source files.

Remote run [38785211479](https://github.com/quanru/rspress/actions/runs/38785211479)
on `324ed0f` passed 151/153 with no retries; PREVIEW-06 and VIRTUAL-03 passed.
SEARCH-08's planner mistook the existing `す` for `さ` and skipped the replacement;
its independent result assertion correctly failed. The instruction now requires
an actual replacement even when the characters look similar. STATIC-01's Target
link was visible, but the model could not infer JavaScript availability from a
screenshot. Its visual assertions now check only the visible links; browser setup
still disables JavaScript. Collection additionally rejects any STATIC case that
enables JavaScript or does not use a production build. Both negative guard checks
were verified using in-memory definition mutations, without changing case files.
The two corrected cases passed three independent local runs with no retries:
`20261016035600-57a6fa1f`, `20261016035820-646ae396` and
`20261016040013-61f76e1a` (2/2 each). Full remote validation remains required.

Remote run [38798831268](https://github.com/quanru/rspress/actions/runs/38798831268)
on `52c4031` passed 151/153 with no retries; SEARCH-08 and STATIC-01 passed.
INLINE-02 misinterpreted "remaining" as entries after delete, although emphasis
was correctly above delete in its screenshot. Its assertion now describes that
explicit spatial relation and retains every expected entry and literal character.
VIRTUAL-02's translation had updated, but the planner expected the entire joined
status row to equal Translation after. Its wait now targets only the translation
portion, preserving the neighboring search label and counter. The final counter
wait also includes its retained value. Both cases passed three independent local
runs: `20261016052639-e1651c56`, `20261016052919-97d75574` and
`20261016053126-5b5e3bb2` (2/2 each, no retries). Full remote validation remains
required.

A local negative control passed the corrected outline assertion on the original
page, then swapped emphasis and delete only in the outline. The same assertion
correctly rejected that reversed order while the article and sidebar stayed intact.
The fault injection affected only a temporary browser session.

Remote run [38811047337](https://github.com/quanru/rspress/actions/runs/38811047337)
on `49bf724` passed 151/153 cases; INLINE-02 and VIRTUAL-02 both passed.
SEARCH-04 failed after two consecutive model requests hit the 180-second hard
timeout. That is a model-request failure, not a demonstrated keyboard regression;
its case remains unchanged. Several other requests timed out once and recovered.
Case retries remain disabled, distinct from the framework's model-request retry.
SEARCH-08 showed the correct Japanese input and result, but the assertion's reason
contradictorily rejected text identical to its expected text. Its assertion now
identifies the result title, pronunciation and highlighted suffix, retaining the
exactly-one-result requirement. The complete case passed three independent local
runs: `20261016072016-5eb1edf9`, `20261016072229-a77ef6ba` and
`20261016072403-5347d110` (1/1 each, no case retries). Full remote validation
remains required.

A local control passed the corrected Japanese assertion on the real result,
then rejected both an incorrect Japanese label with the same highlighted suffix
and two duplicate result rows. These faults changed only the temporary browser
session; all four query/count/text checks remain in the case.

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
The exact Rspress logo URL is fulfilled from its original SVG copy in `assets/`.
Image checks verify rendering, not external CDN availability.

`fixture.update` changes only allowlisted source text in an isolated temporary
fixture copy for HMR checks. It does not operate the UI or modify original sources.
Temporary copies and their owned CLI processes are cleaned up after the run.
Signal-terminated processes are not reused, and teardown has a bounded wait.
Fixture isolation, readiness and browser capabilities share one policy in
`scripts/original-fixture-data.ts`; mutation targets automatically require isolation.

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
the local repository fixtures and synthetic smoke pages, never private user data.

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

Pages publication requires an existing native HTML report. Incomplete runs keep
downloadable artifacts and an explanatory Summary without replacing the existing
site or publishing a broken report link. Retention always protects the current
run, including a rerun whose run ID is older than the retained history.

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

## CI evidence table

After Pages deployment succeeds, the publishing job adds a per-case Markdown
table to the workflow Summary: project, case, screenshot, status, duration,
and a link to the selected step in the native Midscene report. Failed cases
appear first. Successful cases use the last recorded step; failures use the
first failing step. Screenshots come from that step's execution trace, not a
different case or a synthetic image. Missing captures are explicitly marked.
The top-level report link still opens the framework-generated HTML report.
Without Pages, the test job retains the native text Summary and artifact link.
