import path from 'node:path';
import { type ProcessorOptions, nodeTypes } from '@mdx-js/mdx';
import type { UserConfig } from '@rspress/shared';
import rehypePluginExternalLinks from 'rehype-external-links';
import rehypeRaw from 'rehype-raw';
import remarkGFM from 'remark-gfm';

import type { PluggableList } from 'unified';
import { rehypeHeaderAnchor } from './rehypePlugins/headerAnchor';
import { remarkBuiltin } from './remarkPlugins/builtin';
import { remarkCheckDeadLinks } from './remarkPlugins/checkDeadLink';
import { remarkPluginNormalizeLink } from './remarkPlugins/normalizeLink';
import { remarkPluginToc } from './remarkPlugins/toc';

import type { PluginDriver } from '../PluginDriver';
import type { RouteService } from '../route/RouteService';
import { rehypeCodeMeta } from './rehypePlugins/codeMeta';

export async function createMDXOptions(
  docDirectory: string,
  config: UserConfig,
  checkDeadLinks: boolean,
  routeService: RouteService,
  filepath: string,
  pluginDriver: PluginDriver,
): Promise<ProcessorOptions> {
  const format = path.extname(filepath).slice(1) as 'mdx' | 'md';
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
    format,
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
      ...(format === 'md'
        ? [
            // make the code node compatible with `rehype-raw` which will remove `node.data` unconditionally
            rehypeCodeMeta,
            // why adding rehype-raw?
            // This is what permits to embed HTML elements with format 'md'
            // See https://github.com/facebook/docusaurus/pull/8960
            // See https://github.com/mdx-js/mdx/pull/2295#issuecomment-1540085960
            [rehypeRaw, { passThrough: nodeTypes }],
          ]
        : []),
      [
        rehypePluginExternalLinks,
        {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      ],
      ...rehypePluginsFromConfig,
      ...rehypePluginsFromPlugins,
    ] as PluggableList,
  };
}
