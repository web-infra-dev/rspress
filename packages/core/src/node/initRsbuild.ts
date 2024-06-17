import path from 'node:path';
import {
  type UserConfig,
  removeLeadingSlash,
  MDX_REGEXP,
  RSPRESS_TEMP_DIR,
  removeTrailingSlash,
} from '@rspress/shared';
import fs from '@rspress/shared/fs-extra';
import type {
  RsbuildInstance,
  RsbuildConfig,
  RsbuildPlugin,
} from '@rsbuild/core';
import {
  CLIENT_ENTRY,
  SSR_ENTRY,
  PACKAGE_ROOT,
  OUTPUT_DIR,
  isProduction,
  inlineThemeScript,
  PUBLIC_DIR,
  DEFAULT_TITLE,
} from './constants';
import { rsbuildPluginDocVM } from './runtimeModule';
import { serveSearchIndexMiddleware } from './searchIndex';
import { detectReactVersion, resolveReactAlias } from './utils';
import { initRouteService } from './route/init';
import type { PluginDriver } from './PluginDriver';
import type { RouteService } from './route/RouteService';
import { detectCustomIcon } from './utils/detectCustomIcon';
import { PLUGIN_REACT_NAME, pluginReact } from '@rsbuild/plugin-react';
import { PLUGIN_SASS_NAME, pluginSass } from '@rsbuild/plugin-sass';
import { PLUGIN_LESS_NAME, pluginLess } from '@rsbuild/plugin-less';

export interface MdxRsLoaderCallbackContext {
  resourcePath: string;
  links: string[];
  root: string;
  base: string;
}

function isPluginIncluded(config: UserConfig, pluginName: string): boolean {
  return (
    config.builderPlugins?.some(plugin => plugin.name === pluginName) ||
    config.builderConfig?.plugins?.some(
      plugin => plugin && (plugin as RsbuildPlugin).name === pluginName,
    )
  );
}

async function createInternalBuildConfig(
  userDocRoot: string,
  config: UserConfig,
  isSSR: boolean,
  routeService: RouteService,
  pluginDriver: PluginDriver,
  runtimeTempDir: string,
): Promise<RsbuildConfig> {
  const cwd = process.cwd();
  const CUSTOM_THEME_DIR =
    config?.themeDir ?? path.join(process.cwd(), 'theme');
  const outDir = config?.outDir ?? OUTPUT_DIR;
  const DEFAULT_THEME = require.resolve('@rspress/theme-default');
  const checkDeadLinks = (config?.markdown?.checkDeadLinks && !isSSR) ?? false;
  const base = config?.base ?? '';

  // In production, we need to add assetPrefix in asset path
  const assetPrefix = isProduction()
    ? removeTrailingSlash(config?.builderConfig?.output?.assetPrefix ?? base)
    : '';
  const reactVersion = await detectReactVersion();

  const normalizeIcon = (icon: string | undefined) => {
    if (!icon) {
      return undefined;
    }

    if (path.isAbsolute(icon)) {
      return path.join(userDocRoot, PUBLIC_DIR, icon);
    }

    return icon;
  };

  // Using latest browserslist in development to improve build performance
  const browserslist = {
    web: isProduction()
      ? ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14']
      : [
          'last 1 chrome version',
          'last 1 firefox version',
          'last 1 safari version',
        ],
    node: ['node >= 14'],
  };

  return {
    plugins: [
      ...(isPluginIncluded(config, PLUGIN_REACT_NAME) ? [] : [pluginReact()]),
      ...(isPluginIncluded(config, PLUGIN_SASS_NAME) ? [] : [pluginSass()]),
      ...(isPluginIncluded(config, PLUGIN_LESS_NAME) ? [] : [pluginLess()]),
      rsbuildPluginDocVM({
        userDocRoot,
        config,
        isSSR,
        runtimeTempDir,
        routeService,
        pluginDriver,
      }),
    ],
    server: {
      port:
        !isProduction() && process.env.PORT
          ? Number(process.env.PORT)
          : undefined,
      printUrls: ({ urls }) => {
        return urls.map(url => `${url}/${removeLeadingSlash(base)}`);
      },
      publicDir: isSSR
        ? false
        : {
            name: path.join(userDocRoot, PUBLIC_DIR),
          },
    },
    dev: {
      progressBar: false,
      // Serve static files
      setupMiddlewares: [
        middlewares => {
          middlewares.unshift(serveSearchIndexMiddleware(config));
        },
      ],
    },
    html: {
      title: config?.title ?? DEFAULT_TITLE,
      favicon: normalizeIcon(config?.icon),
      template: path.join(PACKAGE_ROOT, 'index.html'),
      tags: [
        config.themeConfig?.darkMode !== false && {
          tag: 'script',
          children: inlineThemeScript,
          append: false,
        },
      ].filter(Boolean),
    },
    output: {
      targets: isSSR ? ['node'] : ['web'],
      distPath: {
        // `root` must be a relative path in Rsbuild
        root: path.isAbsolute(outDir) ? path.relative(cwd, outDir) : outDir,
      },
      overrideBrowserslist: browserslist,
      assetPrefix,
    },
    source: {
      entry: {
        index: isSSR ? SSR_ENTRY : CLIENT_ENTRY,
      },
      alias: {
        '@mdx-js/react': require.resolve('@mdx-js/react'),
        '@theme': [CUSTOM_THEME_DIR, DEFAULT_THEME],
        '@/theme-default': DEFAULT_THEME,
        '@rspress/core': PACKAGE_ROOT,
        'react-lazy-with-preload': require.resolve('react-lazy-with-preload'),
        'react-syntax-highlighter': path.dirname(
          require.resolve('react-syntax-highlighter/package.json'),
        ),
        ...(await resolveReactAlias(reactVersion, isSSR)),
        ...(await detectCustomIcon(CUSTOM_THEME_DIR)),
        '@theme-assets': path.join(DEFAULT_THEME, '../assets'),
      },
      include: [PACKAGE_ROOT, path.join(cwd, 'node_modules', RSPRESS_TEMP_DIR)],
      define: {
        'process.env.__ASSET_PREFIX__': JSON.stringify(assetPrefix),
        'process.env.__SSR__': JSON.stringify(isSSR),
        'process.env.__IS_REACT_18__': JSON.stringify(reactVersion === 18),
        'process.env.TEST': JSON.stringify(process.env.TEST),
      },
    },
    performance: {
      // No need to print the server bundles size
      printFileSize: !isSSR,
      chunkSplit: {
        override: {
          cacheGroups: {
            // extract all CSS into a single file
            // ensure CSS in async chunks can be loaded for SSG
            styles: {
              name: 'styles',
              minSize: 0,
              chunks: 'all',
              test: /\.(?:css|less|sass|scss)$/,
              priority: 99,
            },
          },
        },
      },
    },
    tools: {
      bundlerChain(chain, { CHAIN_ID }) {
        const jsModuleRule = chain.module.rule(CHAIN_ID.RULE.JS);

        const swcLoaderOptions = jsModuleRule
          .use(CHAIN_ID.USE.SWC)
          .get('options');

        chain.module
          .rule('MDX')
          .type('javascript/auto')
          .test(MDX_REGEXP)
          .resolve.merge({
            conditionNames: jsModuleRule.resolve.conditionNames.values(),
            mainFields: jsModuleRule.resolve.mainFields.values(),
          })
          .end()
          .oneOf('MDXCompile')
          .use('builtin:swc-loader')
          .loader('builtin:swc-loader')
          .options(swcLoaderOptions)
          .end()
          .use('mdx-loader')
          .loader(require.resolve('../loader.cjs'))
          .options({
            config,
            docDirectory: userDocRoot,
            checkDeadLinks,
            routeService,
            pluginDriver,
          })
          .end();

        if (chain.plugins.has(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)) {
          chain.plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH).tap(options => {
            options[0] ??= {};
            options[0].include = [/\.([cm]js|[jt]sx?|flow)$/i, MDX_REGEXP];
            return options;
          });
        }

        chain.resolve.extensions.prepend('.md').prepend('.mdx').prepend('.mjs');

        chain.module
          .rule('css-virtual-module')
          .test(/\.rspress[\\/]runtime[\\/]virtual-global-styles/)
          .merge({ sideEffects: true });
      },
    },
  };
}

export async function initRsbuild(
  rootDir: string,
  config: UserConfig,
  pluginDriver: PluginDriver,
  isSSR = false,
  extraRsbuildConfig?: RsbuildConfig,
): Promise<RsbuildInstance> {
  const cwd = process.cwd();
  const userDocRoot = path.resolve(rootDir || config?.root || cwd);
  const builderPlugins = config?.builderPlugins ?? [];
  // We use a temp dir to store runtime files, so we can separate client and server build
  // and we should empty temp dir before build
  const runtimeTempDir = path.join(RSPRESS_TEMP_DIR, 'runtime');
  const runtimeAbsTempDir = path.join(cwd, 'node_modules', runtimeTempDir);
  await fs.ensureDir(runtimeAbsTempDir);

  const routeService = await initRouteService({
    config,
    runtimeTempDir: runtimeAbsTempDir,
    scanDir: userDocRoot,
    pluginDriver,
  });
  const { createRsbuild, mergeRsbuildConfig } = await import('@rsbuild/core');

  const internalRsbuildConfig = await createInternalBuildConfig(
    userDocRoot,
    config,
    isSSR,
    routeService,
    pluginDriver,
    runtimeTempDir,
  );

  const rsbuild = await createRsbuild({
    rsbuildConfig: mergeRsbuildConfig(
      internalRsbuildConfig,
      ...(pluginDriver
        .getPlugins()
        ?.map(plugin => plugin.builderConfig ?? {}) || []),
      config?.builderConfig || {},
      extraRsbuildConfig || {},
    ),
  });

  rsbuild.addPlugins(builderPlugins);

  return rsbuild;
}
