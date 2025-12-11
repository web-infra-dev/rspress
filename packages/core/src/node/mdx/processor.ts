import path from 'node:path';
import { createProcessor } from '@mdx-js/mdx';
import type { Rspack } from '@rsbuild/core';
import type { Header, UserConfig } from '@rspress/shared';
import { extractTextAndId, loadFrontMatter } from '@rspress/shared/node-utils';

import type { PluginDriver } from '../PluginDriver';
import type { RouteService } from '../route/RouteService';
import {
  applyReplaceRules,
  createError,
  escapeMarkdownHeadingIds,
  normalizePath,
} from '../utils';
import { createMDXOptions } from './options';
import type { TocItem } from './remarkPlugins/toc';
import type { PageMeta } from './types';

interface CompileOptions {
  source: string;
  filepath: string;

  // assume that the below instances are singleton, it will not change.
  docDirectory: string;
  config: UserConfig | null;
  routeService: RouteService | null;
  pluginDriver: PluginDriver | null;

  addDependency?: Rspack.LoaderContext['addDependency']; // remarkFileCodeBlock hmr

  /**
   * @default false
   */
  isSsgMd?: boolean;
}

async function compile(options: CompileOptions): Promise<string> {
  const {
    source,
    filepath,
    docDirectory,
    config,
    routeService,
    pluginDriver,
    addDependency,
    isSsgMd = false,
  } = options;

  const mdxOptions = await createMDXOptions({
    config,
    docDirectory,
    filepath,
    pluginDriver,
    routeService,
    addDependency,
    isSsgMd,
  });
  // Separate frontmatter and content in MDX source
  const { frontmatter, emptyLinesSource } = loadFrontMatter(
    source,
    filepath,
    docDirectory,
    true,
  );

  // For loader error stack, so we use the source with frontmatter @see https://github.com/web-infra-dev/rspress/issues/2010
  const { replaceRules } = config ?? {};
  const replacedSource = applyReplaceRules(emptyLinesSource, replaceRules);

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

    const result = `${compileResult}

MDXContent.__RSPRESS_PAGE_META = {};
MDXContent.__RSPRESS_PAGE_META["${encodeURIComponent(
      normalizePath(path.relative(docDirectory, filepath)),
    )}"] = ${JSON.stringify(pageMeta)};
`;
    return result;
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw e;
    }
    throw createError(`MDX compile error: ${e} in ${filepath}`);
  }
}

const cache = new Map<string, Promise<string>>();

async function compileWithCrossCompilerCache(
  options: CompileOptions,
): Promise<string> {
  const filepath = options.filepath;
  const task = cache.get(filepath);
  if (task) {
    // only for web and node, one write and one read
    // free the memory after one read
    cache.delete(filepath);
    return task;
  }

  const promise = compile(options);
  cache.set(filepath, promise);
  return promise;
}

export { compile, compileWithCrossCompilerCache };
