import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { isDebugMode, type UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import {
  NODE_RSC_SSG_BUNDLE_NAME,
  NODE_SSG_BUNDLE_FOLDER,
  NODE_SSG_BUNDLE_NAME,
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
      let htmlTemplate: string = '';
      let hasError: boolean = false;
      const indexHtmlEmittedInWeb: Promise<void> = new Promise<void>(
        (resolve, reject) => {
          api.processAssets(
            { stage: 'report', environments: ['web'] },
            ({ assets, compilation }) => {
              if (compilation.errors.length > 0) {
                hasError = true;
                return;
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
        throw new Error(message);
      });

      api.processAssets(
        { stage: 'optimize-transfer', environments: ['node'] },
        async ({ assets, compilation, environment, compiler }) => {
          if (compilation.errors.length > 0) {
            hasError = true;
            return;
          }

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
          const ssgFolderPath = join(distPath, NODE_SSG_BUNDLE_FOLDER);
          const bundleName = isRscRenderMode(config)
            ? NODE_RSC_SSG_BUNDLE_NAME
            : NODE_SSG_BUNDLE_NAME;
          const mainSsgEntryPath = join(ssgFolderPath, bundleName);

          await mkdir(ssgFolderPath, { recursive: true });
          await Promise.all(
            Object.entries(assets).map(async ([assetName, assetSource]) => {
              if (assetName.startsWith(`${NODE_SSG_BUNDLE_FOLDER}/`)) {
                const fileAbsolutePath = join(distPath, assetName);
                await writeFile(
                  fileAbsolutePath,
                  assetSource.source().toString(),
                );
                compilation.deleteAsset(assetName);
              }
            }),
          );

          await indexHtmlEmittedInWeb;
          await renderPages(
            routeService,
            config,
            mainSsgEntryPath,
            htmlTemplate,
            emitAsset,
          );

          if (!isDebugMode()) {
            await rm(ssgFolderPath, { recursive: true });
          }
        },
      );
    });
  },
});
