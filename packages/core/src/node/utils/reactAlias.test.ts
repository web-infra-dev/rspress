import path from 'node:path';
import { describe, expect, it, rs } from '@rstest/core';
import {
  resolveReactAlias,
  resolveReactRenderToMarkdownAlias,
  resolveReactRouterAlias,
} from './reactAlias';

rs.mock('@rspress/shared/logger', () => ({
  logger: {
    info: rs.fn(),
    warn: rs.fn(),
    error: rs.fn(),
    success: rs.fn(),
  },
}));

rs.mock('../logger/hint', () => ({
  hintReactVersion: rs.fn(),
}));

describe('resolveReactAlias', () => {
  it('should resolve all react aliases for client (non-SSR)', async () => {
    const alias = await resolveReactAlias(false);

    expect(alias).toMatchInlineSnapshot(`
      {
        "react": "<PNPM_INNER>/react/index.js",
        "react-dom": "<PNPM_INNER>/react-dom/index.js",
        "react-dom/client": "<PNPM_INNER>/react-dom/client.js",
        "react-dom/package.json": "<PNPM_INNER>/react-dom/package.json",
        "react-dom/server": "<PNPM_INNER>/react-dom/server.browser.js",
        "react/jsx-dev-runtime": "<PNPM_INNER>/react/jsx-dev-runtime.js",
        "react/jsx-runtime": "<PNPM_INNER>/react/jsx-runtime.js",
        "react/package.json": "<PNPM_INNER>/react/package.json",
      }
    `);
  });

  it('should resolve all react aliases for SSR', async () => {
    const alias = await resolveReactAlias(true);

    expect(alias).toMatchInlineSnapshot(`
      {
        "react": "<PNPM_INNER>/react/index.js",
        "react-dom": "<PNPM_INNER>/react-dom/index.js",
        "react-dom/client": "<PNPM_INNER>/react-dom/client.js",
        "react-dom/package.json": "<PNPM_INNER>/react-dom/package.json",
        "react-dom/server": "<PNPM_INNER>/react-dom/server.node.js",
        "react/jsx-dev-runtime": "<PNPM_INNER>/react/jsx-dev-runtime.js",
        "react/jsx-runtime": "<PNPM_INNER>/react/jsx-runtime.js",
        "react/package.json": "<PNPM_INNER>/react/package.json",
      }
    `);
  });
});

describe('resolveReactRouterAlias', () => {
  it('should resolve the built-in React Router v8', async () => {
    const alias = await resolveReactRouterAlias();

    expect(alias).toMatchInlineSnapshot(`
      {
        "react-router$": "<PNPM_INNER>/react-router/dist/production/index.js",
        "react-router/package.json": "<PNPM_INNER>/react-router/package.json",
      }
    `);
  });

  it('should resolve React Router v7 from react-router-dom', async () => {
    const originalCwd = process.cwd();
    process.chdir(
      path.resolve(import.meta.dirname, '../../../../../e2e/fixtures/react-18'),
    );

    try {
      const alias = await resolveReactRouterAlias();
      expect(alias).toMatchInlineSnapshot(`
        {
          "react-router": "<PNPM_INNER>/react-router",
        }
      `);
    } finally {
      process.chdir(originalCwd);
    }
  });
});

describe('resolveReactRenderToMarkdownAlias', () => {
  it('should return empty object when react-render-to-markdown is not installed in cwd', async () => {
    const alias = await resolveReactRenderToMarkdownAlias();

    expect(alias).toMatchInlineSnapshot(`{}`);
  });
});
