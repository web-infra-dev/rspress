import config from './rspress.config';
export default { ...config, search: false as const, outDir: 'dist-no-search' };
