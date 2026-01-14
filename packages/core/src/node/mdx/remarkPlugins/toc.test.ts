import { describe, expect, test } from '@rstest/core';
import type { Root as MdastRoot } from 'mdast';
import { compile } from '../processor';
import { parseToc } from './toc';

describe('toc', async () => {
  const process = (source: string) => {
    return compile({
      source,

      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
  };

  test('basic link in heading', async () => {
    const result = await process(`
import { Link } from '@theme';

# link

## this is link [rsbuild](https://rsbuild.rs)

## this is link <Link href="https://rsbuild.rs" />

## this is bold link [**rsbuild**](https://rsbuild.rs)

## this is code link [\`rsbuild\`](https://rsbuild.rs)

## this is bold code link [**\`rsbuild\`**](https://rsbuild.rs)
`);
    expect(result).toMatchSnapshot();
  });
});

describe('parseToc', () => {
  test('extracts title from h1', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [{ type: 'text', value: 'My Title' }],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.title).toBe('My Title');
    expect(result.toc).toEqual([]);
  });

  test('extracts h2-h4 headings into toc', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [{ type: 'text', value: 'Title' }],
        },
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Section 1' }],
        },
        {
          type: 'heading',
          depth: 3,
          children: [{ type: 'text', value: 'Subsection 1.1' }],
        },
        {
          type: 'heading',
          depth: 4,
          children: [{ type: 'text', value: 'Subsection 1.1.1' }],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.title).toBe('Title');
    expect(result.toc).toEqual([
      { id: 'section-1', text: 'Section 1', depth: 2 },
      { id: 'subsection-11', text: 'Subsection 1.1', depth: 3 },
      { id: 'subsection-111', text: 'Subsection 1.1.1', depth: 4 },
    ]);
  });

  test('ignores h5 and deeper headings', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 5,
          children: [{ type: 'text', value: 'Too Deep' }],
        },
        {
          type: 'heading',
          depth: 6,
          children: [{ type: 'text', value: 'Even Deeper' }],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.title).toBe('');
    expect(result.toc).toEqual([]);
  });

  test('handles link in heading', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [
            { type: 'text', value: 'Check out ' },
            {
              type: 'link',
              url: 'https://example.com',
              children: [{ type: 'text', value: 'this link' }],
            },
          ],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.toc).toEqual([
      { id: 'check-out-this-link', text: 'Check out this link', depth: 2 },
    ]);
  });

  test('handles bold link in heading', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [
            { type: 'text', value: 'this is bold link ' },
            {
              type: 'link',
              url: 'https://rsbuild.rs',
              children: [
                {
                  type: 'strong',
                  children: [{ type: 'text', value: 'rsbuild' }],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.toc).toEqual([
      {
        id: 'this-is-bold-link-rsbuild',
        text: 'this is bold link **rsbuild**',
        depth: 2,
      },
    ]);
  });

  test('handles code link in heading', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [
            { type: 'text', value: 'this is code link ' },
            {
              type: 'link',
              url: 'https://rsbuild.rs',
              children: [{ type: 'inlineCode', value: 'rsbuild' }],
            },
          ],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.toc).toEqual([
      {
        id: 'this-is-code-link-rsbuild',
        text: 'this is code link `rsbuild`',
        depth: 2,
      },
    ]);
  });

  test('handles bold code link in heading', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [
            { type: 'text', value: 'this is bold code link ' },
            {
              type: 'link',
              url: 'https://rsbuild.rs',
              children: [
                {
                  type: 'strong',
                  children: [{ type: 'inlineCode', value: 'rsbuild' }],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.toc).toEqual([
      {
        id: 'this-is-bold-code-link-rsbuild',
        text: 'this is bold code link **`rsbuild`**',
        depth: 2,
      },
    ]);
  });

  test('handles inline code in heading', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [
            { type: 'text', value: 'Using ' },
            { type: 'inlineCode', value: 'useState' },
            { type: 'text', value: ' hook' },
          ],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.toc).toEqual([
      // cspell:disable-next-line
      { id: 'using-usestate-hook', text: 'Using `useState` hook', depth: 2 },
    ]);
  });

  test('handles emphasis in heading', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [
            { type: 'text', value: 'This is ' },
            {
              type: 'emphasis',
              children: [{ type: 'text', value: 'important' }],
            },
          ],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.toc).toEqual([
      { id: 'this-is-important', text: 'This is *important*', depth: 2 },
    ]);
  });

  test('handles delete (strikethrough) in heading', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [
            { type: 'text', value: 'This is ' },
            {
              type: 'delete',
              children: [{ type: 'text', value: 'deprecated' }],
            },
          ],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.toc).toEqual([
      { id: 'this-is-deprecated', text: 'This is ~~deprecated~~', depth: 2 },
    ]);
  });

  test('handles custom id in heading', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'My Section {#custom-id}' }],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.toc).toEqual([
      { id: 'custom-id', text: 'My Section', depth: 2 },
    ]);
  });

  test('handles deeply nested formatting in link', () => {
    const tree: MdastRoot = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [
            { type: 'text', value: 'Check ' },
            {
              type: 'link',
              url: 'https://example.com',
              children: [
                {
                  type: 'strong',
                  children: [
                    {
                      type: 'emphasis',
                      children: [{ type: 'text', value: 'nested' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = parseToc(tree);
    expect(result.toc).toEqual([
      { id: 'check-nested', text: 'Check ***nested***', depth: 2 },
    ]);
  });
});
