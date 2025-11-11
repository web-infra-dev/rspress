import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  lang: 'zh',
  themeConfig: {
    darkMode: false,
    localeRedirect: 'never',
    locales: [
      {
        lang: 'zh',
        title: '一个很棒的项目',
        description: '一个很棒的项目描述',
        label: '简体中文',
      },
      {
        lang: 'en',
        title: 'A awesome project',
        description: 'A awesome project description',
        label: 'English',
      },
      {
        lang: 'en_US',
        title: 'A awesome project',
        description: 'A awesome project description',
        label: 'EN_US',
      },
    ],
  },
  i18nSource(source) {
    source['config'] = {
      zh: '配置-文件',
      en: 'Configuration-file',
    };
    source['Foo'] = {
      zh: '被配置修改',
      en: 'Modified by configuration',
    };

    for (const key of Object.keys(source)) {
      source[key]['en_US'] = source[key]['en'];
    }
    return source;
  },
  plugins: [
    {
      name: 'i18n-source-text',
      i18nSource(source) {
        source['config-plugin'] = {
          zh: '配置-插件',
          en: 'Configuration-plugin',
        };
        source['Foo'] = {
          zh: '被插件修改',
          en: 'Modified by plugin',
        };
        return source;
      },
    },
  ],
});
