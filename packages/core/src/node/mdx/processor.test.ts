import { describe, it } from 'vitest';
import { compile } from './processor';

describe('mdx', () => {
  it('basic', async () => {
    const result = await compile({
      source: `
# Hello World
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

  it('should render inline code in title', async () => {
    const result = await compile({
      source: `
# Hello World \`inline code\`
`,
      checkDeadLinks: false,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/inline-code.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toMatchSnapshot();
  });

  it('should allow custom id', async () => {
    const result = await compile({
      source: `
# Hello World \`inline code\` \\{#custom-id}
`,
      checkDeadLinks: false,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/inline-code.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toMatchSnapshot();
  });
});
