import type { Header } from '@rspress/shared';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import type { RouteService } from '../route/RouteService';
import { rehypeHeaderAnchor } from './rehypePlugins/headerAnchor';
import { remarkPluginNormalizeLink } from './remarkPlugins/normalizeLink';
import { remarkPluginToc } from './remarkPlugins/toc';

async function compile(options: {
  source: string;
  root: string;
  routeService: RouteService;
}): Promise<{
  toc: Header[];
  title: string;
  html: string;
}> {
  const { source, root, routeService } = options;

  const processor = unified()
    .use(remarkParse)
    .use(remarkPluginToc)
    .use(remarkPluginNormalizeLink, {
      cleanUrls: true,
      root,
      routeService,
    })
    .use(remarkRehype)
    .use(rehypeHeaderAnchor)
    .use(rehypeStringify as any);

  processor.data('pageMeta' as any, { toc: [], title: '' });
  const html = (await processor.process(source)).toString();
  const compilationMeta = processor.data('pageMeta' as any) as {
    toc: Header[];
    title: string;
  };

  return {
    ...compilationMeta,
    html,
  };
}

export { compile };
