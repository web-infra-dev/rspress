import { afterEach, describe, expect, it, rs } from '@rstest/core';
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
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should resolve all react aliases for client (non-SSR)', async () => {
    const alias = await resolveReactAlias(false);

    expect(Object.keys(alias).sort()).toMatchInlineSnapshot(`
      [
        "react",
        "react-dom",
        "react-dom/client",
        "react-dom/package.json",
        "react-dom/server",
        "react/jsx-dev-runtime",
        "react/jsx-runtime",
        "react/package.json",
      ]
    `);
  });

  it('should resolve all react aliases for SSR', async () => {
    const alias = await resolveReactAlias(true);

    expect(Object.keys(alias).sort()).toMatchInlineSnapshot(`
      [
        "react",
        "react-dom",
        "react-dom/client",
        "react-dom/package.json",
        "react-dom/server",
        "react/jsx-dev-runtime",
        "react/jsx-runtime",
        "react/package.json",
      ]
    `);
  });

  it('should respect NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';
    const alias = await resolveReactAlias(false);

    expect(Object.keys(alias).sort()).toMatchInlineSnapshot(`
      [
        "react",
        "react-dom",
        "react-dom/client",
        "react-dom/package.json",
        "react-dom/server",
        "react/jsx-dev-runtime",
        "react/jsx-runtime",
        "react/package.json",
      ]
    `);
  });

  it('should default to development when NODE_ENV is undefined', async () => {
    delete process.env.NODE_ENV;
    const alias = await resolveReactAlias(false);

    expect(Object.keys(alias).sort()).toMatchInlineSnapshot(`
      [
        "react",
        "react-dom",
        "react-dom/client",
        "react-dom/package.json",
        "react-dom/server",
        "react/jsx-dev-runtime",
        "react/jsx-runtime",
        "react/package.json",
      ]
    `);
  });
});

describe('resolveReactRouterDomAlias', () => {
  it('should resolve react-router-dom', async () => {
    const alias = await resolveReactRouterDomAlias();

    expect(Object.keys(alias)).toMatchInlineSnapshot(`
      [
        "react-router-dom",
      ]
    `);
  });
});

describe('resolveReactRenderToMarkdownAlias', () => {
  it('should return empty object when react-render-to-markdown is not installed in cwd', async () => {
    const alias = await resolveReactRenderToMarkdownAlias();

    expect(alias).toMatchInlineSnapshot(`{}`);
  });
});
