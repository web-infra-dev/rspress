import {
  type RouteService,
  remarkMdxToMd,
  remarkPluginNormalizeLink,
} from '@rspress/core';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import type { VFile } from 'vfile';

function mdxToMd(
  content: string,
  filepath: string,
  docDirectory: string,
  routeService?: RouteService,
): Promise<VFile> {
  return unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkMdxToMd)
    .use(remarkPluginNormalizeLink, {
      cleanUrls: '.md',
      root: docDirectory,
      routeService,
    } satisfies Parameters<typeof remarkPluginNormalizeLink>[0])
    .use(remarkStringify)
    .process({
      value: content,
      path: filepath,
    });
}

export { mdxToMd };
