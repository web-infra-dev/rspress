import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { isDebugMode, type UserConfig } from '@rspress/shared';
import {
  NODE_SSG_MD_BUNDLE_FOLDER,
  NODE_SSG_MD_BUNDLE_NAME,
} from '../constants';
import type { RouteService } from '../route/RouteService';
import { emitLlmsTxt } from './llms/emitLlmsTxt';
import { renderPages } from './renderPages';

export const rsbuildPluginSSGMD = ({
  routeService,
  config,
}: {
  routeService: RouteService;
  config: UserConfig;
}): RsbuildPlugin => ({
  name: 'rspress-inner-rsbuild-plugin-ssg',
  async setup(api) {
    api.onBeforeBuild(() => {
      let hasError: boolean = false;

      api.processAssets(
        { stage: 'optimize-transfer', environments: ['node_md'] },
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
          const ssgFolderPath = join(distPath, NODE_SSG_MD_BUNDLE_FOLDER);
          const mainCjsAbsolutePath = join(
            ssgFolderPath,
            NODE_SSG_MD_BUNDLE_NAME,
          );

          await mkdir(ssgFolderPath, { recursive: true });
          await Promise.all(
            Object.entries(assets).map(async ([assetName, assetSource]) => {
              if (assetName.startsWith(`${NODE_SSG_MD_BUNDLE_FOLDER}/`)) {
                const fileAbsolutePath = join(distPath, assetName);
                await writeFile(
                  fileAbsolutePath,
                  assetSource.source().toString(),
                );
                compilation.deleteAsset(assetName);
              }
            }),
          );

          const mdContents = await renderPages(
            routeService,
            mainCjsAbsolutePath,
            emitAsset,
          );

          await emitLlmsTxt(config, routeService, emitAsset, mdContents);

          if (!isDebugMode()) {
            await rm(ssgFolderPath, { recursive: true });
          }
        },
      );
    });
  },
});
