import path from 'path';
import { describe, expect, it } from 'vitest';
import { RuntimeModuleID } from '../src/node/runtimeModule';
import { siteDataVMPlugin } from '../src/node/runtimeModule/siteData';

describe('automatic import of prism languages', () => {
  const userDocRoot = path.join(__dirname, 'prismLanguages');

  const context: any = {
    alias: {},
    config: {
      markdown: {
        highlightLanguages: [
          ['js', 'javascript'],
          ['oc', 'objectivec'],
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
    },
    pluginDriver: {
      async extendPageData(_pageData: any) {},
      async modifySearchIndexData(_pages: any) {},
    },
  };

  it('prism languages aliases should be configurable to users', async () => {
    const meta = await siteDataVMPlugin(context);
    const prismLanguagesContent = meta[RuntimeModuleID.PrismLanguages];

    expect(prismLanguagesContent).toMatchSnapshot();
  });
});
