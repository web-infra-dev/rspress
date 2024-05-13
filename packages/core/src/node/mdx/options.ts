import path from 'path';
import remarkGFM from 'remark-gfm';
import rehypePluginExternalLinks from 'rehype-external-links';
import { PluggableList } from 'unified';
import { Options } from '@mdx-js/loader';
import { UserConfig } from '@rspress/shared';
import { remarkPluginToc } from './remarkPlugins/toc';
import { remarkBuiltin } from './remarkPlugins/builtin';
import { rehypePluginCodeMeta } from './rehypePlugins/codeMeta';
import { rehypeHeaderAnchor } from './rehypePlugins/headerAnchor';
import { remarkCheckDeadLinks } from './remarkPlugins/checkDeadLink';
import { remarkPluginNormalizeLink } from './remarkPlugins/normalizeLink';

import type { PluginDriver } from '../PluginDriver';
import type { RouteService } from '../route/RouteService';

export async function createMDXOptions(
  docDirectory: string,
  config: UserConfig,
  checkDeadLinks: boolean,
  routeService: RouteService,
  filepath: string,
  pluginDriver: PluginDriver,
): Promise<Options> {
  const cleanUrls = Boolean(config?.route?.cleanUrls);
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
  const defaultLang = config?.lang || '';
  return {
    providerImportSource: '@mdx-js/react',
    format: path.extname(filepath).slice(1) as 'mdx' | 'md',
    remarkPlugins: [
      remarkGFM,
      remarkPluginToc,
      [
        remarkPluginNormalizeLink,
        {
          base: config?.base || '',
          cleanUrls,
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
