# Rspress v2 Breaking Changes (from discussion #1891)

Source: https://github.com/web-infra-dev/rspress/discussions/1891

## Custom themes require named exports (PR https://github.com/web-infra-dev/rspress/pull/1873)
- All theme components are named exports; remove default export wrappers.
- Use `@rspress/core/theme-original` (e.g., `export { Layout }`), then re-export other pieces.

## Shiki v3 by default, prism removed (PRs 1672/2046/2122)
- Code highlighting now uses Shiki at compile time; `@rspress/plugin-shiki` is unnecessary.
- Configure via `markdown.shiki`; transformers move to `@shikijs/transformers`.

## Built-in Sass/Less plugins removed (PR 1937)
- Install and register `@rsbuild/plugin-sass` or `@rsbuild/plugin-less` manually.

## React 19 default; min React 18
- React 17 unsupported; aliases avoid duplicate React installs.

## Search includes code blocks by default (PR 1952)
- `search.codeBlocks` enabled; results may include more code matches.

## Tailwind prefix added to built-in theme (PR 1990)
- Theme classes are prefixed for isolation. If you rely on classes like `dark:hidden`, configure Tailwind/UnoCSS accordingly.

## cleanUrls drops `/index` in `<Link />` (PR 1976)
- When `cleanUrls: true`, generated links omit `/index`; adjust any URL consumers relying on the suffix.

## SSG strict by default; `ssg.strict` removed (PR 2015)
- No CSR fallback on SSG failure; build exits. Set `ssg: false` to skip SSG if needed.

## unified@11 + MDX deps upgrade (PR 2017)
- Custom remark/rehype plugins must be compatible with `unified@11`.

## Node 16/18 dropped; Node ≥20 required (PR 2085, 2073)

## Dynamic TOC generation (PR 2018)
- TOC now renders MDX/TSX components; any components inside headings will appear in the TOC.

## `dev.lazyCompilation` enabled by default (PR 2123)
- Much faster dev startup; disable via `builderConfig.dev.lazyCompilation = false` if it causes issues with preload.

## Line highlight syntax change (Shiki)
- Use `transformerNotationHighlight` or `transformerCompatibleMetaHighlight`; replace `{1,3-4}` meta with notation comments like `// [!code highlight]` or `// [!code highlight:4]`.

## `markdown.highlightLanguages` removed
- Shiki lazily loads languages; use `markdown.shiki.langAlias`/`langs` for aliases and explicit languages.

## Removed packages (integrated into core)
- `rspress`, `@rspress/theme-default`, `@rspress/plugin-shiki`, `@rspress/plugin-auto-nav-sidebar`, `@rspress/modernjs-plugin`, `@rspress/plugin-container-syntax`, `@rspress/plugin-last-updated`, `@rspress/plugin-medium-zoom`.

## Single Nav mode: rename top-level `_meta.json` → `_nav.json` (PR 2314)
- Without `_nav.json`, `themeConfig.nav` is not generated. Rename existing top-level `_meta.json` to `_nav.json`.

## `base` config reimplemented via react-router `basename` (PR 2322)
- `useLocation().pathname` no longer includes `base`. Use `Link`/`useNavigate` instead of `window.location` so routing respects `base`.

## Relative links without `./` now resolve relatively (PR 2348)
- `[subfolder](subfolder)` == `[subfolder](./subfolder)`; update links that expected absolute behavior.

## `performance.buildCache` enabled by default (PR 2349)
- Persistent cache accelerates dev/build.

## `builderPlugins` removed; use `builderConfig.plugins` (PR 2371)
- Move any `builderPlugins: [pluginFoo()]` into `builderConfig.plugins`.

## `RspressPlugin` type exposed from `@rspress/core` (PR 2360)
- Import from `@rspress/core`; set `@rspress/core` as plugin peerDependency. Avoid `@rspress/shared`.

## External demo code blocks move to core syntax (PR 2361)
- Replace `<code src="./example.tsx" />` with fenced blocks: ```` ```tsx file="./example.tsx" ``` ````.

## `rspress` package merged into `@rspress/core` (PR 2386)
- Rename imports: `rspress`/`rspress/core`/`rspress/config` → `@rspress/core`; `rspress/theme` → `@rspress/core/theme`; `rspress/runtime` → `@rspress/core/runtime`; `rspress/shiki-transformers` → `@rspress/core/shiki-transformers`; `@rspress/theme-default` → `@rspress/core/theme-original`.

## `markdown.link.checkDeadLinks` enabled by default (PR 2423)
- New implementation for more accurate dead-link detection/logging.

## MDX fragments routing: `_`-prefixed files auto-excluded (PR 2149)
- MDX fragments/React components should be excluded from routing; files starting with `_` are excluded by convention.

## Raw HTML styled by default (PR 2600)
- Plain HTML tags receive prose styling; use `.rp-not-doc` to opt out when needed.

## Default theme translations built-in (PR 2738)
- Built-in locale strings with tree-shaking; remove manual `themeConfig.locales` text overrides unless customizing via `i18nSource`.

## `react-router-dom` 7 default (PR 1802)
- Defaults: React ^19, `react-router-dom` ^7. Compatible: React/ReactDOM ^18–^19, RRD ^6–^7. Uses user-installed versions if present.
