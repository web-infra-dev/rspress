import { fs, vol } from 'memfs';

import { describe, expect, it, vi } from 'vitest';
import { compile } from '../processor';

vi.mock('node:fs/promises', () => {
  return { readFile: fs.promises.readFile };
});

vi.mock('node:process', () => {
  return { cwd: () => '/usr/rspress-project' };
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

      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toMatchSnapshot();
  });

  it('should support absolute path with <root>/ prefix', async () => {
    vol.fromJSON({
      '/usr/rspress-project/src/components/Button.tsx': `export const Button = () => {
  return <button>Click me</button>;
}
`,
    });
    const result = await compile({
      source: `
\`\`\`tsx file="<root>/src/components/Button.tsx"
\`\`\`
`,

      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/guide/components.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    // The result should contain the transformed code with the Button component
    expect(result).toContain('Button');
    expect(result).toContain('button');
    expect(result).toContain('Click me');
  });

  it('should support nested absolute paths with <root>/ prefix', async () => {
    vol.fromJSON({
      '/usr/rspress-project/examples/code/demo.js': `const demo = 'test';
console.log(demo);
`,
    });
    const result = await compile({
      source: `
\`\`\`js file="<root>/examples/code/demo.js"
\`\`\`
`,

      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/api/reference.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    // The result should contain the transformed code with demo variable
    expect(result).toContain('demo');
    expect(result).toContain('test');
    expect(result).toContain('console');
  });

  it('should throw error when absolute path file does not exist', async () => {
    vol.fromJSON({});
    await expect(
      compile({
        source: `
\`\`\`tsx file="<root>/non-existent.tsx"
\`\`\`
`,
        docDirectory: '/usr/rspress-project/docs',
        filepath: '/usr/rspress-project/docs/index.mdx',
        config: null,
        pluginDriver: null,
        routeService: null,
      }),
    ).rejects.toThrow(/does not exist/);
  });

  it('should throw error when content is not empty with absolute path', async () => {
    vol.fromJSON({
      '/usr/rspress-project/test.tsx': 'const test = 1;',
    });
    await expect(
      compile({
        source: `
\`\`\`tsx file="<root>/test.tsx"
some content
\`\`\`
`,
        docDirectory: '/usr/rspress-project/docs',
        filepath: '/usr/rspress-project/docs/index.mdx',
        config: null,
        pluginDriver: null,
        routeService: null,
      }),
    ).rejects.toThrow(/should be empty/);
  });
});
