import type { Rspack } from '@rsbuild/core';
import type { RouteMeta } from '@rspress/shared';
import { createHash } from '../utils/createHash';
import type { RouteService } from './RouteService';

const PLUGIN_NAME = 'RspressRouteChunkAssetsPlugin';
const JAVASCRIPT_ASSET_REGEXP = /\.[cm]?js$/;
const ROUTE_CHUNK_HASH_LENGTH = 12;

export interface RouteChunkAssetsManifest {
  assetPrefix: string;
  assets: Record<string, string[]>;
}

export function getRouteChunkName(route: RouteMeta): string {
  return `route-${createHash(route.relativePath, ROUTE_CHUNK_HASH_LENGTH)}`;
}

export class RouteChunkAssetsPlugin implements Rspack.RspackPluginInstance {
  #assetPrefix = '/';

  #chunks = new Map<string, Set<Rspack.Chunk>>();

  constructor(private readonly routeService: RouteService) {}

  apply(compiler: Rspack.Compiler): void {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      this.#assetPrefix =
        typeof compilation.outputOptions.publicPath === 'string'
          ? compilation.outputOptions.publicPath
          : '/';
      this.#chunks.clear();

      const routePathsByChunkName = new Map<string, string[]>();
      for (const route of this.routeService.getRoutes()) {
        const chunkName = getRouteChunkName(route);
        const routePaths = routePathsByChunkName.get(chunkName) ?? [];
        routePaths.push(route.routePath);
        routePathsByChunkName.set(chunkName, routePaths);
      }

      compilation.hooks.chunkAsset.tap(PLUGIN_NAME, chunk => {
        if (!chunk.name) {
          return;
        }

        const routePaths = routePathsByChunkName.get(chunk.name);
        if (!routePaths) {
          return;
        }

        for (const routePath of routePaths) {
          const chunks = this.#chunks.get(routePath) ?? new Set<Rspack.Chunk>();
          chunks.add(chunk);
          this.#chunks.set(routePath, chunks);
        }
      });
    });
  }

  getManifest(): RouteChunkAssetsManifest {
    return {
      assetPrefix: this.#assetPrefix,
      assets: Object.fromEntries(
        [...this.#chunks].map(([routePath, chunks]) => {
          const assets = new Set<string>();
          for (const chunk of chunks) {
            for (const filename of chunk.files) {
              if (JAVASCRIPT_ASSET_REGEXP.test(filename)) {
                assets.add(filename);
              }
            }
          }
          return [routePath, [...assets]];
        }),
      ),
    };
  }
}
