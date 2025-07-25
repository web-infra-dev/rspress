import { describe, it } from 'vitest';
import { compile } from '../processor';

describe('mdx', () => {
  it('basic', async () => {
    const result = await compile({
      source: `
![alt1](./test3.jpg)

<img src="./test4.png" alt="alt2" />
`,

      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toMatchSnapshot();
  });
});
