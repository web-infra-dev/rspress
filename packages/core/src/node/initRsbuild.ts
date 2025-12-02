import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  RsbuildConfig,
  RsbuildInstance,
  RsbuildPlugin,
} from '@rsbuild/core';
import { PLUGIN_REACT_NAME, pluginReact } from '@rsbuild/plugin-react';
import { version as rspressVersion } from '@rspress/core/package.json';
import {
  MDX_OR_MD_REGEXP,
  removeTrailingSlash,
  type UserConfig,
} from '@rspress/shared';
import { pluginVirtualModule } from 'rsbuild-plugin-virtual-module';
import {
  CSR_CLIENT_ENTRY,
  DEFAULT_THEME,
  DEFAULT_TITLE,
  inlineThemeScript,
  isProduction,
  NODE_SSG_BUNDLE_FOLDER,
  NODE_SSG_BUNDLE_NAME,
  NODE_SSG_MD_BUNDLE_FOLDER,
  NODE_SSG_MD_BUNDLE_NAME,
  OUTPUT_DIR,
  PACKAGE_ROOT,
  PUBLIC_DIR,
  SSG_MD_SERVER_ENTRY,
  SSR_CLIENT_ENTRY,
  SSR_SERVER_ENTRY,
  TEMPLATE_PATH,
} from './constants';
import {
  hintBuilderPluginsBreakingChange,
  hintThemeBreakingChange,
} from './logger/hint';
import type { PluginDriver } from './PluginDriver';
import type { RouteService } from './route/RouteService';
import { globalStylesVMPlugin } from './runtimeModule/globalStyles';
import { globalUIComponentsVMPlugin } from './runtimeModule/globalUIComponents';
import { i18nVMPlugin } from './runtimeModule/i18n';
import { rsbuildPluginDocVM } from './runtimeModule/pageData/rsbuildPlugin';
import { routeListVMPlugin } from './runtimeModule/routeList';
import { searchHookVMPlugin } from './runtimeModule/searchHooks';
import { siteDataVMPlugin } from './runtimeModule/siteData/rsbuildPlugin';
import { socialLinksVMPlugin } from './runtimeModule/socialLinks';
import type { FactoryContext } from './runtimeModule/types';
import { rsbuildPluginCSR } from './ssg/rsbuildPluginCSR';
import { rsbuildPluginSSG } from './ssg/rsbuildPluginSSG';
import { rsbuildPluginSSGMD } from './ssg-md/rsbuildPluginSSGMD';
import { resolveReactAlias, resolveReactRouterDomAlias } from './utils';
import { detectCustomIcon } from './utils/detectCustomIcon';

function isPluginIncluded(config: UserConfig, pluginName: string): boolean {
  return Boolean(
    config.builderConfig?.plugins?.some(
      plugin => plugin && (plugin as RsbuildPlugin).name === pluginName,
    ),
  );
}

const require = createRequire(import.meta.url);

async function getVirtualModulesFromPlugins(
  pluginDriver: PluginDriver,
): Promise<Record<string, () => string>> {
  const runtimeModule: Record<string, () => string> = {};
  const modulesByPlugin = await pluginDriver.addRuntimeModules();
  Object.keys(modulesByPlugin).forEach(key => {
    if (runtimeModule[key]) {
      throw new Error(
        `The runtime module ${key} is duplicated, please check your plugin`,
      );
    }
    runtimeModule[key] = () => modulesByPlugin[key];
  });
  return runtimeModule;
}

async function createInternalBuildConfig(
  userDocRoot: string,
  config: UserConfig,
  enableSSG: boolean,
  routeService: RouteService,
  pluginDriver: PluginDriver,
): Promise<RsbuildConfig> {
  const CUSTOM_THEME_DIR =
    config?.themeDir ?? path.join(process.cwd(), 'theme');
  const outDir = config?.outDir ?? OUTPUT_DIR;

  const base = config?.base ?? '';

  // In production, we need to add assetPrefix in asset path
  const assetPrefix = isProduction()
    ? removeTrailingSlash(config?.builderConfig?.output?.assetPrefix ?? base)
    : '';

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
    resolveReactAlias(false),
    enableSSG ? resolveReactAlias(true) : Promise.resolve({}),
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
      rsbuildPluginDocVM({
        config,
        pluginDriver,
        routeService,
        userDocRoot,
      }),
      pluginVirtualModule({
        tempDir: '.rspress/runtime',
        virtualModules: {
          /**
           * Load social links in compile time for treeshaking
           */
          ...socialLinksVMPlugin(context),
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
           * Serialize site data (rspress.config.ts) to runtime
           */
          ...siteDataVMPlugin(context),
        },
      }),
      enableSSG && config.ssg
        ? rsbuildPluginSSG({
            routeService,
            config,
          })
        : rsbuildPluginCSR({
            routeService,
            config,
          }),
      enableSSG && config.llms
        ? rsbuildPluginSSGMD({
            routeService,
            config,
          })
        : null,
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
        '@theme-assets': path.join(DEFAULT_THEME, './assets'),
        'react-lazy-with-preload': require.resolve('react-lazy-with-preload'),
        // single runtime
        '@rspress/core/theme': DEFAULT_THEME,
        '@rspress/core/runtime': path.join(PACKAGE_ROOT, 'dist/runtime.js'),
        '@rspress/core/shiki-transformers': path.join(
          PACKAGE_ROOT,
          'dist/shiki-transformers.js',
        ),
      },
    },
    source: {
      preEntry: [
        // ensure CSS orders and access @theme before @rspress/theme-default to avoid circular dependency
        path.join(DEFAULT_THEME, './styles/index.js'), // 1. @rspress/theme-default global styles
        'virtual-global-styles', // 2. virtual-global-styles
        '@theme', // 3. import './index.css'; from 'theme/index.tsx'
      ],
      include: [PACKAGE_ROOT],
      define: {
        'process.env.TEST': JSON.stringify(process.env.TEST),
      },
    },
    performance: {
      ...(process.env.RSPRESS_PERSISTENT_CACHE !== 'false'
        ? {
            buildCache: {
              // 1. config file: rspress.config.ts
              buildDependencies: [
                new URL(import.meta.url).href, // this file,  __filename
                pluginDriver.getConfigFilePath(), // rspress.config.ts
              ],
              cacheDigest: [
                // 2.other configuration files which are not included in rspress.config.ts should be added to cacheDigest
                // 2.1 routeService glob
                routeService.generateRoutesCode(),
                // 2.2. auto-nav-sidebar _nav.json or _meta.json
                JSON.stringify(
                  config.themeConfig?.locales?.map(i => ({
                    nav: i.nav,
                    sidebar: i.sidebar,
                  })) ?? {
                    nav: config.themeConfig?.nav,
                    sidebar: config.themeConfig?.sidebar,
                  },
                ),

                // add rspress version to persistent cache digest to make it more safe
                rspressVersion,
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
      bundlerChain(chain, { CHAIN_ID, environment }) {
        const isSsg = environment.name === 'node';
        const isSsgMd = environment.name === 'node_md';
        const jsModuleRule = chain.module.rule(CHAIN_ID.RULE.JS);

        const swcLoaderOptions = jsModuleRule
          .use(CHAIN_ID.USE.SWC)
          .get('options');

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
          .loader(fileURLToPath(new URL('./mdx/loader.js', import.meta.url)))
          .options({
            config,
            docDirectory: userDocRoot,
            routeService,
            pluginDriver,
            isSsgMd,
          })
          .end();

        // chain.experiments({
        //   // Enable native watcher by default unless RSPRESS_NATIVE_WATCHER is set to 'false'
        //   ...chain.get('experiments'),
        //   nativeWatcher: process.env.RSPRESS_NATIVE_WATCHER !== 'false',
        // });

        if (chain.plugins.has(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)) {
          chain.plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH).tap(options => {
            options[0] ??= {};
            options[0].test = [/\.([cm]js|[jt]sx?|flow)$/i, MDX_OR_MD_REGEXP];
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

        if (isSsg || isSsgMd) {
          chain.optimization.splitChunks({});
        }

        if (isSsg) {
          chain.output.filename(
            `${NODE_SSG_BUNDLE_FOLDER}/${NODE_SSG_BUNDLE_NAME}`,
          );
          chain.output.chunkFilename(`${NODE_SSG_BUNDLE_FOLDER}/[name].cjs`);
        } else if (isSsgMd) {
          chain.output.filename(
            `${NODE_SSG_MD_BUNDLE_FOLDER}/${NODE_SSG_MD_BUNDLE_NAME}`,
          );
          chain.output.chunkFilename(`${NODE_SSG_MD_BUNDLE_FOLDER}/[name].cjs`);
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
          define: {
            'process.env.__SSR__': JSON.stringify(false),
            'process.env.__SSR_MD__': JSON.stringify(false),
          },
        },
        output: {
          target: 'web',
          distPath: {
            root: outDir,
          },
        },
      },
      ...(enableSSG && config.ssg
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
                  'process.env.__SSR_MD__': JSON.stringify(false),
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
      ...(enableSSG && config.llms
        ? {
            node_md: {
              resolve: {
                alias: {
                  ...reactSSRAlias,
                  ...reactRouterDomAlias,
                },
              },
              tools: {
                rspack: {
                  optimization: {
                    moduleIds: 'named',
                    chunkIds: 'named',
                  },
                },
              },
              source: {
                entry: {
                  index: SSG_MD_SERVER_ENTRY,
                },
                define: {
                  'process.env.__SSR__': JSON.stringify(true),
                  'process.env.__SSR_MD__': JSON.stringify(true),
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
  routeService: RouteService,
  enableSSG: boolean,
  extraRsbuildConfig?: RsbuildConfig,
): Promise<RsbuildInstance> {
  const cwd = process.cwd();
  const userDocRoot = path.resolve(rootDir || config?.root || cwd);

  hintBuilderPluginsBreakingChange(config);

  const { createRsbuild, mergeRsbuildConfig } = await import('@rsbuild/core');

  const internalRsbuildConfig = await createInternalBuildConfig(
    userDocRoot,
    config,
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
      config.builderConfig || {},
      extraRsbuildConfig || {},
    ),
  });

  return rsbuild;
}
