import path from 'path';
import type { Rspack } from '@rsbuild/core';
import { createProcessor } from '@mdx-js/mdx';
import type { Header, UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { loadFrontMatter } from '@rspress/shared/node-utils';
import type { RouteService } from '../route/RouteService';
import { normalizePath, escapeMarkdownHeadingIds } from '../utils';
import { PluginDriver } from '../PluginDriver';
import { createMDXOptions } from './options';
import { TocItem } from './remarkPlugins/toc';
import { checkLinks } from './remarkPlugins/checkDeadLink';

interface LoaderOptions {
  config: UserConfig;
  docDirectory: string;
  checkDeadLinks: boolean;
  enableMdxRs: boolean;
  routeService: RouteService;
  pluginDriver: PluginDriver;
}

export interface PageMeta {
  toc: TocItem[];
  title: string;
  frontmatter?: Record<string, any>;
}

export default async function mdxLoader(
  context: Rspack.LoaderContext<LoaderOptions>,
  source: string,
  callback: Rspack.LoaderContext['callback'],
) {
  const options = context.getOptions();
  const filepath = context.resourcePath;
  context.cacheable(true);

  let pageMeta = {
    title: '',
    toc: [],
  } as PageMeta;

  const {
    config,
    docDirectory,
    checkDeadLinks,
    routeService,
    enableMdxRs,
    pluginDriver,
  } = options;

  const { frontmatter, content } = loadFrontMatter(
    source,
    filepath,
    docDirectory,
    true,
  );

  // preprocessor
  const preprocessedContent = escapeMarkdownHeadingIds(content);
  const isHomePage = frontmatter.pageType === 'home';

  try {
    let compileResult: string;
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

      compiler.data('pageMeta', {
        toc: [],
        title: '',
      });
      const vFile = await compiler.process({
        value: preprocessedContent,
        path: filepath,
      });

      compileResult = String(vFile);
      pageMeta = {
        ...(compiler.data('pageMeta') as {
          toc: Header[];
          title: string;
        }),
        frontmatter,
      } as PageMeta;
    } else {
      const { compile } = require('@rspress/mdx-rs');

      // TODO: Cannot get correct toc from mdx which has internal components
      const { toc, links, title, code } = await compile({
        value: preprocessedContent,
        filepath,
        root: docDirectory,
        development: process.env.NODE_ENV !== 'production',
      });

      compileResult = code;
      pageMeta = {
        toc,
        title,
        frontmatter,
      };
      // We should check dead links in mdx-rs mode
      if (checkDeadLinks) {
        checkLinks(links, filepath, docDirectory, routeService);
      }
    }

    // encode filename to be compatible with Windows
    const result = `${compileResult}
MDXContent.__RSPRESS_PAGE_META = {};
MDXContent.__RSPRESS_PAGE_META["${encodeURIComponent(
      normalizePath(path.relative(docDirectory, filepath)),
    )}"] = ${JSON.stringify(pageMeta)};
${
  // Fix the home page won't update when the frontmatter is changed
  isHomePage ? `export const frontmatter = ${JSON.stringify(frontmatter)};` : ''
}

`;
    callback(null, result);
  } catch (e) {
    logger.error(`MDX compile error: ${e.message} in ${filepath}`);
    callback({ message: e.message, name: `${filepath} compile error` });
  }
}
