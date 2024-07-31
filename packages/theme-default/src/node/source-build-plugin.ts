import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import type { RspressPlugin } from '@rspress/shared';
import { tailwindConfig } from '../../tailwind.config';

const require = createRequire(import.meta.url);
const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url).href);

/**
 * @internal it is for debug changes on `theme-default` with other internal projects like `document`.
 */
export function SourceBuildPlugin(): RspressPlugin {
  return {
    name: 'theme-default:source-build',
    builderConfig: {
      source: {
        alias: {
          'rspress/theme': path.resolve(ROOT_DIR, './src'),
        },
      },
      tools: {
        postcss: (_, { addPlugins }) => {
          try {
            addPlugins(
              require('tailwindcss')({
                config: {
                  ...tailwindConfig,
                  content: tailwindConfig.content.map(item =>
                    path.resolve(ROOT_DIR, item),
                  ),
                },
              }),
            );
          } catch (e) {
            // if require tailwindcss failed, skip
          }
        },
      },
    },
  };
}
