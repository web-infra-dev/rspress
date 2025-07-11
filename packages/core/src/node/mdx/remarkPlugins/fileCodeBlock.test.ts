import { fs, vol } from 'memfs';

import { describe, expect, it, vi } from 'vitest';
import { compile } from '../processor';

vi.mock('node:fs/promises', () => {
  return { readFile: fs.promises.readFile };
});

describe('remarkFileCodeBlock', () => {
  it('basic', async () => {
    vol.fromJSON({
      '/usr/rspress-project/docs/_Demo.jsx': `export default () => {
  return <div>hello world</div>;
}
`,
    });
    const result = await compile({
      source: `
\`\`\`jsx file="./_Demo.jsx"
\`\`\`
`,
      checkDeadLinks: false,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toMatchSnapshot();
  });
});
