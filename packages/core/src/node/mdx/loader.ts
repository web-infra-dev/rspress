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
