import path from 'node:path';
import { createProcessor } from '@mdx-js/mdx';
import type { Rspack } from '@rsbuild/core';
import type { FrontMatterMeta, Header, UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { extractTextAndId, loadFrontMatter } from '@rspress/shared/node-utils';

import type { PluginDriver } from '../PluginDriver';
import type { RouteService } from '../route/RouteService';
import {
  applyReplaceRules,
  escapeMarkdownHeadingIds,
  normalizePath,
} from '../utils';
import { createMDXOptions } from './options';
import { checkLinks } from './remarkPlugins/checkDeadLink';
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

export default async function mdxLoader(
  this: Rspack.LoaderContext<LoaderOptions>,
  source: string,
) {
  this.cacheable(true);
  const callback = this.async();

  const options = this.getOptions();
  const filepath = this.resourcePath;
  const { config, docDirectory, checkDeadLinks, routeService, pluginDriver } =
    options;

  // Separate frontmatter and content in MDX source
  const { frontmatter, emptyLinesSource } = loadFrontMatter(
    source,
    filepath,
    docDirectory,
    true,
  );

  // For loader error stack, so we use the source with frontmatter @see https://github.com/web-infra-dev/rspress/issues/2010
  const replacedSource = applyReplaceRules(
    emptyLinesSource,
    config.replaceRules,
  );

  // Support custom id like `#hello world {#custom-id}`.
  // TODO > issue: `#hello world {#custom-id}` will also be replaced.
  const preprocessedContent = escapeMarkdownHeadingIds(replacedSource);

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
    let pageMeta: PageMeta = {
      title: '',
      toc: [] as TocItem[],
      headingTitle: '',
    };

    const frontmatterTitle = extractTextAndId(frontmatter.title)[0];

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
      const headingTitle = extractTextAndId(compilationMeta.title)[0];
      pageMeta = {
        ...compilationMeta,
        title: frontmatterTitle || headingTitle,
        headingTitle,
        frontmatter,
      } as PageMeta;
    } else {
      const { compile } = await import('@rspress/mdx-rs');
      const { toc, links, title, code } = await compile({
        value: preprocessedContent,
        filepath,
        root: docDirectory,
        development: process.env.NODE_ENV !== 'production',
      });

      compileResult = code;
      const headingTitle = extractTextAndId(title)[0];
      pageMeta = {
        toc,
        title: frontmatterTitle || headingTitle,
        headingTitle,
        frontmatter,
      };
      // We should check dead links in mdx-rs mode
      if (checkDeadLinks) {
        checkLinks(links, filepath, docDirectory, routeService);
      }
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
