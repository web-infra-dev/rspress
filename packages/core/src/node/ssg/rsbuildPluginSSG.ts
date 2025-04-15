import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { type UserConfig, isDebugMode } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import type { PluginDriver } from '../PluginDriver';
import type { RouteService } from '../route/RouteService';
import { renderPages } from './renderPages';

export const NODE_SSR_BUNDLE_NAME = 'rspress-ssg-entry.cjs';

export const rsbuildPluginSSG = ({
  routeService,
  config,
  pluginDriver,
}: {
  routeService: RouteService;
  config: UserConfig;
  pluginDriver: PluginDriver;
}): RsbuildPlugin => ({
  name: 'rspress-inner-rsbuild-plugin-ssg',
  async setup(api) {
    api.onBeforeBuild(() => {
      let htmlTemplate: string = '';
      const indexHtmlEmittedInWeb: Promise<void> = new Promise<void>(
        (resolve, reject) => {
          api.processAssets(
            { stage: 'report', targets: ['web'] },
            ({ assets, compilation }) => {
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
        { stage: 'optimize-transfer', targets: ['node'] },
        async ({ assets, compilation, environment, compiler }) => {
          const distPath = environment.distPath;
          await mkdir(distPath, { recursive: true });

          let mainCjsAbsolutePath = '';
          for (const [assetName, assetSource] of Object.entries(assets)) {
            if (assetName.includes(NODE_SSR_BUNDLE_NAME)) {
              mainCjsAbsolutePath = join(distPath, assetName);
              await writeFile(
                mainCjsAbsolutePath,
                assetSource.source().toString(),
              );
              compilation.deleteAsset(assetName);
              break;
            }
          }

          const emitAsset: (assetName: string, content: string) => void = (
            assetName: string,
            content: string,
          ) => {
            compilation.emitAsset(
              assetName,
              new compiler.webpack.sources.RawSource(content),
            );
          };

          await indexHtmlEmittedInWeb;
          await renderPages(
            routeService,
            config,
            pluginDriver,
            mainCjsAbsolutePath,
            htmlTemplate,
            emitAsset,
          );

          if (!isDebugMode()) {
            await rm(mainCjsAbsolutePath);
          }
        },
      );
    });
  },
});
