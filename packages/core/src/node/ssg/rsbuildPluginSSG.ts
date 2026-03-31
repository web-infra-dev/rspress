import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { isDebugMode, type UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { NODE_SSG_BUNDLE_FOLDER, NODE_SSG_BUNDLE_NAME } from '../constants';
import type { RouteService } from '../route/RouteService';
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
      const missingIndexHtmlMessage =
        'SSG requires an `index.html` as entry, but this file is not emitted successfully in the web target.';
      const indexHtmlEmittedInWeb: Promise<void> = new Promise<void>(
        (resolve, reject) => {
          let settled = false;
          const resolveOnce = () => {
            if (settled) {
              return;
            }
            settled = true;
            resolve();
          };
          const rejectOnce = () => {
            if (settled) {
              return;
            }
            settled = true;
            reject(new Error(missingIndexHtmlMessage));
          };

          api.processAssets(
            { stage: 'report', environments: ['web'] },
            ({ assets, compilation }) => {
              if (compilation.errors.length > 0) {
                hasError = true;
                resolveOnce();
                return;
              }

              for (const [assetName, assetSource] of Object.entries(assets)) {
                if (assetName === 'index.html') {
                  htmlTemplate = assetSource.source().toString();
                  compilation.deleteAsset(assetName);
                  resolveOnce();
                  return;
                }
              }
              rejectOnce();
            },
          );
        },
      ).catch(() => {
        logger.error(missingIndexHtmlMessage);
        const error = new Error(missingIndexHtmlMessage);
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
          const ssgFolderPath = join(distPath, NODE_SSG_BUNDLE_FOLDER);
          const mainCjsAbsolutePath = join(ssgFolderPath, NODE_SSG_BUNDLE_NAME);

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
          if (hasError) {
            return;
          }
          await renderPages(
            routeService,
            config,
            mainCjsAbsolutePath,
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
