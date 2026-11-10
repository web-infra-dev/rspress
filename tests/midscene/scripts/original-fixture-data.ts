export const originalFixtures = [
  'search',
  'search-code-blocks',
  'search-i18n',
  'i18n',
  'i18n-source-text',
  'multi-version',
  'multi-version-global-sidebar',
  'nav-link-items',
  'nav-link-items-clean',
  'nav-link-item-with-hash',
  'auto-nav-sidebar-no-meta',
  'auto-nav-sidebar-dir-convention',
  'tabs-component',
  'package-manager-tabs',
  'basic',
  'basic-dark',
  'basic-force-dark',
  'basic-system',
  'basic-cli-base',
  'clean-urls-redirect',
  'clean-urls-redirect-clean',
  'clean-urls-redirect-disabled',
  'custom-icon',
  'title-number',
  'markdown-link-asset',
  'markdown-link-asset-clean',
  'plugin-preview-no-iframe',
  'custom-layout',
  'nav-slots',
  'inline-markdown',
  'nested-overview',
  'auto-nav-sidebar',
  'custom-plugin',
  'replace-rules',
  'page-type-home',
  'plugin-api-docgen/locales',
  'plugin-api-docgen/single',
  'plugin-preview',
  'plugin-preview-custom-entry',
  'plugin-twoslash',
  'plugin-typedoc/single',
  'plugin-typedoc/multi',
  'plugin-playground',
  'plugin-playground-preview',
  'code-block-runtime',
  'with-base',
  'react-18',
  'react-19',
  'react-router-dom-6',
  'public-dir',
  'dynamic-toc',
  'hash-anchor-scroll',
  'auto-nav-sidebar-issue-1682',
  'issue-1309',
  'custom-home-footer',
  'code-block',
  'banner',
  'no-config-root',
  'tailwind-v4',
  'theme-css',
  'github-alert-mdxjs',
  'search-hooks',
  'search-algolia',
  'hmr',
  'hmr-lazy',
  'production',
] as const;

// These source-only siblings are imported by a fixture's configuration.
export const fixtureSharedDirectories: Record<string, readonly string[]> = {
  'multi-version-global-sidebar': ['multi-version'],
};

export const fixtureAliases: Record<
  string,
  { directory: string; config?: string; args?: string[] }
> = {
  'basic-cli-base': { directory: 'basic', args: ['--base', '/bar/'] },
  'clean-urls-redirect-clean': {
    directory: 'clean-urls-redirect',
    config: 'rspress.clean-urls.config.ts',
  },
  'clean-urls-redirect-disabled': {
    directory: 'clean-urls-redirect',
    config: 'rspress.disabled.config.ts',
  },
  'markdown-link-asset-clean': {
    directory: 'markdown-link-asset',
    config: 'rspress-clean.config.ts',
  },
  'plugin-preview-no-iframe': {
    directory: 'plugin-preview',
    config: 'rspress.no-iframe.config.ts',
  },
  'nav-link-items-clean': {
    directory: 'nav-link-items',
    config: 'rspress-clean.config.ts',
  },
  'hmr-lazy': { directory: 'hmr', config: 'rspress.lazy.config.ts' },
  'basic-dark': { directory: 'basic', config: 'rspress.dark.config.ts' },
  'basic-force-dark': {
    directory: 'basic',
    config: 'rspress.force-dark.config.ts',
  },
  'basic-system': { directory: 'basic', config: 'rspress.true.config.ts' },
};

export const fixtureMutations = {
  article: {
    fixtures: ['hmr', 'hmr-lazy'],
    change: ['doc/guide/test.mdx', 'Hello world', 'Hello hmr world'],
  },
  fragment: {
    fixtures: ['hmr', 'hmr-lazy'],
    change: [
      'doc/guide/_mdx-fragment.mdx',
      'This is **mdx fragment**',
      'This is **hmr mdx fragment**',
    ],
  },
  navigation: {
    fixtures: ['hmr', 'hmr-lazy'],
    change: ['doc/_nav.json', '"Guide"', '"HMR Guide"'],
  },
  sidebar: {
    fixtures: ['hmr', 'hmr-lazy'],
    change: ['doc/guide/_meta.json', '["test"]', '["foo"]'],
  },
  'preview-internal': {
    fixtures: ['plugin-preview'],
    change: ['doc/hmr.mdx', 'HMR Internal Original', 'HMR Internal Updated'],
  },
  'preview-follow': {
    fixtures: ['plugin-preview'],
    change: [
      'doc/hmr.mdx',
      'HMR Iframe Follow Original',
      'HMR Iframe Follow Updated',
    ],
  },
  'preview-fixed': {
    fixtures: ['plugin-preview'],
    change: [
      'doc/hmr.mdx',
      'HMR Iframe Fixed Original',
      'HMR Iframe Fixed Updated',
    ],
  },
  playground: {
    fixtures: ['plugin-playground'],
    change: [
      'doc/index.mdx',
      'Hello World Internal (default)',
      'Hello World Internal (updated)',
    ],
  },
  translation: {
    fixtures: ['hmr-lazy'],
    change: ['i18n.json', 'Translation before', 'Translation after'],
  },
  'search-hook': {
    fixtures: ['hmr-lazy'],
    change: ['searchHooks.tsx', 'Search hook before', 'Search hook after'],
  },
  'counter-label': {
    fixtures: ['hmr-lazy'],
    change: ['virtualProbe.tsx', 'Count:', 'Updated count:'],
  },
  'search-renderer-remove': {
    fixtures: ['hmr-lazy'],
    change: [
      'searchHooks.tsx',
      'export const render = () => <span>Search hook after</span>;',
      'export const onSearch = () => [];',
    ],
  },
} as const;
export type FixtureUpdatePart = keyof typeof fixtureMutations;
export const fixtureUpdateParts = Object.keys(
  fixtureMutations,
) as FixtureUpdatePart[];

interface FixturePolicy {
  isolated: boolean;
  previewPort: boolean;
  playgroundAssets: boolean;
  iframeOrigins: boolean;
  waitForFrames: boolean;
  readyPath: string;
  readySelector: string;
}

const fixturePolicies: Readonly<Record<string, Partial<FixturePolicy>>> = {
  search: { readyPath: '/base/' },
  'multi-version': { readyPath: '/base/' },
  'page-type-home': { readyPath: '/base/' },
  'nav-link-item-with-hash': { readySelector: '#pageA' },
  'plugin-preview': {
    previewPort: true,
    iframeOrigins: true,
    waitForFrames: true,
  },
  'plugin-preview-custom-entry': {
    previewPort: true,
    iframeOrigins: true,
    waitForFrames: true,
  },
  'plugin-preview-no-iframe': { iframeOrigins: true, waitForFrames: true },
  'plugin-playground': { playgroundAssets: true },
  'plugin-playground-preview': { playgroundAssets: true, iframeOrigins: true },
};

/** Fixture capabilities shared by collection, process setup and browser setup. */
export function fixturePolicy(name?: string): FixturePolicy {
  return {
    isolated: Object.values(fixtureMutations).some(mutation =>
      mutation.fixtures.some(fixture => fixture === name),
    ),
    previewPort: false,
    playgroundAssets: false,
    iframeOrigins: false,
    waitForFrames: false,
    readyPath: '/',
    readySelector: 'h1, .rp-home-hero, .rspress-doc, .rp-overview',
    ...(name ? fixturePolicies[name] : undefined),
  };
}
