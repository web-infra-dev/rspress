import path from 'node:path';
import type { ProcessorOptions } from '@mdx-js/mdx';
import type { UserConfig } from '@rspress/shared';
import rehypePluginExternalLinks from 'rehype-external-links';
import remarkGFM from 'remark-gfm';

import type { PluggableList } from 'unified';
import { rehypePluginCodeMeta } from './rehypePlugins/codeMeta';
import { rehypeHeaderAnchor } from './rehypePlugins/headerAnchor';
import { remarkBuiltin } from './remarkPlugins/builtin';
import { remarkCheckDeadLinks } from './remarkPlugins/checkDeadLink';
import { remarkPluginNormalizeLink } from './remarkPlugins/normalizeLink';
import { remarkPluginToc } from './remarkPlugins/toc';

import type { PluginDriver } from '../PluginDriver';
import type { RouteService } from '../route/RouteService';

export async function createMDXOptions(
  docDirectory: string,
  config: UserConfig,
  checkDeadLinks: boolean,
  routeService: RouteService,
  filepath: string,
  pluginDriver: PluginDriver,
): Promise<ProcessorOptions> {
  const cleanUrls = config?.route?.cleanUrls ?? false;
  const {
    remarkPlugins: remarkPluginsFromConfig = [],
    rehypePlugins: rehypePluginsFromConfig = [],
    globalComponents: globalComponentsFromConfig = [],
  } = config?.markdown || {};
  const rspressPlugins = pluginDriver.getPlugins();
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
  return {
    providerImportSource: '@mdx-js/react',
    format: path.extname(filepath).slice(1) as 'mdx' | 'md',
    remarkPlugins: [
      remarkGFM,
      remarkPluginToc,
      [
        remarkPluginNormalizeLink,
        {
          cleanUrls,
          root: docDirectory,
          routeService,
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
      rehypeHeaderAnchor,
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
