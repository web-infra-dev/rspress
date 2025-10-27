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

- Unit: `vitest`; E2E: `@playwright/test`.
- Naming: `*.test.ts`/`*.test.tsx`; snapshots in `__snapshots__/`.
- Placement: unit under `packages/*/tests`; e2e under `e2e/`.

## Commit & pull request guidelines

- Conventional Commits (e.g., `feat(plugin-algolia): ...`); keep commits focused; run lint + tests.
- User-facing changes need a Changeset (`pnpm changeset`); PRs should include description, linked issues, and doc/example updates when needed.

## Architecture overview

- `packages/core` (`@rspress/core`): CLI `rspress build/dev` (add `--watch`), config via `rspress.config.ts` using `defineConfig`; programmatic `import { defineConfig, loadConfig } from '@rspress/core'`.
- `packages/core/theme` (`@rspress/core/theme`): Default theme with components and layouts.
- `packages/plugin-*` (`@rspress/plugin-*`): Official plugins like `plugin-algolia` (search), `plugin-llms` (LLM optimization), `plugin-typedoc` (API docs), etc.
- `packages/create-rspress` (`create-rspress`): scaffold new projects/templates with `pnpm dlx create-rspress` (or `npx create-rspress`).

## Security & configuration tips

- Do not commit build artifacts (`dist/`, `compiled/`).
- Nx caching is enabled; scripts use `NX_DAEMON=false` for reproducible CI.
