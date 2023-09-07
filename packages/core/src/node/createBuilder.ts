import path from 'path';
import { createRequire } from 'module';
import type { UserConfig } from '@rspress/shared';
import { isDebugMode, removeTrailingSlash } from '@rspress/shared';
import type { BuilderInstance } from '@modern-js/builder';
import type {
  BuilderConfig,
  BuilderRspackProvider,
} from '@modern-js/builder-rspack-provider';
import sirv from 'sirv';
import fs from '@modern-js/utils/fs-extra';
import { tailwindConfig } from '../../tailwind.config';
import {
  CLIENT_ENTRY,
  SSR_ENTRY,
  PACKAGE_ROOT,
  OUTPUT_DIR,
  isProduction,
  TEMP_DIR,
} from './constants';
import { builderDocVMPlugin } from './runtimeModule';
import { serveSearchIndexMiddleware } from './searchIndex';
import { detectReactVersion, resolveReactAlias } from './utils';
import { initRouteService } from './route/init';
import { PluginDriver } from './PluginDriver';
import { RouteService } from './route/RouteService';

const require = createRequire(import.meta.url);

export interface MdxRsLoaderCallbackContext {
  resourcePath: string;
  links: string[];
  root: string;
  base: string;
}

async function createInternalBuildConfig(
  userRoot: string,
  config: UserConfig,
  isSSR: boolean,
  runtimeTempDir: string,
  routeService: RouteService,
): Promise<BuilderConfig> {
  const cwd = process.cwd();
  const { default: fs } = await import('@modern-js/utils/fs-extra');
  const CUSTOM_THEME_DIR =
    config?.themeDir ?? path.join(process.cwd(), 'theme');
  const outDir = config?.outDir ?? OUTPUT_DIR;
  // In debug mode, we will not use the bundled theme chunk and skip the build process of module tools, which make the debug process faster
  const DEFAULT_THEME_DIR = isDebugMode()
    ? path.join(PACKAGE_ROOT, 'src', 'theme-default')
    : path.join(PACKAGE_ROOT, 'dist', 'theme');
  const themeDir = (await fs.pathExists(CUSTOM_THEME_DIR))
    ? CUSTOM_THEME_DIR
    : DEFAULT_THEME_DIR;
  const checkDeadLinks = (config?.markdown?.checkDeadLinks && !isSSR) ?? false;
  const base = config?.base ?? '';

  const publicDir = path.join(userRoot, 'public');
  const isPublicDirExist = await fs.pathExists(publicDir);
  // In production, we need to add assetPrefix in asset path
  const assetPrefix = isProduction()
    ? removeTrailingSlash(config?.builderConfig?.output?.assetPrefix ?? base)
    : '';
  const enableMdxRs = config?.markdown?.experimentalMdxRs ?? false;
  const reactVersion = await detectReactVersion();

  // Using latest browserslist in development to improve build performance
  const browserslist = {
    web: isProduction()
      ? [
          'chrome >= 61',
          'edge >= 16',
          'firefox >= 60',
          'safari >= 11',
          'ios_saf >= 11',
        ]
      : [
          'last 1 chrome version',
          'last 1 firefox version',
          'last 1 safari version',
        ],
    node: ['node >= 14'],
  };

  return {
    dev: {
      port: process.env.PORT ? Number(process.env.PORT) : undefined,
      progressBar: false,
    },
    html: {
      favicon: config?.icon,
      template: path.join(PACKAGE_ROOT, 'index.html'),
    },
    output: {
      distPath: {
        // `root` must be a relative path in Builder
        root: path.isAbsolute(outDir) ? path.relative(cwd, outDir) : outDir,
      },
      // TODO: switch to 'usage' if Rspack supports it
      polyfill: 'entry',
      svgDefaultExport: 'component',
      disableTsChecker: true,
      // Disable production source map, it is useless for doc site
      disableSourceMap: isProduction(),
      overrideBrowserslist: browserslist,
      assetPrefix,
    },
    source: {
      alias: {
        '@mdx-js/react': require.resolve('@mdx-js/react'),
        '@/runtime': path.join(PACKAGE_ROOT, 'dist', 'runtime'),
        '@theme': themeDir,
        '@/theme-default': DEFAULT_THEME_DIR,
        '@rspress/core': PACKAGE_ROOT,
        'react-lazy-with-preload': require.resolve('react-lazy-with-preload'),
        ...(await resolveReactAlias(reactVersion)),
      },
      include: [PACKAGE_ROOT],
      define: {
        'process.env.__ASSET_PREFIX__': JSON.stringify(assetPrefix),
        'process.env.__SSR__': JSON.stringify(isSSR),
        'process.env.__IS_REACT_18__': JSON.stringify(reactVersion === 18),
        'process.env.TEST': JSON.stringify(process.env.TEST),
      },
    },
    tools: {
      devServer: {
        // Serve static files
        after: [
          ...(isPublicDirExist ? [sirv(publicDir)] : []),
          serveSearchIndexMiddleware(config),
        ],
        historyApiFallback: true,
      },
      postcss(config) {
        // In debug mode, we should use tailwindcss to build the theme source code
        if (isDebugMode()) {
          config.postcssOptions.plugins.push(
            require('tailwindcss')({
              config: {
                ...tailwindConfig,
                content: [
                  path.join(PACKAGE_ROOT, 'src', 'theme-default', '**/*'),
                ],
              },
            }),
          );
        }
      },
      bundlerChain(chain) {
        chain.module
          .rule('MDX')
          .type('jsx')
          .test(/\.mdx?$/)
          .oneOf('MDXCompile')
          .use('mdx-loader')
          .loader(require.resolve('../loader.cjs'))
          .options({
            config,
            docDirectory: userRoot,
            checkDeadLinks,
            enableMdxRs,
            routeService,
          })
          .end()
          .use('string-replace-loader')
          .loader(require.resolve('string-replace-loader'))
          .options({
            multiple: config?.replaceRules || [],
          });

        chain.resolve.extensions.prepend('.md').prepend('.mdx').prepend('.mjs');
      },
    },
  };
}

export async function createModernBuilder(
  rootDir: string,
  config: UserConfig,
  pluginDriver: PluginDriver,
  isSSR = false,
  extraBuilderConfig?: BuilderConfig,
): Promise<BuilderInstance<BuilderRspackProvider>> {
  const cwd = process.cwd();
  const userRoot = path.resolve(rootDir || config?.root || cwd);
  const builderPlugins = config?.builderPlugins ?? [];
  // We use a temp dir to store runtime files, so we can separate client and server build
  // and we should empty temp dir before build
  // await fs.emptyDir(TEMP_DIR);
  const runtimeTempDir = path.join(TEMP_DIR, 'runtime');
  await fs.ensureDir(runtimeTempDir);
  const routeService = await initRouteService({
    config,
    runtimeTempDir,
    scanDir: userRoot,
    pluginDriver,
  });
  const {
    default: { createBuilder, mergeBuilderConfig },
  } = await import('@modern-js/builder');
  const {
    default: { builderRspackProvider },
  } = await import('@modern-js/builder-rspack-provider');

  const internalBuilderConfig = await createInternalBuildConfig(
    userRoot,
    config,
    isSSR,
    runtimeTempDir,
    routeService,
  );

  const builderProvider = builderRspackProvider({
    builderConfig: mergeBuilderConfig(
      internalBuilderConfig,
      ...(config?.plugins?.map(plugin => plugin.builderConfig ?? {}) || []),
      config?.builderConfig || {},
      extraBuilderConfig || {},
    ),
  });

  const builder = await createBuilder(builderProvider, {
    target: isSSR ? 'node' : 'web',
    entry: {
      main: isSSR ? SSR_ENTRY : CLIENT_ENTRY,
    },
    framework: 'Rspress',
  });

  builder.addPlugins([
    builderDocVMPlugin({
      userRoot,
      config,
      isSSR,
      runtimeTempDir,
      routeService,
      pluginDriver,
    }),
    ...builderPlugins,
  ]);

  return builder;
}
