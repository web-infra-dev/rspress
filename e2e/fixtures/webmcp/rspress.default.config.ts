import config from './rspress.config';

export default {
  ...config,
  webMcp: undefined,
  llms: false,
  search: false as const,
  themeDir: undefined,
  route: { ...config.route, cleanUrls: false },
  outDir: 'dist-default',
};
