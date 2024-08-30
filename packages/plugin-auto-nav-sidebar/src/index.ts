import path from 'node:path';
import { type RspressPlugin, addTrailingSlash } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { combineWalkResult } from './utils';
import { walk } from './walk';

// Scan all the directories and files in the work directory(such as `docs`), and then generate the nav and sidebar configuration according to the directory structure.
// We will do as follows:
// 1. scan the directory structure, and extract all the `_meta.json` files.
// The `_meta.json` files will have two types:
// - For the `_meta.json` directly in the work directory, it will be used as the nav configuration.
// - For the `_meta.json` in the subdirectory, it will be used as the sidebar configuration.
// First, for the `_meta.json` directly in the work directory, the json content will have the following structure(see `NavMeta`):
// ```ts
// export type NavMeta = NavItem[];
// export type NavItem = NavItemWithLink | NavItemWithChildren;

// export type NavItemWithLink = {
//   text: string;
//   link: string;
//   activeMatch?: string;
//   position?: 'left' | 'right';
// };

// export type NavItemChildren = {
//   text: string;
//   items: NavItemWithLink[];
// };
// ```
// The `NavItemWithLink` will be used as the nav item, and the `NavItemChildren` will be used as the nav item with children.
// Second, for the `_meta.json` in the subdirectory, the json content will have the following structure(see `SideMeta`):
// ```ts
// export type SideMetaItem =
//   | string
//   | {
//       type: 'file' | 'directory';
//       name: string;
//       // Use the h1 title as the sidebar title by default
//       label?: string;
//       collapsible?: boolean;
//       collapsed?: boolean;
//     };

// export type SideMeta = SideMetaItem[];
// ```
// The `SideMetaItem` can be the following types:
// - string: the file name, such as `home.md`, can also remove the extension name, such as `home`.
// - object: you can specify the `type` and `name` of the file or directory, and the `label` of the sidebar item, and whether the sidebar item is `collapsible` and `collapsed`.

// 2. generate the nav and sidebar configuration according to the `_meta.json` files.

// As you can see, every `_meta.json` file will have a corresponding file or directory, so we can get the link info from the file or directory(relative to the work directory).So we can generate the nav and sidebar config based on link info and _meta.json content.

// For nav config, we don't need to do anything, just use the `_meta.json` content as the nav config.
// For sidebar config, we need to transform every item of the array config:
// - string: we transform the string to a object with `text` and `link` property.Such as:
// ```ts
// {
//   text: 'home',
//   link: '/home'
// }
// ```
// - object: in this case, we will take account of the `type` property:
//   - file: we will transform the object to a object with `text` and `link` property.Such as:
//   ```ts
//   {
//     text: 'home',
//     link: '/home'
//   }
//   ```
//   - directory: we will transform the object to a object with `text` and `items` property.

// There is the following file structure:
// ```
// docs
// ├── guide
// │   ├── home.md
// │   ├── advanced
// │   │    └── plugin.md
// │   └── _meta.json
// └── _meta.json
// ```
// The `_meta.json` in the work directory has the following content:
// ```json
// [
//   {
//     "text": "guide",
//     "link": "/guide"
//   }
// ]
// ```
// The `_meta.json` in the `guide` directory has the following content:
// ```json
// [
//   'home',
//   {
//     "type": "directory",
//     "name": "advanced",
//     "label": "advanced",
//     "collapsible": true,
//     "collapsed": false
//   }
// ]
// ```
// The `home.md` has the following content:
// ```md
// # home
// ```
// The `_meta.json` in the `advanced` directory has the following content:
// ```json
// [
//   {
//     "type": "file",
//     "name": "plugin",
//     "label": "plugin",
//     "collapsible": true,
//     "collapsed": false
//   }
// ]
// ```
// The `plugin.md` has the following content:
// ```md
// # plugin
// ```

// The generated nav config will be:
// ```json
// [
//   {
//     "text": "guide",
//     "link": "/guide"
//   }
// ]
// ```
// The generated sidebar config will be:
// ```json
// [
//   {
//     "text": "home",
//     "link": "/guide/home"
//   },
//   {
//     "text": "advanced",
//     "items": [
//       {
//         "text": "plugin",
//         "link": "/guide/advanced/plugin"
//       }
//     ]
//   }
// ]
// ```

function processLocales(
  langs: string[],
  versions: string[],
  root: string,
  defaultLang: string,
  defaultVersion: string,
  extensions: string[],
) {
  return Promise.all(
    langs.map(async lang => {
      const walks = versions.length
        ? await Promise.all(
            versions.map(version => {
              const routePrefix = addTrailingSlash(
                `${version === defaultVersion ? '' : `/${version}`}${
                  lang === defaultLang ? '' : `/${lang}`
                }`,
              );
              return walk(
                path.join(root, version, lang),
                routePrefix,
                root,
                extensions,
              );
            }),
          )
        : [
            await walk(
              path.join(root, lang),
              addTrailingSlash(lang === defaultLang ? '' : `/${lang}`),
              root,
              extensions,
            ),
          ];
      return combineWalkResult(walks, versions);
    }),
  );
}

const defaultExtensions = ['.mdx', '.md', '.tsx', '.jsx', '.ts', '.js'];

export function pluginAutoNavSidebar(): RspressPlugin {
  return {
    name: 'auto-nav-sidebar',
    async config(config) {
      config.themeConfig = config.themeConfig || {};
      config.themeConfig.locales =
        config.themeConfig.locales || config.locales || [];
      const langs = config.themeConfig.locales.map(locale => locale.lang);
      const hasLocales = langs.length > 0;
      const hasLang = Boolean(config.lang);
      const versions = config.multiVersion?.versions || [];
      const defaultLang = config.lang || '';
      const { default: defaultVersion = '' } = config.multiVersion || {};
      const { extensions = defaultExtensions } = config?.route || {};
      if (hasLocales) {
        const metaInfo = await processLocales(
          langs,
          versions,
          config.root!,
          defaultLang,
          defaultVersion,
          extensions,
        );
        config.themeConfig.locales = config.themeConfig.locales.map(
          (item, index) => ({
            ...item,
            ...metaInfo[index],
          }),
        );
      } else {
        if (hasLang) {
          logger.error(
            '`lang` is configured but `locales` not, ' +
              'thus `@rspress/plugin-auto-nav-sidebar` can not auto generate ' +
              'navbar level config correctly!\n' +
              'please check your config file',
          );
          return config;
        }
        const walks = versions.length
          ? await Promise.all(
              versions.map(version => {
                const routePrefix = addTrailingSlash(
                  version === defaultVersion ? '' : `/${version}`,
                );
                return walk(
                  path.join(config.root!, version),
                  routePrefix,
                  config.root!,
                  extensions,
                );
              }),
            )
          : [await walk(config.root!, '/', config.root!, extensions)];

        const combined = combineWalkResult(walks, versions);

        config.themeConfig = { ...config.themeConfig, ...combined };
      }

      return config;
    },
  };
}
