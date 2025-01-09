import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type RspressPlugin, normalizePosixPath } from '@rspress/shared';
import { remarkPluginContainer } from './remarkPlugin';

const __dirname = normalizePosixPath(
  path.dirname(fileURLToPath(import.meta.url)),
);

export function pluginContainerSyntax(): RspressPlugin {
  return {
    name: '@rspress/plugin-container-syntax',
    markdown: {
      remarkPlugins: [remarkPluginContainer],
    },
    globalStyles: path.posix.join(__dirname, '../container.css'),
  };
}
