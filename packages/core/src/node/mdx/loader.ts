import path from 'node:path';
import fs from '@rspress/shared/fs-extra';
import { pathToFileURL } from 'node:url';
import { createProcessor } from '@mdx-js/mdx';
import { isProduction } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { loadFrontMatter } from '@rspress/shared/node-utils';
import { createMDXOptions } from './options';
import type { TocItem } from './remarkPlugins/toc';
import { checkLinks } from './remarkPlugins/checkDeadLink';
import { TEMP_DIR } from '../constants';
import type { PluginDriver } from '../PluginDriver';
import { RuntimeModuleID } from '../runtimeModule';
import {
  normalizePath,
  escapeMarkdownHeadingIds,
  flattenMdxContent,
  applyReplaceRules,
} from '../utils';

import type { Rspack } from '@rsbuild/core';
import type { Header, UserConfig } from '@rspress/shared';
import type { RouteService } from '../route/RouteService';

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
  frontmatter?: Record<string, any>;
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
  const { default: siteData } = await import(
    pathToFileURL(siteDataModulePath).href
  );
  await fs.writeFile(
    siteDataModulePath,
    `export default ${JSON.stringify(
      {
        ...siteData,
        timestamp: Date.now().toString(),
        pages: siteData.pages.map(page =>
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
        logger.info(
          '⭐️ Page metadata changed, rspress will trigger page reload...',
        );
        await updateSiteDataRuntimeModule(modulePath, pageMeta);
      });
    }
  };
}

const checkPageMetaUpdate = createCheckPageMetaUpdateFn();

export default async function mdxLoader(
  context: Rspack.LoaderContext<LoaderOptions>,
  source: string,
  callback: Rspack.LoaderContext['callback'],
) {
  context.cacheable(true);

  const options = context.getOptions();
  const filepath = context.resourcePath;
  const { alias } = context._compiler.options.resolve;
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

  deps.forEach(dep => context.addDependency(dep));

  // Resolve side effects caused by flattenMdxContent.
  // Perhaps this problem should be solved within flattenMdxContent?
  const replacedContent = applyReplaceRules(
    flattenContent,
    config.replaceRules,
  );

  // Support custom id like `#hello world {#custom-id}`.
  // TODO > issue: `#hello world {#custom-id}` will also be replaced.
  const preprocessedContent = escapeMarkdownHeadingIds(replacedContent);

  // Whether to use the Rust version of the MDX compiler.
  let enableMdxRs: boolean;
  const mdxRs = config?.markdown?.mdxRs ?? true;
  if (typeof mdxRs === 'object') {
    enableMdxRs =
      typeof mdxRs?.include === 'function' ? mdxRs.include(filepath) : true;
  } else {
    enableMdxRs = mdxRs;
  }

  try {
    let compileResult: string;
    let pageMeta = { title: '', toc: [] } as PageMeta;

    if (!enableMdxRs) {
      const mdxOptions = await createMDXOptions(
        docDirectory,
        config,
        checkDeadLinks,
        routeService,
        filepath,
        pluginDriver,
      );
      const compiler = createProcessor(mdxOptions);

      compiler.data('pageMeta', { toc: [], title: '' });
      const vFile = await compiler.process({
        value: preprocessedContent,
        path: filepath,
      });

      compileResult = String(vFile);
      const compilationMeta = compiler.data('pageMeta') as {
        toc: Header[];
        title: string;
      };
      pageMeta = {
        ...compilationMeta,
        title: frontmatter.title || compilationMeta.title || '',
        frontmatter,
      } as PageMeta;
    } else {
      const { compile } = require('@rspress/mdx-rs');

      const { toc, links, title, code } = await compile({
        value: preprocessedContent,
        filepath,
        root: docDirectory,
        development: process.env.NODE_ENV !== 'production',
      });

      compileResult = code;
      pageMeta = {
        toc,
        title: frontmatter.title || title || '',
        frontmatter,
      };
      // We should check dead links in mdx-rs mode
      if (checkDeadLinks) {
        checkLinks(links, filepath, docDirectory, routeService);
      }
    }

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
  } catch (e) {
    logger.error(`MDX compile error: ${e.message} in ${filepath}`);
    callback({ message: e.message, name: `${filepath} compile error` });
  }
}
