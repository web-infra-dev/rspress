import type { RsbuildPlugin } from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import type { RouteService } from '../route/RouteService';
import { renderCSRPages } from './renderPages';

export const rsbuildPluginCSR = ({
  routeService,
  config,
}: {
  routeService: RouteService;
  config: UserConfig;
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

          const emitAsset: (assetName: string, content: string) => void = (
            assetName: string,
            content: string,
          ) => {
            compilation.emitAsset(
              assetName,
              new compiler.webpack.sources.RawSource(content),
            );
          };

          let htmlTemplate: string = '';
          for (const [assetName, assetSource] of Object.entries(assets)) {
            if (assetName === 'index.html') {
              htmlTemplate = assetSource.source().toString();
              compilation.deleteAsset(assetName);
              break;
            }
          }

          await renderCSRPages(routeService, config, htmlTemplate, emitAsset);
        },
      );
    });
  },
});
