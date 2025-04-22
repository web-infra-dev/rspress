import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createProcessor } from '@mdx-js/mdx';
import type { Rspack } from '@rsbuild/core';
import type {
  FrontMatterMeta,
  Header,
  PageIndexInfo,
  SiteData,
  UserConfig,
} from '@rspress/shared';
import { isProduction } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { extractTextAndId, loadFrontMatter } from '@rspress/shared/node-utils';

import type { PluginDriver } from '../PluginDriver';
import { TEMP_DIR } from '../constants';
import type { RouteService } from '../route/RouteService';
import { RuntimeModuleID } from '../runtimeModule/types';
import {
  applyReplaceRules,
  escapeMarkdownHeadingIds,
  flattenMdxContent,
  normalizePath,
} from '../utils';
import { createMDXOptions } from './options';
import type { TocItem } from './remarkPlugins/toc';

interface LoaderOptions {
  config: UserConfig;
  docDirectory: string;
  checkDeadLinks: boolean;
  routeService: RouteService;
  pluginDriver: PluginDriver;
}

export interface PageMeta {
  toc: TocItem[];
  title: string;
  headingTitle: string;
  frontmatter?: FrontMatterMeta;
}

export async function updateSiteDataRuntimeModule(
  modulePath: string,
  pageMeta: PageMeta,
) {
  const siteDataModulePath = path.join(
    TEMP_DIR,
    'runtime',
    `${RuntimeModuleID.SiteData}.mjs`,
  );
  const { default: siteData } = (await import(
    pathToFileURL(siteDataModulePath).href
  )) as { default: SiteData };
  await fs.writeFile(
    siteDataModulePath,
    `export default ${JSON.stringify(
      {
        ...siteData,
        timestamp: Date.now().toString(),
        // in node side, "_file" "_relativePath" underscore fields exist
        pages: (siteData.pages as PageIndexInfo[]).map(page =>
          // Update page meta if the page is updated
          page._filepath === modulePath ? { ...page, ...pageMeta } : page,
        ),
      },
      null,
      2,
    )}`,
  );
}

export function createCheckPageMetaUpdateFn() {
  const pageMetaMap = new Map<string, string>();
  return (modulePath: string, pageMeta: PageMeta) => {
    const prevMeta = pageMetaMap.get(modulePath);
    const deserializedMeta = JSON.stringify(pageMeta);
    pageMetaMap.set(modulePath, deserializedMeta);

    if (!prevMeta) {
      return;
    }

    if (prevMeta !== deserializedMeta) {
      setTimeout(async () => {
        logger.info('Page metadata changed, page reloading...');
        await updateSiteDataRuntimeModule(modulePath, pageMeta);
      });
    }
  };
}

const checkPageMetaUpdate = createCheckPageMetaUpdateFn();

export default async function mdxLoader(
  this: Rspack.LoaderContext<LoaderOptions>,
  source: string,
) {
  this.cacheable(true);
  const callback = this.async();

  const options = this.getOptions();
  const filepath = this.resourcePath;
  const { alias } = this._compiler.options.resolve;
  const { config, docDirectory, checkDeadLinks, routeService, pluginDriver } =
    options;

  // Separate frontmatter and content in MDX source
  const { frontmatter, content } = loadFrontMatter(
    source,
    filepath,
    docDirectory,
    true,
  );

  // Replace imported built-in MDX content
  const { flattenContent, deps } = await flattenMdxContent(
    content,
    filepath,
    alias as Record<string, string>,
  );

  deps.forEach(dep => this.addDependency(dep));

  // Resolve side effects caused by flattenMdxContent.
  // Perhaps this problem should be solved within flattenMdxContent?
  const replacedContent = applyReplaceRules(
    flattenContent,
    config.replaceRules,
  );

  // Support custom id like `#hello world {#custom-id}`.
  // TODO > issue: `#hello world {#custom-id}` will also be replaced.
  const preprocessedContent = escapeMarkdownHeadingIds(replacedContent);

  try {
    let pageMeta: PageMeta = {
      title: '',
      toc: [] as TocItem[],
      headingTitle: '',
    };

    const frontmatterTitle = extractTextAndId(frontmatter.title)[0];

    const mdxOptions = await createMDXOptions(
      docDirectory,
      config,
      checkDeadLinks,
      routeService,
      filepath,
      pluginDriver,
    );
    const compiler = createProcessor(mdxOptions);

    compiler.data('pageMeta' as any, { toc: [], title: '' });
    const vFile = await compiler.process({
      value: preprocessedContent,
      path: filepath,
    });

    const compileResult = String(vFile);
    const compilationMeta = compiler.data('pageMeta' as any) as {
      toc: Header[];
      title: string;
    };
    const headingTitle = extractTextAndId(compilationMeta.title)[0];
    pageMeta = {
      ...compilationMeta,
      title: frontmatterTitle || headingTitle,
      headingTitle,
      frontmatter,
    } as PageMeta;

    // If page meta changed, we trigger page reload to ensure the page is up to date.
    if (!isProduction()) {
      checkPageMetaUpdate(filepath, pageMeta);
    }

    const result = `const frontmatter = ${JSON.stringify(frontmatter)};
${compileResult}
MDXContent.__RSPRESS_PAGE_META = {};

MDXContent.__RSPRESS_PAGE_META["${encodeURIComponent(
      normalizePath(path.relative(docDirectory, filepath)),
    )}"] = ${JSON.stringify(pageMeta)};
`;
    callback(null, result);
  } catch (e: unknown) {
    if (e instanceof Error) {
      logger.error(`MDX compile error: ${e.message} in ${filepath}`);
      logger.debug(e);
      callback({ message: e.message, name: `${filepath} compile error` });
    }
  }
}
