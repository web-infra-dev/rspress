import path from 'node:path';
import type { RspressPlugin } from '@rspress/shared';

interface Options {
  selector?: string;
}

export function pluginMediumZoom(options: Options = {}): RspressPlugin {
  return {
    name: '@rspress/plugin-algolia',
    globalUIComponents: [
      [path.join(__dirname, '../static/MediumZoom.tsx'), options],
    ],
  };
}
