import path from 'path';
import type { RspressPlugin } from '@rspress/shared';
import { remarkPluginContainer } from './remarkPlugin';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export function pluginContainerSyntax(): RspressPlugin {
  return {
    name: '@rspress/plugin-container-syntax',
    markdown: {
      remarkPlugins: [remarkPluginContainer],
    },
    globalStyles: path.join(__dirname, '../container.css'),
  };
}
