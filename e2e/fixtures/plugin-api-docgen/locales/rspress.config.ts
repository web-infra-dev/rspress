import assert from 'node:assert/strict';
import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginApiDocgen } from '@rspress/plugin-api-docgen';

let i18nSourceCalls = 0;

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  route: {
    localeRedirect: 'never',
  },
  lang: 'en',
  i18nSource: {
    apiDocgenProperty: {
      zh: '组件属性 | 名称\n字段',
    },
    apiDocgenRequired: {
      zh: '必须配置',
    },
  },
  plugins: [
    pluginApiDocgen({
      entries: {
        button: './src/Button.ts',
      },
      apiParseTool: 'react-docgen-typescript',
    }),
    {
      name: 'i18n-pipeline-probe',
      i18nSource(source) {
        i18nSourceCalls++;
        return source;
      },
      afterBuild(_, isProd) {
        if (isProd) {
          assert.equal(i18nSourceCalls, 1);
        }
      },
    },
  ],
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
    { lang: 'ja', label: 'Japanese' },
    { lang: 'ko', label: 'Korean' },
    { lang: 'ru', label: 'Russian' },
    { lang: 'ta', label: 'Tamil' },
    { lang: 'fr', label: 'French' },
  ],
});
