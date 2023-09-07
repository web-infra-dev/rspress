import path from 'path';
import type { RspressPlugin } from '@rspress/shared';

const annotationComponent = path.resolve(__dirname, '../static/index.tsx');

export function pluginAnnotation(): RspressPlugin {
  return {
    name: '@modern-js/doc-plugin-annotation',
    globalUIComponents: [annotationComponent],
  };
}
