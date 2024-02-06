import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { RspressPlugin } from '@rspress/shared';
import { tailwindConfig } from '../../tailwind.config';

const require = createRequire(import.meta.url);
const RootDir = fileURLToPath(new URL('../..', import.meta.url).href);

/**
 * @internal it is for debug changes on `theme-default` with other internal projects like `document`.
 */
export function SourceBuildPlugin(): RspressPlugin {
  return {
    name: 'theme-default:source-build',
    builderConfig: {
      source: {
        alias: {
          'rspress/theme': path.resolve(RootDir, './src'),
        },
      },
      tools: {
        postcss: (_, { addPlugins }) => {
          addPlugins(
            require('tailwindcss')({
              config: {
                ...tailwindConfig,
                content: tailwindConfig.content.map(item =>
                  path.resolve(RootDir, item),
                ),
              },
            }),
          );
        },
      },
    },
  };
}
