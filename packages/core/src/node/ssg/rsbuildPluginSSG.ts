import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RsbuildPlugin } from '@rsbuild/core';
import { addTrailingSlash, isDebugMode, type UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import {
  NODE_RSC_SSG_SERVER_ENTRY_NAME,
  NODE_RSC_SSG_SSR_ENTRY_NAME,
  NODE_SSG_BUNDLE_FOLDER,
  NODE_SSG_BUNDLE_NAME,
  PACKAGE_ROOT,
} from '../constants';
import type { RouteService } from '../route/RouteService';
import { isRscRenderMode } from './renderMode';
import { renderPages } from './renderPages';

export const rsbuildPluginSSG = ({
  routeService,
  config,
}: {
  routeService: RouteService;
  config: UserConfig;
}): RsbuildPlugin => ({
  name: 'rspress-inner-rsbuild-plugin-ssg',
  async setup(api) {
    api.onBeforeBuild(() => {
      const isRsc = isRscRenderMode(config);
      let htmlTemplate: string = '';
      let hasError: boolean = false;
      let rscManifestSource: string | null = null;
      const indexHtmlEmittedInWeb: Promise<void> = new Promise<void>(
        (resolve, reject) => {
          api.processAssets(
            { stage: 'report', environments: ['web'] },
            ({ assets, compilation }) => {
              if (compilation.errors.length > 0) {
                hasError = true;
                return;
              }
              const statsJson = compilation.getStats().toJson({
                all: false,
                modules: true,
                chunks: true,
                chunkModules: true,
                entrypoints: true,
                ids: true,
              });

              if (isRsc) {
                rscManifestSource = createRscManifest({
                  assets,
                  statsJson,
                  config,
                });
              }

              for (const [assetName, assetSource] of Object.entries(assets)) {
                if (assetName === 'index.html') {
                  htmlTemplate = assetSource.source().toString();
                  compilation.deleteAsset(assetName);
                  resolve();
                  break;
                }
              }
              reject();
            },
          );
        },
      ).catch(() => {
        const message =
          'SSG requires an `index.html` as entry, but this file is not emitted successfully in the web target.';
        logger.error(message);
        const error = new Error(message);
        throw error;
      });

      api.processAssets(
        { stage: 'optimize-transfer', environments: ['node'] },
        async ({ assets, compilation, environment, compiler }) => {
          if (compilation.errors.length > 0) {
            hasError = true;
            return;
          }

          // If user has encountered a compile time error at the web/node output, user needs to first debug the error in this stage.
          // we will not do ssg for better debugging
          if (hasError) {
            return;
          }

          const emitAsset = (
            assetName: string,
            content: string | Buffer,
          ): void => {
            compilation.emitAsset(
              assetName,
              new compiler.webpack.sources.RawSource(content),
            );
          };

          const distPath = environment.distPath;
          let patchedRscManifestSource = rscManifestSource;
          if (isRsc && rscManifestSource) {
            const ssrBundleAsset =
              assets[
                `${NODE_SSG_BUNDLE_FOLDER}/${NODE_RSC_SSG_SSR_ENTRY_NAME}.mjs`
              ];
            if (ssrBundleAsset) {
              patchedRscManifestSource = hydrateServerConsumerModuleMap({
                manifestSource: rscManifestSource,
                ssrBundleSource: ssrBundleAsset.source().toString(),
              });
            }
          }
          const ssgFolderPath = join(distPath, NODE_SSG_BUNDLE_FOLDER);
          const mainCjsAbsolutePath = join(ssgFolderPath, NODE_SSG_BUNDLE_NAME);
          const rscBundleAbsolutePath = join(
            ssgFolderPath,
            `${NODE_RSC_SSG_SERVER_ENTRY_NAME}.mjs`,
          );
          const ssrBundleAbsolutePath = join(
            ssgFolderPath,
            `${NODE_RSC_SSG_SSR_ENTRY_NAME}.mjs`,
          );

          await mkdir(ssgFolderPath, { recursive: true });
          await Promise.all(
            Object.entries(assets).map(async ([assetName, assetSource]) => {
              if (assetName.startsWith(`${NODE_SSG_BUNDLE_FOLDER}/`)) {
                const fileAbsolutePath = join(distPath, assetName);
                let source = assetSource.source().toString();
                if (isRsc && patchedRscManifestSource) {
                  source = patchRscManifest(source, patchedRscManifestSource);
                }
                await writeFile(
                  fileAbsolutePath,
                  source,
                );
                compilation.deleteAsset(assetName);
              }
            }),
          );

          await indexHtmlEmittedInWeb;

          if (isRsc) {
            const { renderStaticRsc } = (await import(
              pathToFileURL(rscBundleAbsolutePath).toString()
            )) as {
              renderStaticRsc: (
                routePath: string,
                configHead?: UserConfig['head'],
              ) => Promise<{
                stream: ReadableStream<Uint8Array>;
                bootstrapScripts?: string[];
              }>;
            };
            const { renderHtml } = (await import(
              pathToFileURL(ssrBundleAbsolutePath).toString()
            )) as {
              renderHtml: (
                rscStream: ReadableStream<Uint8Array>,
                options?: {
                  bootstrapScripts?: string[];
                  ssg?: boolean;
                },
              ) => Promise<{
                stream: ReadableStream<Uint8Array>;
                status?: number;
              }>;
            };

            const routes = routeService.getRoutes();
            if (!routeService.isExistRoute('/404')) {
              // @ts-expect-error 404 page is special
              routes.push({ routePath: '/404' });
            }

            await Promise.all(
              routes.map(async route => {
                const { stream: rscStream, bootstrapScripts } =
                  await renderStaticRsc(route.routePath, config.head);
                const { stream } = await renderHtml(rscStream, {
                  bootstrapScripts,
                  ssg: true,
                });
                const html = await streamToString(stream);
                const fileName = routePath2HtmlFileName(route.routePath);
                emitAsset(fileName, html);
              }),
            );
          } else {
            await renderPages(
              routeService,
              config,
              mainCjsAbsolutePath,
              htmlTemplate,
              emitAsset,
            );
          }

          if (!isDebugMode()) {
            await rm(ssgFolderPath, { recursive: true });
          }
        },
      );
    });
  },
});

function routePath2HtmlFileName(routePath: string) {
  let fileName = routePath;
  if (fileName.endsWith('/')) {
    fileName = `${routePath}index.html`;
  } else {
    fileName = `${routePath}.html`;
  }

  return fileName.replace(/^\/+/, '');
}

async function streamToString(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result += decoder.decode(value, { stream: true });
  }

  return `${result}${decoder.decode()}`;
}

type StatsModule = {
  id?: string | number | null;
  name?: string | null;
  nameForCondition?: string | null;
  chunks?: Array<string | number>;
};

type StatsChunk = {
  id?: string | number | null;
  files?: string[];
};

type StatsEntrypoint = {
  chunks?: Array<string | number>;
  assets?: Array<{ name: string }>;
};

function createRscManifest({
  assets,
  statsJson,
  config,
}: {
  assets: Record<string, { source(): string | Buffer }>;
  statsJson: {
    modules?: StatsModule[];
    chunks?: StatsChunk[];
    entrypoints?: Record<string, StatsEntrypoint>;
  };
  config: UserConfig;
}) {
  const entrypoint = statsJson.entrypoints?.index;
  if (!entrypoint) {
    return null;
  }

  const chunkFiles = new Map<string, string[]>();
  for (const chunk of statsJson.chunks ?? []) {
    if (chunk.id == null) {
      continue;
    }
    chunkFiles.set(
      String(chunk.id),
      (chunk.files ?? []).filter(file => file.endsWith('.js')),
    );
  }

  const entryChunkPairs = (entrypoint.chunks ?? []).flatMap(chunkId => {
    const files = chunkFiles.get(String(chunkId)) ?? [];
    return files.flatMap(file => [String(chunkId), withManifestPath(file)]);
  });

  const entryAssets = entrypoint.assets ?? [];
  const entryJsFiles = entryAssets
    .map(asset => asset.name)
    .filter(file => file.endsWith('.js'))
    .map(withManifestPath);
  const entryCssFiles = entryAssets
    .map(asset => asset.name)
    .filter(file => file.endsWith('.css'))
    .map(withManifestPath);
  const clientReferenceModuleId = getWebRscClientReferencesModuleId(
    entryJsFiles.map(file => {
      const asset = assets[file.slice(1)];
      return asset?.source().toString() ?? '';
    }),
  );

  const clientManifest: Record<
    string,
    {
      id: string | number;
      chunks: Array<string>;
      name: string;
    }
  > = {};
  const serverConsumerModuleMap: Record<
    string,
    Record<
      string,
      {
        id: string | number;
        chunks: Array<string>;
        name: string;
      }
    >
  > = {};
  const targetModules = getRscClientModules();

  if (clientReferenceModuleId != null) {
    serverConsumerModuleMap[String(clientReferenceModuleId)] = {
      '*': {
        id: clientReferenceModuleId,
        chunks: entryChunkPairs,
        name: '*',
      },
    };

    for (const [modulePath, exports] of Object.entries(targetModules)) {
      clientManifest[modulePath] = {
        id: clientReferenceModuleId,
        chunks: entryChunkPairs,
        name: '*',
      };

      for (const exportName of exports) {
        const metadata = {
          id: clientReferenceModuleId,
          chunks: entryChunkPairs,
          name: exportName,
        };
        clientManifest[`${modulePath}#${exportName}`] = metadata;
        serverConsumerModuleMap[String(clientReferenceModuleId)][exportName] =
          metadata;
      }
    }

    const assetPrefix = addTrailingSlash(
      config.builderConfig?.output?.assetPrefix ?? config.base ?? '/',
    );

    return JSON.stringify({
      serverManifest: {},
      clientManifest,
      serverConsumerModuleMap,
      moduleLoading: {
        prefix: assetPrefix,
      },
      entryCssFiles: {
        [join(PACKAGE_ROOT, 'dist/runtime/rsc/Document.js')]: entryCssFiles,
      },
      entryJsFiles,
    });
  }

  for (const moduleInfo of statsJson.modules ?? []) {
    const modulePath = moduleInfo.nameForCondition;
    if (!modulePath || moduleInfo.id == null) {
      continue;
    }

    const exports = targetModules[modulePath];
    if (!exports) {
      continue;
    }

    const resolvedChunks =
      moduleInfo.chunks?.flatMap(chunkId => {
        const files = chunkFiles.get(String(chunkId)) ?? [];
        return files.flatMap(file => [String(chunkId), withManifestPath(file)]);
      }) ?? [];
    const chunks =
      clientReferenceModuleId != null
        ? entryChunkPairs
        : resolvedChunks.length > 0
          ? resolvedChunks
          : entryChunkPairs;
    const manifestModuleId = clientReferenceModuleId ?? moduleInfo.id;

    clientManifest[modulePath] = {
      id: manifestModuleId,
      chunks,
      name: '*',
    };
    serverConsumerModuleMap[String(manifestModuleId)] ??= {};
    serverConsumerModuleMap[String(manifestModuleId)]['*'] = {
      id: manifestModuleId,
      chunks,
      name: '*',
    };

    for (const exportName of exports) {
      const metadata = {
        id: manifestModuleId,
        chunks,
        name: exportName,
      };
      clientManifest[`${modulePath}#${exportName}`] = metadata;
      serverConsumerModuleMap[String(manifestModuleId)][exportName] = metadata;
    }
  }

  const assetPrefix = addTrailingSlash(
    config.builderConfig?.output?.assetPrefix ?? config.base ?? '/',
  );

  return JSON.stringify({
    serverManifest: {},
    clientManifest,
    serverConsumerModuleMap,
    moduleLoading: {
      prefix: assetPrefix,
    },
    entryCssFiles: {
      [join(PACKAGE_ROOT, 'dist/runtime/rsc/Document.js')]: entryCssFiles,
    },
    entryJsFiles,
  });
}

function getRscClientModules() {
  return {
    [join(PACKAGE_ROOT, 'dist/runtime/rscClientReferences.js')]: [
      'RscClientProviders',
      'RscDocChrome',
      'RscNavChrome',
      'RscNotFoundChrome',
      'RscOverviewChrome',
    ],
    [join(PACKAGE_ROOT, 'dist/runtime/rsc/ClientProviders.js')]: [
      'RscClientProviders',
    ],
    [join(PACKAGE_ROOT, 'dist/runtime/rsc/ClientChrome.js')]: [
      'RscDocChrome',
      'RscNavChrome',
      'RscNotFoundChrome',
      'RscOverviewChrome',
    ],
  } satisfies Record<string, string[]>;
}

function withManifestPath(file: string) {
  return file.startsWith('/') ? file : `/${file}`;
}

function patchRscManifest(source: string, manifestSource: string) {
  return source.replace(
    /__webpack_require__\.rscM = JSON\.parse\("[\s\S]*?"\);/,
    `__webpack_require__.rscM = JSON.parse(${JSON.stringify(manifestSource)});`,
  );
}

function hydrateServerConsumerModuleMap({
  manifestSource,
  ssrBundleSource,
}: {
  manifestSource: string;
  ssrBundleSource: string;
}) {
  const manifest = JSON.parse(manifestSource) as {
    serverConsumerModuleMap: Record<
      string,
      Record<
        string,
        {
          id: string | number;
          chunks: Array<string>;
          name: string;
        }
      >
    >;
  };
  const consumerModuleId = getRscClientReferencesModuleId(ssrBundleSource);
  if (consumerModuleId == null) {
    return manifestSource;
  }

  for (const [webModuleId, exports] of Object.entries(
    manifest.serverConsumerModuleMap,
  )) {
    for (const [exportName, metadata] of Object.entries(exports)) {
      manifest.serverConsumerModuleMap[webModuleId][exportName] = {
        ...metadata,
        id: consumerModuleId,
      };
    }
  }

  return JSON.stringify(manifest);
}

function getRscClientReferencesModuleId(source: string) {
  const match = source.match(
    /(\d+)\(__unused_rspack_module, __webpack_exports__, __webpack_require__\) \{[\s\S]{0,400}?RscClientProviders: \(\) => \(\/\* reexport safe \*\/ _rsc_ClientProviders_js__rspack_import_0\.s\),[\s\S]{0,400}?RscOverviewChrome: \(\) => \(\/\* reexport safe \*\/ _rsc_ClientChrome_js__rspack_import_1\.os\)/,
  );
  return match ? Number(match[1]) : null;
}

function getWebRscClientReferencesModuleId(sources: string[]) {
  for (const source of sources) {
    const match = source.match(
      /(\d+)\(e,t,r\)\{"use strict";r\.r\(t\),r\.d\(t,\{RscClientProviders:\(\)=>[^,]+,RscDocChrome:\(\)=>[^,]+,RscNavChrome:\(\)=>[^,]+,RscNotFoundChrome:\(\)=>[^,]+,RscOverviewChrome:\(\)=>[^}]+\}\)/,
    );
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}
