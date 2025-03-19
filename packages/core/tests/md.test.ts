import path from 'node:path';
import rehypeStringify from 'rehype-stringify';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { describe, expect, test } from 'vitest';
import { remarkPluginNormalizeLink } from '../src/node/mdx/remarkPlugins/normalizeLink';

describe('Markdown compile cases', () => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify);

  test('Compile title', async () => {
    const mdContent = '# 123';
    const result = processor.processSync(mdContent);
    expect(result.value).toMatchInlineSnapshot('"<h1>123</h1>"');
  });

  describe('remarkPluginNormalizeLink', () => {
    it('should just work', () => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkMdx)
        .use(remarkPluginNormalizeLink, {
          root: process.cwd(),
          cleanUrls: false,
        })
        .use(remarkStringify);

      const result = processor.processSync(
        new VFile({
          value: `
[link1](./test1.md)

{/* jsx link will not be transformed */}

<a href="./test2">link2</a>

![alt1](./test3.jpg)

<img src="./test4.png" alt="alt2" />
          `.trim(),
          path: path.resolve('test.mdx'),
        }),
      );
      expect(result.value).matchSnapshot();
    });
  });
});
