# Repository guidelines

## Project structure & module organization

- Monorepo via `pnpm` + `Nx`.
- Packages: `packages/core` (CLI + `@rspress/core`), `packages/theme-default` (Default theme), `packages/plugin-*` (Official plugins), `packages/create-rspress` (scaffolder).
- Tests: `packages/*/tests` (unit) and `e2e/` (end-to-end tests); website examples in `website/`.
- Key config: `nx.json`, `biome.json`, `.prettierrc`, `playwright.config.ts`, `pnpm-workspace.yaml`.

## Build, test, and development commands

- Install: `pnpm install` (Node >= 18.0, pnpm >= 10.15).
- Build: `pnpm build` (all) and `pnpm build:website`.
- Watch dev: `pnpm dev` (all packages) or `pnpm dev:website` (documentation site).
- Lint/format: `pnpm lint`; auto-fix: `pnpm format`.
- Tests: `pnpm test`; targeted: `pnpm test:unit` or `pnpm test:e2e`; update snapshots: `pnpm testu`.

## Coding style & naming conventions

- TypeScript + ESM; spaces; single quotes.
- Biome is canonical linter/formatter; Prettier formats MD/CSS/JSON and `package.json`.
- Filenames: `camelCase` or `PascalCase` (Biome enforced).

## Testing guidelines

- Unit: `rstest`; E2E: `@playwright/test`.
- Naming: `*.test.ts`/`*.test.tsx`; snapshots in `__snapshots__/`.
- Placement: unit under `packages/*/tests`; e2e under `e2e/`.

## Commit & pull request guidelines

- Conventional Commits (e.g., `feat(plugin-algolia): ...`); keep commits focused; run lint + tests.
- User-facing changes need a Changeset (`pnpm changeset`); PRs should include description, linked issues, and doc/example updates when needed.

## Architecture overview

- `packages/core` (`@rspress/core`): CLI `rspress build/dev` (add `--watch`), config via `rspress.config.ts` using `defineConfig`; programmatic `import { defineConfig, loadConfig } from '@rspress/core'`.
- `packages/core/theme` (`@rspress/core/theme`): Default theme with components and layouts.
- `packages/runtime` (`@rspress/runtime`): Runtime hooks and utilities for theme development.
- `packages/plugin-*` (`@rspress/plugin-*`): Official plugins like `plugin-algolia` (search), `plugin-llms` (LLM optimization), `plugin-typedoc` (API docs), etc.
- `packages/create-rspress` (`create-rspress`): scaffold new projects/templates with `pnpm dlx create-rspress` (or `npx create-rspress`).

## Runtime API (`@rspress/runtime`)

Key hooks and utilities for theme/plugin development:

- `usePage()`: Returns current page metadata (`pageType`, `lang`, `title`, `frontmatter`, etc.).
- `useSite()`: Returns site-level configuration.
- `useFrontmatter()`: Returns current page's frontmatter data.
- `useLocaleSiteData()`: Returns locale-specific site data.
- `useLocation()`, `useNavigate()`: React Router wrappers for navigation.
- `Content`: Component to render MDX content.
- `NoSSR`: Wrapper to skip server-side rendering for children.
- `withBase(path)`: Prepends base path to URLs.

## SSG-MD implementation patterns

SSG-MD renders pages to Markdown for LLM consumption. Key patterns:

- Use `process.env.__SSR_MD__` to detect SSG-MD rendering context.
- Components should return Markdown-formatted strings in SSG-MD mode.
- Example pattern for custom components:

```tsx
function MyComponent({ data }) {
  if (process.env.__SSR_MD__) {
    return <>{`**${data.title}**: ${data.description}`}</>;
  }
  return <div className="fancy">{data.title}</div>;
}
```

- Built-in components (HomeLayout, Overview, PackageManagerTabs, etc.) already support SSG-MD.
- Output files: `llms.txt` (index), `llms-full.txt` (all content), per-route `.md` files.

## SSR compatibility guidelines

When writing theme components, ensure SSR compatibility:

- Use `useEffect` instead of `useLayoutEffect` to avoid SSR warnings.
- Guard browser APIs with `typeof window === 'undefined'` checks.
- Avoid global mutable state that differs between server/client (causes hydration mismatch).
- Example safe localStorage access:

```tsx
useEffect(() => {
  if (typeof window === 'undefined') return;
  const value = localStorage.getItem(key);
  // ...
}, [key]);
```

## Theme development

- CSS class naming follows BEM convention with `.rp-` prefix (e.g., `.rp-nav__title`, `.rp-nav-menu__item--active`).
- CSS variables use `--rp-*` namespace (e.g., `--rp-c-brand`, `--rp-code-block-bg`).
- Theme entry: `@rspress/core/theme` exports `Layout`, `HomeLayout`, `DocLayout`, `Nav`, etc.

## Documentation structure

- English docs: `website/docs/en/`
- Chinese docs: `website/docs/zh/`
- Navigation config: `_nav.json` in locale directories.
- Sidebar config: `_meta.json` in each section directory.
- Both `_nav.json` and `_meta.json` support HMR in dev mode.

## Security & configuration tips

- Do not commit build artifacts (`dist/`, `compiled/`).
- Nx caching is enabled; scripts use `NX_DAEMON=false` for reproducible CI.
