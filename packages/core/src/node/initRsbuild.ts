import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  RsbuildConfig,
  RsbuildInstance,
  RsbuildPlugin,
} from '@rsbuild/core';
import { PLUGIN_REACT_NAME, pluginReact } from '@rsbuild/plugin-react';
import {
  MDX_OR_MD_REGEXP,
  RSPRESS_TEMP_DIR,
  type UserConfig,
  removeTrailingSlash,
} from '@rspress/shared';
import { pluginVirtualModule } from 'rsbuild-plugin-virtual-module';
import type { PluginDriver } from './PluginDriver';
import { modifyConfigWithAutoNavSide } from './auto-nav-sidebar';
import {
  CSR_CLIENT_ENTRY,
  DEFAULT_TITLE,
  NODE_SSG_BUNDLE_FOLDER,
  NODE_SSG_BUNDLE_NAME,
  OUTPUT_DIR,
  PACKAGE_ROOT,
  PUBLIC_DIR,
  SSR_CLIENT_ENTRY,
  SSR_SERVER_ENTRY,
  TEMPLATE_PATH,
  inlineThemeScript,
  isProduction,
} from './constants';
import {
  hintBuilderPluginsBreakingChange,
  hintThemeBreakingChange,
} from './logger/hint';
import { RouteService } from './route/RouteService';
import {
  getVirtualModulesFromPlugins,
  rsbuildPluginDocVM,
} from './runtimeModule';
import { globalStylesVMPlugin } from './runtimeModule/globalStyles';
import { globalUIComponentsVMPlugin } from './runtimeModule/globalUIComponents';
import { i18nVMPlugin } from './runtimeModule/i18n';
import { routeListVMPlugin } from './runtimeModule/routeList';
import { runtimeConfigVMPlugin } from './runtimeModule/runtimeConfig';
import { searchHookVMPlugin } from './runtimeModule/searchHooks';
import type { FactoryContext } from './runtimeModule/types';
import { serveSearchIndexMiddleware } from './searchIndex';
import { rsbuildPluginSSG } from './ssg/rsbuildPluginSSG';
import {
  detectReactVersion,
  resolveReactAlias,
  resolveReactRouterDomAlias,
} from './utils';
import { detectCustomIcon } from './utils/detectCustomIcon';
import { getSocialIcons } from './utils/getSocialIcons';

function isPluginIncluded(config: UserConfig, pluginName: string): boolean {
  return Boolean(
    config.builderConfig?.plugins?.some(
      plugin => plugin && (plugin as RsbuildPlugin).name === pluginName,
    ),
  );
}

async function createInternalBuildConfig(
  userDocRoot: string,
  config: UserConfig,
  enableSSG: boolean,
  routeService: RouteService,
  pluginDriver: PluginDriver,
): Promise<RsbuildConfig> {
  const cwd = process.cwd();
  const CUSTOM_THEME_DIR =
    config?.themeDir ?? path.join(process.cwd(), 'theme');
  const outDir = config?.outDir ?? OUTPUT_DIR;

  const DEFAULT_THEME = require.resolve('@rspress/theme-default');
  const base = config?.base ?? '';

  // In production, we need to add assetPrefix in asset path
  const assetPrefix = isProduction()
    ? removeTrailingSlash(config?.builderConfig?.output?.assetPrefix ?? base)
    : '';
  const reactVersion = await detectReactVersion();

  const normalizeIcon = (icon: string | URL | undefined) => {
    if (!icon) {
      return undefined;
    }

    icon = icon.toString();

    if (icon.startsWith('file://')) {
      icon = fileURLToPath(icon);
    } else if (path.isAbsolute(icon)) {
      return path.join(userDocRoot, PUBLIC_DIR, icon);
    }

    return icon;
  };

  await hintThemeBreakingChange(CUSTOM_THEME_DIR);

  const [
    detectCustomIconAlias,
    reactCSRAlias,
    reactSSRAlias,
    reactRouterDomAlias,
  ] = await Promise.all([
    detectCustomIcon(CUSTOM_THEME_DIR),
    resolveReactAlias(reactVersion, false),
    enableSSG ? resolveReactAlias(reactVersion, true) : Promise.resolve({}),
    resolveReactRouterDomAlias(),
  ]);

  const context: Omit<FactoryContext, 'alias'> = {
    userDocRoot,
    config,
    routeService,
    pluginDriver,
  };
  return {
    plugins: [
      ...(isPluginIncluded(config, PLUGIN_REACT_NAME) ? [] : [pluginReact()]),
      rsbuildPluginDocVM(context),
      pluginVirtualModule({
        tempDir: '.rspress/runtime',
        virtualModules: {
          /**
           * Load i18n.json to runtime
           */
          ...i18nVMPlugin(context),
          /**
           * Generate global components from config and plugins
           */
          ...globalUIComponentsVMPlugin(context),
          /**
           * Generate global styles from config and plugins
           */
          ...globalStylesVMPlugin(context),
          /**
           * Generate search hook module
           */
          ...searchHookVMPlugin(context),
          /**
           * Generate route list for client and server runtime
           */
          ...routeListVMPlugin(context),
          /**
           *  Get virtual modules from plugins
           */
          ...(await getVirtualModulesFromPlugins(pluginDriver)),

          /**
           * Serialize rspress.config.ts to runtime
           */
          ...runtimeConfigVMPlugin(context),
        },
      }),
      ...(enableSSG
        ? [
            rsbuildPluginSSG({
              routeService,
              config,
              pluginDriver,
            }),
          ]
        : []),
    ],
    server: {
      port:
        !isProduction() && process.env.PORT
          ? Number(process.env.PORT)
          : undefined,
      publicDir: {
        name: path.join(userDocRoot, PUBLIC_DIR),
      },
      ...(base.length > 0 ? { base: removeTrailingSlash(base) } : {}),
    },
    dev: {
      lazyCompilation: process.env.RSPRESS_LAZY_COMPILATION !== 'false', // This is an escape hatch for playwright test, playwright does not support lazyCompilation
      // Serve static files
      setupMiddlewares: middlewares => {
        middlewares.unshift(serveSearchIndexMiddleware(config));
      },
      cliShortcuts: {
        // does not support restart server yet
        custom: shortcuts => shortcuts.filter(({ key }) => key !== 'r'),
      },
    },
    html: {
      title: config?.title ?? DEFAULT_TITLE,
      favicon: normalizeIcon(config?.icon),
      template: TEMPLATE_PATH,
      tags: [
        config.themeConfig?.darkMode !== false
          ? {
              tag: 'script',
              children: inlineThemeScript,
              append: false,
            }
          : null!,
      ].filter(Boolean),
    },
    output: {
      assetPrefix,
      distPath: {
        // just for rsbuild preview
        root: outDir,
      },
    },
    resolve: {
      alias: {
        ...detectCustomIconAlias,
        '@mdx-js/react': require.resolve('@mdx-js/react'),
        '@theme': [CUSTOM_THEME_DIR, DEFAULT_THEME],
        '@theme-assets': path.join(DEFAULT_THEME, '../assets'),
        '@rspress/core': PACKAGE_ROOT,
        'react-lazy-with-preload': require.resolve('react-lazy-with-preload'),
      },
    },
    source: {
      include: [PACKAGE_ROOT, path.join(cwd, 'node_modules', RSPRESS_TEMP_DIR)],
      define: {
        'process.env.TEST': JSON.stringify(process.env.TEST),
        'process.env.RSPRESS_SOCIAL_ICONS': JSON.stringify(
          getSocialIcons(config.themeConfig?.socialLinks),
        ),
      },
    },
    performance: {
      ...(process.env.RSPRESS_PERSISTENT_CACHE !== 'false'
        ? {
            buildCache: {
              buildDependencies: [pluginDriver.getConfigFilePath()],
              cacheDigest: [
                // other configuration files which are not included in rspress.config.ts should be added to cacheDigest
                // 1. routeService glob
                routeService
                  .getRoutes()
                  .map(i => i.absolutePath + i.routePath)
                  .join('\n'),
                // 2. auto-nav-sidebar _nav.json or _meta.json
                JSON.stringify(
                  config.themeConfig?.locales ?? {
                    nav: config.themeConfig?.nav,
                    sidebar: config.themeConfig?.sidebar,
                  },
                ),
              ],
            },
          }
        : {}),
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
      bundlerChain(chain, { CHAIN_ID, target }) {
        const isServer = target === 'node';
        const jsModuleRule = chain.module.rule(CHAIN_ID.RULE.JS);

        const swcLoaderOptions = jsModuleRule
          .use(CHAIN_ID.USE.SWC)
          .get('options');

        const checkDeadLinks =
          (config?.markdown?.checkDeadLinks && !isServer) ?? false;

        chain.module
          .rule('MDX')
          .type('javascript/auto')
          .test(MDX_OR_MD_REGEXP)
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
          .loader(require.resolve('./loader.js'))
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
            options[0].include = [
              /\.([cm]js|[jt]sx?|flow)$/i,
              MDX_OR_MD_REGEXP,
            ];
            return options;
          });
        }

        chain.resolve.extensions.prepend('.md').prepend('.mdx').prepend('.mjs');

        chain.module
          .rule('css-virtual-module')
          .test(/\.rspress[\\/]runtime[\\/]virtual-global-styles/)
          .merge({ sideEffects: true });

        if (isServer) {
          chain.output.filename(
            `${NODE_SSG_BUNDLE_FOLDER}/${NODE_SSG_BUNDLE_NAME}`,
          );
          chain.output.chunkFilename(`${NODE_SSG_BUNDLE_FOLDER}/[name].cjs`);
          chain.target('async-node'); // For MF support
        }
      },
    },
    environments: {
      web: {
        resolve: {
          alias: {
            ...reactCSRAlias,
            ...reactRouterDomAlias,
          },
        },
        source: {
          entry: {
            index:
              enableSSG && isProduction() ? SSR_CLIENT_ENTRY : CSR_CLIENT_ENTRY,
          },
          preEntry: [
            path.join(DEFAULT_THEME, '../styles/index.js'),
            'virtual-global-styles',
          ],
          define: {
            'process.env.__SSR__': JSON.stringify(false),
          },
        },
        output: {
          target: 'web',
          distPath: {
            root: outDir,
          },
        },
      },
      ...(enableSSG
        ? {
            node: {
              resolve: {
                alias: {
                  ...reactSSRAlias,
                  ...reactRouterDomAlias,
                },
              },
              source: {
                entry: {
                  index: SSR_SERVER_ENTRY,
                },
                define: {
                  'process.env.__SSR__': JSON.stringify(true),
                },
              },
              performance: {
                printFileSize: {
                  compressed: true,
                },
              },
              output: {
                emitAssets: false,
                target: 'node',
                minify: false,
              },
            },
          }
        : {}),
    },
  };
}

export async function initRsbuild(
  rootDir: string,
  config: UserConfig,
  pluginDriver: PluginDriver,
  enableSSG: boolean,
  extraRsbuildConfig?: RsbuildConfig,
): Promise<RsbuildInstance> {
  const cwd = process.cwd();
  const userDocRoot = path.resolve(rootDir || config?.root || cwd);
  // We use a temp dir to store runtime files, so we can separate client and server build
  // and we should empty temp dir before build
  // TODO: remove all the temp dir
  const runtimeTempDir = path.join(RSPRESS_TEMP_DIR, 'runtime');
  const runtimeAbsTempDir = path.join(cwd, 'node_modules', runtimeTempDir);
  await fs.mkdir(runtimeAbsTempDir, { recursive: true });

  const routeService = await RouteService.create({
    config: config,
    runtimeTempDir: runtimeAbsTempDir,
    scanDir: userDocRoot,
    pluginDriver,
  });

  const mergedConfig = await modifyConfigWithAutoNavSide(config);
  hintBuilderPluginsBreakingChange(mergedConfig);

  const { createRsbuild, mergeRsbuildConfig } = await import('@rsbuild/core');

  const internalRsbuildConfig = await createInternalBuildConfig(
    userDocRoot,
    mergedConfig,
    enableSSG,
    routeService,
    pluginDriver,
  );

  const rsbuild = await createRsbuild({
    callerName: 'rspress',
    rsbuildConfig: mergeRsbuildConfig(
      internalRsbuildConfig,
      ...(pluginDriver
        .getPlugins()
        ?.map(plugin => plugin.builderConfig ?? {}) || []),
      mergedConfig.builderConfig || {},
      extraRsbuildConfig || {},
    ),
  });

  return rsbuild;
}
