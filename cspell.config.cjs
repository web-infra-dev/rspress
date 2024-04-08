const { banWords } = require('cspell-ban-words');

module.exports = {
  version: '0.2',
  language: 'en',
  files: ['**/*.{ts,tsx,js,jsx,md,mdx}'],
  enableFiletypes: ['mdx'],
  ignoreRegExpList: [
    // ignore markdown anchors such as [fooBar](#foobar)
    '#.*?\\)',
  ],
  ignorePaths: [
    'dist',
    'dist-*',
    'compiled',
    'coverage',
    'doc_build',
    'playwright-report',
    'node_modules',
    'pnpm-lock.yaml',
  ],
  flagWords: banWords,
  dictionaries: ['dictionary'],
  dictionaryDefinitions: [
    {
      name: 'dictionary',
      path: './scripts/dictionary.txt',
      addWords: true,
    },
  ],
};
