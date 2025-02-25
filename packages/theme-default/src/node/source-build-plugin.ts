import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RspressPlugin } from '@rspress/shared';
// @ts-ignore 'tailwind.config.ts' is not under 'rootDir'
import tailwindConfig from '../../tailwind.config';

const require = createRequire(import.meta.url);
const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url).href);

/**
 * @internal it is for debug changes on `theme-default` with other internal projects like `document`.
 */
export function SourceBuildPlugin(): RspressPlugin {
  return {
    name: 'theme-default:source-build',
    builderConfig: {
      resolve: {
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
          } catch (_e) {
            // if require tailwindcss failed, skip
          }
        },
      },
    },
  };
}
