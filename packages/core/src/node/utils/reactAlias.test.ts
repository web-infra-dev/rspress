import { describe, expect, it, rs } from '@rstest/core';
import {
  resolveReactAlias,
  resolveReactRenderToMarkdownAlias,
  resolveReactRouterDomAlias,
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

describe('resolveReactRouterDomAlias', () => {
  it('should resolve react-router-dom', async () => {
    const alias = await resolveReactRouterDomAlias();

    expect(alias).toMatchInlineSnapshot(`
      {
        "react-router-dom": "<PNPM_INNER>/react-router-dom",
      }
    `);
  });
});

describe('resolveReactRenderToMarkdownAlias', () => {
  it('should return empty object when react-render-to-markdown is not installed in cwd', async () => {
    const alias = await resolveReactRenderToMarkdownAlias();

    expect(alias).toMatchInlineSnapshot(`{}`);
  });
});
