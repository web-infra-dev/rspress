import type { RsbuildPlugin } from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import type { RouteService } from '../route/RouteService';
import type { RouteChunkAssetsPlugin } from '../route/routeChunkAssets';
import { renderCSRPages } from './renderPages';

export const rsbuildPluginCSR = ({
  routeService,
  config,
  routeChunkAssets,
}: {
  routeService: RouteService;
  config: UserConfig;
  routeChunkAssets: RouteChunkAssetsPlugin;
}): RsbuildPlugin => ({
  name: 'rspress-inner-rsbuild-plugin-csr',
  async setup(api) {
    api.onBeforeBuild(() => {
      api.processAssets(
        { stage: 'report', environments: ['web'] },
        async ({ assets, compilation, compiler }) => {
          if (compilation.errors.length > 0) {
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

          let htmlTemplate: string = '';
          // Rspack resolves `assets[name]` through the Rust-JS bridge, so keep
          // enumeration to names and read the Source only after match.
          for (const assetName of Object.keys(assets)) {
            if (assetName === 'index.html') {
              const assetSource = assets[assetName];
              htmlTemplate = assetSource.source().toString();
              compilation.deleteAsset(assetName);
              break;
            }
          }

          await renderCSRPages(
            routeService,
            config,
            htmlTemplate,
            emitAsset,
            routeChunkAssets.getManifest(),
          );
        },
      );
    });
  },
});
