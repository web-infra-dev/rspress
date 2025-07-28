import { describe, it } from 'vitest';
import { compile } from '../processor';

describe('mdx', () => {
  it('basic', async () => {
    const result = await compile({
      source: `
[link1](./test1.md)

{/* jsx link will not be transformed */}

<a href="./test2">link2</a>
`,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: {},
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toMatchSnapshot();
  });
});
