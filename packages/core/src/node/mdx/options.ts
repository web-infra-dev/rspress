import path from 'path';
import remarkGFM from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutoLink from 'rehype-autolink-headings';
import { Options } from '@mdx-js/loader';
import { UserConfig } from '@rspress/shared';
import { PluggableList } from 'unified';
import rehypePluginExternalLinks from 'rehype-external-links';
import { remarkPluginContainer } from '@rspress/remark-container';
import type { RouteService } from '../route/RouteService';
import { remarkPluginToc } from './remarkPlugins/toc';
import { rehypePluginCodeMeta } from './rehypePlugins/codeMeta';
import { remarkPluginNormalizeLink } from './remarkPlugins/normalizeLink';
import { remarkCheckDeadLinks } from './remarkPlugins/checkDeadLink';
import { remarkBuiltin } from './remarkPlugins/builtin';

export async function createMDXOptions(
  docDirectory: string,
  config: UserConfig,
  checkDeadLinks: boolean,
  routeService: RouteService,
  filepath: string,
): Promise<Options> {
  const {
    remarkPlugins: remarkPluginsFromConfig = [],
    rehypePlugins: rehypePluginsFromConfig = [],
    globalComponents: globalComponentsFromConfig = [],
  } = config?.markdown || {};
  const rspressPlugins = config?.plugins || [];
  const remarkPluginsFromPlugins = rspressPlugins.flatMap(
    plugin => plugin.markdown?.remarkPlugins || [],
  ) as PluggableList;
  const rehypePluginsFromPlugins = rspressPlugins.flatMap(
    plugin => plugin.markdown?.rehypePlugins || [],
  ) as PluggableList;
  const globalComponents = [
    ...rspressPlugins.flatMap(
      plugin => plugin.markdown?.globalComponents || [],
    ),
    ...globalComponentsFromConfig,
  ];
  const defaultLang = config?.lang || '';
  return {
    providerImportSource: '@mdx-js/react',
    format: path.extname(filepath).slice(1) as 'mdx' | 'md',
    remarkPlugins: [
      remarkPluginContainer,
      remarkGFM,
      remarkPluginToc,
      [
        remarkPluginNormalizeLink,
        {
          base: config?.base || '',
          defaultLang,
          root: docDirectory,
        },
      ],
      checkDeadLinks && [
        remarkCheckDeadLinks,
        {
          root: docDirectory,
          base: config?.base || '',
          routeService,
        },
      ],
      globalComponents.length && [
        remarkBuiltin,
        {
          globalComponents,
        },
      ],
      ...remarkPluginsFromConfig,
      ...remarkPluginsFromPlugins,
    ].filter(Boolean) as PluggableList,
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutoLink,
        {
          properties: {
            class: 'header-anchor',
            ariaHidden: 'true',
          },
          content: {
            type: 'text',
            value: '#',
          },
        },
      ],
      rehypePluginCodeMeta,
      [
        rehypePluginExternalLinks,
        {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      ],
      ...rehypePluginsFromConfig,
      ...rehypePluginsFromPlugins,
    ],
  };
}
