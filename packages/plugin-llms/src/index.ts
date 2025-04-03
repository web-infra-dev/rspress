import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { PageIndexInfo, RspressPlugin } from '@rspress/shared';
import { mdxToMd } from './mdxToMd';

interface Options {
  pageDataList?: { current: PageIndexInfo[] };
}

const rsbuildPluginLlms = ({ pageDataList }: Options): RsbuildPlugin => ({
  name: 'rsbuild-plugin-llms',
  setup(api) {
    const docDirectory = api.context.rootPath;
    api.processAssets(
      { targets: ['web'], stage: 'additional' },
      async ({ compilation, sources }) => {
        const mdContents: Record<string, string> = {};
        await Promise.all(
          pageDataList?.current.map(async pageData => {
            const content = pageData.flattenContent ?? pageData.content;
            const filepath = pageData._filepath;
            const isMD = path.extname(filepath).slice(1) === 'md';
            let mdContent: string | Buffer;
            if (isMD) {
              mdContent = content;
            } else {
              mdContent = (
                await mdxToMd(content, filepath, docDirectory)
              ).toString();
            }
            const outFilePath = `${
              pageData.routePath.endsWith('/')
                ? `${pageData.routePath}index`
                : pageData.routePath
            }.md`;
            mdContents[outFilePath] = mdContent.toString();
          }) ?? [],
        );

        Object.entries(mdContents).forEach(([outFilePath, content]) => {
          const source = new sources.RawSource(content);
          console.log(`.${outFilePath}`);
          compilation.emitAsset(`.${outFilePath}`, source);
        });
      },
    );
  },
});

/**
 * A plugin for rspress to generate llms.txt, llms-full.txt, md files to let llm understand your website.
 */
export function pluginLlms(_options: Options = {}): RspressPlugin {
  const pageDataList: { current: PageIndexInfo[] } = { current: [] };
  return {
    name: '@rspress/plugin-llms',
    extendPageData(pageData, isProd) {
      if (isProd) {
        pageDataList.current.push(pageData);
      }
    },
    builderConfig: {
      plugins: [
        rsbuildPluginLlms({
          pageDataList,
        }),
      ],
    },
  };
}
