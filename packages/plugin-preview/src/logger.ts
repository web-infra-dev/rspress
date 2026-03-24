import picocolors from 'picocolors';

const prefix = picocolors.gray('[@rspress/plugin-preview]');

export const pluginLogger = {
  info(message: string) {
    console.info(`${prefix} ${message}`);
  },
  warn(message: string) {
    console.warn(`${prefix} ${message}`);
  },
  error(message: string) {
    console.error(`${prefix} ${message}`);
  },
};
