import path from 'path';
import {
  type UserConfig,
  removeLeadingSlash,
  MDX_REGEXP,
  RSPRESS_TEMP_DIR,
  removeTrailingSlash,
} from '@rspress/shared';
import fs from '@rspress/shared/fs-extra';
import type { RsbuildInstance, RsbuildConfig } from '@rsbuild/core';
import {
  CLIENT_ENTRY,
  SSR_ENTRY,
  PACKAGE_ROOT,
  OUTPUT_DIR,
  isProduction,
  PUBLIC_DIR,
} from './constants';
import { rsbuildPluginDocVM } from './runtimeModule';
import { serveSearchIndexMiddleware } from './searchIndex';
import { detectReactVersion, resolveReactAlias } from './utils';
import { initRouteService } from './route/init';
import { PluginDriver } from './PluginDriver';
import { RouteService } from './route/RouteService';

export interface MdxRsLoaderCallbackContext {
  resourcePath: string;
  links: string[];
  root: string;
  base: string;
}

async function createInternalBuildConfig(
  userDocRoot: string,
  config: UserConfig,
  isSSR: boolean,
  routeService: RouteService,
  pluginDriver: PluginDriver,
): Promise<RsbuildConfig> {
  const cwd = process.cwd();
  const { default: fs } = await import('@rspress/shared/fs-extra');
  const CUSTOM_THEME_DIR =
    config?.themeDir ?? path.join(process.cwd(), 'theme');
  const outDir = config?.outDir ?? OUTPUT_DIR;
  const DEFAULT_THEME = require.resolve('@rspress/theme-default');
  const themeDir = (await fs.pathExists(CUSTOM_THEME_DIR))
    ? CUSTOM_THEME_DIR
    : DEFAULT_THEME;
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
      title: config?.title,
      favicon: normalizeIcon(config?.icon),
      template: path.join(PACKAGE_ROOT, 'index.html'),
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
        '@theme': themeDir,
        '@/theme-default': DEFAULT_THEME,
        '@rspress/core': PACKAGE_ROOT,
        'react-lazy-with-preload': require.resolve('react-lazy-with-preload'),
        'react-syntax-highlighter': path.dirname(
          require.resolve('react-syntax-highlighter/package.json'),
        ),
        ...(await resolveReactAlias(reactVersion)),
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
    },
    tools: {
      bundlerChain(chain, { CHAIN_ID }) {
        const swcLoaderOptions = chain.module
          .rule(CHAIN_ID.RULE.JS)
          .use(CHAIN_ID.USE.SWC)
          .get('options');

        chain.module
          .rule('MDX')
          .type('javascript/auto')
          .test(MDX_REGEXP)
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
          .end()
          .use('string-replace-loader')
          .loader(require.resolve('string-replace-loader'))
          .options({
            multiple: config?.replaceRules || [],
          });

        if (chain.plugins.has(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)) {
          chain.plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH).tap(options => {
            options[0] ??= {};
            options[0].include = [/\.([cm]js|[jt]sx?|flow)$/i, MDX_REGEXP];
            return options;
          });
        }

        chain.resolve.extensions.prepend('.md').prepend('.mdx').prepend('.mjs');
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
  const {
    default: { createRsbuild, mergeRsbuildConfig },
  } = await import('@rsbuild/core');
  const { pluginReact } = await import('@rsbuild/plugin-react');
  const { pluginSvgr } = await import('@rsbuild/plugin-svgr');

  const internalRsbuildConfig = await createInternalBuildConfig(
    userDocRoot,
    config,
    isSSR,
    routeService,
    pluginDriver,
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

  rsbuild.addPlugins([
    rsbuildPluginDocVM({
      userDocRoot,
      config,
      isSSR,
      runtimeTempDir,
      routeService,
      pluginDriver,
    }),
    pluginReact(),
    pluginSvgr({
      svgDefaultExport: 'component',
    }),
    ...builderPlugins,
  ]);

  return rsbuild;
}
