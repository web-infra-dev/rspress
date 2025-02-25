import path from 'node:path';
import type { PluginDriver } from 'src/node/PluginDriver';
import type { RouteService } from 'src/node/route/RouteService';
import { describe, expect, it } from 'vitest';
import {
  type FactoryContext,
  RuntimeModuleID,
} from '../src/node/runtimeModule';
import { siteDataVMPlugin } from '../src/node/runtimeModule/siteData';

describe('automatic import of prism languages', () => {
  const userDocRoot = path.join(__dirname, 'prismLanguages');

  const context = {
    alias: {},
    config: {
      markdown: {
        highlightLanguages: [
          ['js', 'javascript'],
          ['oc', 'objectivec'],
          ['go', 'go'],
        ],
      },
    },
    userDocRoot,
    routeService: {
      getRoutes() {
        return [
          { absolutePath: path.join(userDocRoot, 'index.mdx') },
          { absolutePath: path.join(userDocRoot, 'other.mdx') },
        ];
      },
    } as RouteService,
    pluginDriver: {
      extendPageData(pageData) {
        pageData.extraHighlightLanguages = ['jsx', 'tsx'];
      },
      modifySearchIndexData() {},
      // FIXME: not sure the difference with `RouteService` above
    } as unknown as PluginDriver,
  } as FactoryContext;

  it('prism languages aliases should be configurable to users', async () => {
    const meta = await siteDataVMPlugin(context);
    const prismLanguagesContent = meta[RuntimeModuleID.PrismLanguages];
    expect(prismLanguagesContent).toMatchSnapshot();
  });
});
