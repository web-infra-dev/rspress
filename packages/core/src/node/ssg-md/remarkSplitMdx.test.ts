// cspell:ignore abcdefmdx spress
import { compile, evaluate } from '@mdx-js/mdx';
import { describe, expect, it } from '@rstest/core';
import type { Root } from 'mdast';
import { createElement, type ReactNode } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToMarkdownString } from 'react-render-to-markdown';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { remarkSplitMdx, type RemarkSplitMdxOptions } from './remarkSplitMdx';

/**
 * Process MDX with custom remark plugin
 */
export async function processMdx(source: string): Promise<string> {
  // Compile MDX with our custom remark plugin
  const result = await compile(source, {
    remarkPlugins: [remarkSplitMdx],
    jsx: true,
  });

  // Get the compiled code - this is the original MDX output
  const code = String(result);

  return code;
}

describe('Markdown containing executable MDX', () => {
  const releaseLink =
    '[Lynx 4.2.0](https://github.com/lynx-family/lynx/releases/tag/4.2.0)';
  const Container = ({ children }: { children?: ReactNode }) => children;

  async function renderMdx(
    source: string,
    options: RemarkSplitMdxOptions = {},
  ) {
    const { default: Content } = await evaluate(
      `export const version = '4.2.0';\n\n${source}`,
      {
        ...jsxRuntime,
        remarkPlugins: [remarkGfm, [remarkSplitMdx, options]],
      },
    );
    return (
      await renderToMarkdownString(
        createElement(Content, {
          components: {
            ReleaseLink: () => releaseLink,
            Container,
            Inline: Container,
            Drop: () => 'unexpected rendered component',
            Keep: () => 'kept',
            span: () => 'unexpected span override',
            Download: () => createElement('div', null, 'Download LynxExplorer'),
            DownloadLink: () =>
              createElement(
                'div',
                null,
                createElement(
                  'a',
                  { href: 'https://example.com/download' },
                  'LynxExplorer',
                ),
              ),
            Paragraphs: () =>
              createElement(
                'div',
                null,
                createElement('p', null, 'First paragraph.'),
                createElement('p', null, 'Second paragraph.'),
              ),
            PlatformTabs: Object.assign(Container, { Tab: Container }),
          },
        }),
      )
    ).trim();
  }

  const inlineOutputs = [
    ['div', '<div id="download">Download LynxExplorer</div>'],
    ['component returning div', '<Download />'],
    ['fragment', '<><div>Download LynxExplorer</div></>'],
    ['expression', '{<div>Download LynxExplorer</div>}'],
    ['span control', '<span>Download LynxExplorer</span>'],
  ];
  const outputLocations = [
    ['root', '', ''],
    ['component container', '<Container>', '</Container>'],
    ['HTML container', '<div>', '</div>'],
  ];
  const parseMarkdown = (markdown: string) =>
    JSON.parse(
      JSON.stringify(
        unified().use(remarkParse).use(remarkGfm).parse(markdown),
        (key, value) => (key === 'position' ? undefined : value),
      ),
    );

  it.each(
    outputLocations.flatMap(([location, open, close]) =>
      inlineOutputs.map(([output, inline]) => ({
        location,
        open,
        close,
        output,
        inline,
      })),
    ),
  )(
    'keeps inline output inside its Markdown structure: %j',
    async ({ open, close, inline }) => {
      const markdown = await renderMdx(`${open}

Before ${inline}.

## ${inline}

2. **${inline}**

> **${inline}**

| Download | Version |
| --- | --- |
| **${inline}** | {version} |

${close}`);
      const expected = `Before Download LynxExplorer.

## Download LynxExplorer

2. **Download LynxExplorer**

> **Download LynxExplorer**

| Download | Version |
| --- | --- |
| **Download LynxExplorer** | 4.2.0 |`;
      // Reparse to verify strong nodes, ordered-list ownership, and table cells.
      expect(parseMarkdown(markdown)).toEqual(parseMarkdown(expected));
      expect(markdown).toContain('2. **Download LynxExplorer**');
    },
  );

  it.each(outputLocations)(
    'preserves links returned inside inline blocks in a %s',
    async (_location, open, close) => {
      const markdown = await renderMdx(`${open}

- **<DownloadLink />**.

| Download | Version |
| --- | --- |
| <DownloadLink /> | {version} |

${close}`);
      expect(parseMarkdown(markdown)).toEqual(
        parseMarkdown(`- **[LynxExplorer](https://example.com/download)**.

| Download | Version |
| --- | --- |
| [LynxExplorer](https://example.com/download) | 4.2.0 |`),
      );
    },
  );

  it.each(outputLocations)(
    'preserves flow output and paragraph boundaries in a %s',
    async (_location, open, close) => {
      const markdown = await renderMdx(`${open}

Before.

<Paragraphs />

After.

${close}`);
      expect(parseMarkdown(markdown)).toEqual(
        parseMarkdown(
          'Before.\n\nFirst paragraph.\n\nSecond paragraph.\n\nAfter.',
        ),
      );
      expect(markdown).toContain('First paragraph.\n\nSecond paragraph.');
    },
  );

  it.each([
    ['top level', '', ''],
    ['HTML container', '<div>', '</div>'],
    ['custom container', '<Container>', '</Container>'],
    ['fragment', '<>', '</>'],
    [
      'nested member component',
      '<Container>\n<PlatformTabs>\n<PlatformTabs.Tab>\n<div>',
      '</div>\n</PlatformTabs.Tab>\n</PlatformTabs>\n</Container>',
    ],
  ])('executes inline MDX in a %s', async (_name, open, close) => {
    const markdown = await renderMdx(
      `${open}\n\n下载 <ReleaseLink />，版本 {version}。\n\n${close}`,
    );
    expect(markdown).toBe(`下载 ${releaseLink}，版本 4.2.0。`);
  });

  it.each([
    ['paragraph', 'Download <ReleaseLink /> ({version}).'],
    ['heading', '## Download <ReleaseLink /> ({version}).'],
    ['list', '- Download <ReleaseLink /> ({version}).'],
    ['strong', '**<ReleaseLink /> ({version})**'],
    ['blockquote', '> Download <ReleaseLink /> ({version}).'],
    ['nested list', '- Release\n  - **<ReleaseLink />** (_{version}_).'],
    [
      'mixed depths',
      'Download <ReleaseLink /> and **<ReleaseLink /> ({version})**.',
    ],
    ['expression only', '> - Version **{version}**.'],
    ['heading starting with JSX', '## <ReleaseLink />'],
  ])('executes MDX in a root %s and a container', async (_name, source) => {
    const expected = source
      .replaceAll('<ReleaseLink />', releaseLink)
      .replaceAll('{version}', '4.2.0');
    const rootMarkdown = await renderMdx(source);
    const containerMarkdown = await renderMdx(
      `<Container>\n\n${source}\n\n</Container>`,
    );
    expect(rootMarkdown).toBe(containerMarkdown);
    expect(rootMarkdown).toBe(expected);
  });

  it('executes MDX in a root table and a container', async () => {
    const source =
      '| Download | Version |\n| --- | --- |\n| <ReleaseLink /> | {version} |';
    const markdown = await renderMdx(source);
    expect(markdown).toBe(
      await renderMdx(`<Container>\n\n${source}\n\n</Container>`),
    );
    // Compare cell structure independently of the serializer's table padding.
    const parse = (value: string) =>
      unified().use(remarkParse).use(remarkGfm).parse(value);
    const withoutPositions = (tree: unknown) =>
      JSON.parse(
        JSON.stringify(tree, (key, value) =>
          key === 'position' ? undefined : value,
        ),
      );
    expect(withoutPositions(parse(markdown))).toEqual(
      withoutPositions(
        parse(
          `| Download | Version |\n| --- | --- |\n| ${releaseLink} | 4.2.0 |`,
        ),
      ),
    );
  });

  it('preserves root block spacing around executable MDX', async () => {
    expect(
      await renderMdx(`## <ReleaseLink />

First {version}.

Second **<ReleaseLink />**.

- Download <ReleaseLink />.

> Version {version}.`),
    ).toBe(`## ${releaseLink}

First 4.2.0.

Second **${releaseLink}**.

- Download ${releaseLink}.

> Version 4.2.0.`);
  });

  it('keeps root code examples literal beside nested executable MDX', async () => {
    expect(
      await renderMdx(`Example: \`<ReleaseLink /> {version}\`.

\`\`\`mdx
<ReleaseLink /> {version}
\`\`\`

> Actual: **<ReleaseLink />** {version}.`),
    ).toBe(`Example: \`<ReleaseLink /> {version}\`.

\`\`\`mdx
<ReleaseLink /> {version}
\`\`\`

> Actual: **${releaseLink}** 4.2.0.`);
  });

  it('preserves Markdown formatting and paragraph spacing', async () => {
    const markdown = await renderMdx(`<Container>

First paragraph.

## Download <ReleaseLink />

Use **<ReleaseLink />** and _{version}_ with [release notes](https://example.com).

- Download <ReleaseLink />.
- Version {version}.

> Download <ReleaseLink />.

Last paragraph.

</Container>`);

    expect(markdown).toBe(`First paragraph.

## Download ${releaseLink}

Use **${releaseLink}** and _4.2.0_ with [release notes](https://example.com).

- Download ${releaseLink}.
- Version 4.2.0.

> Download ${releaseLink}.

Last paragraph.`);
  });

  it('keeps adjacent plain Markdown paragraphs separate', async () => {
    expect(
      await renderMdx(
        '<div>\n\nFirst paragraph.\n\nSecond paragraph.\n\n</div>',
      ),
    ).toBe('First paragraph.\n\nSecond paragraph.');
  });

  it('keeps code examples literal alongside executable MDX', async () => {
    const markdown = await renderMdx(`<div>

Example: \`<ReleaseLink /> {version}\`.

\`\`\`mdx
<ReleaseLink /> {version}
\`\`\`

Actual: <ReleaseLink /> {version}.

</div>`);

    expect(markdown).toBe(`Example: \`<ReleaseLink /> {version}\`.

\`\`\`mdx
<ReleaseLink /> {version}
\`\`\`

Actual: ${releaseLink} 4.2.0.`);
  });

  const inlineFilters: RemarkSplitMdxOptions[] = [
    { excludes: [[['Drop'], '@components']] },
    { includes: [[['Container', 'Inline', 'Keep'], '@components']] },
    {
      includes: [[['Container', 'Inline', 'Keep', 'Drop'], '@components']],
      excludes: [[['Drop'], '@components']],
    },
  ];
  const inlineFilterLocations = inlineFilters.flatMap(options => [
    { location: 'root', open: '', close: '', options },
    {
      location: 'container',
      open: '<Container>',
      close: '</Container>',
      options,
    },
  ]);

  it.each(inlineFilterLocations)(
    'preserves table rows and columns around filtered inline JSX: %j',
    async ({ open, close, options }) => {
      const markdown = await renderMdx(
        `${open}

| 下载 | 说明 |
| --- | --- |
| <Drop /> | 示例 |
| <Drop>下载</Drop> | 配对标签 |
| <Drop>before <Keep /> after</Drop> | 嵌套组件 |
| <Inline>before <Drop /> after</Inline> | 保留父组件 |
| 普通行 | <Drop /> |

${close}`,
        options,
      );
      const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
      const table = tree.children.find(node => node.type === 'table');
      expect(table).toBeDefined();
      expect(
        table?.children.map(row =>
          row.children.map(cell =>
            cell.children
              .map(child => ('value' in child ? child.value : ''))
              .join(''),
          ),
        ),
      ).toEqual([
        ['下载', '说明'],
        ['<Drop />', '示例'],
        ['<Drop>下载</Drop>', '配对标签'],
        ['<Drop>before kept after</Drop>', '嵌套组件'],
        ['before <Drop /> after', '保留父组件'],
        ['普通行', '<Drop />'],
      ]);
    },
  );

  it.each(inlineFilterLocations)(
    'preserves punctuation and spaces around filtered inline JSX: %j',
    async ({ open, close, options }) => {
      expect(
        await renderMdx(
          `${open}

下载 <Drop />，版本 {version}；<Drop>before <Keep /> after</Drop>。强调 **<Drop />**。

${close}`,
          options,
        ),
      ).toBe(
        '下载 <Drop />，版本 4.2.0；<Drop>before kept after</Drop>。强调 **<Drop />**。',
      );
    },
  );

  it.each([
    ['root', '', ''],
    ['container', '<Container>', '</Container>'],
  ])(
    'keeps imported MDX fragments executable inside filtered %s table cells',
    async (_name, open, close) => {
      const result = String(
        await compile(
          `import Fragment from './fragment.mdx';

${open}

| 下载 | 说明 |
| --- | --- |
| <Fragment /> | 示例 |

${close}`,
          {
            remarkPlugins: [
              remarkGfm,
              [
                remarkSplitMdx,
                { excludes: [[['Fragment'], './fragment.mdx']] },
              ],
            ],
            jsx: true,
          },
        ),
      );
      expect(result).toContain('"}<span><Fragment /></span>{" | 示例 |\\n"}');
    },
  );

  it('preserves authored whitespace inside inline containers', async () => {
    expect(
      await renderMdx(`<Container>

Before <Inline> left
middle <Keep /> more
right </Inline> after.

</Container>`),
    ).toBe('Before  left\nmiddle kept more\nright  after.');
  });

  it.each([
    { includes: [[['Container', 'Keep'], '@components']] },
    { excludes: [[['Drop'], '@components']] },
    {
      includes: [[['Container', 'Keep', 'Drop'], '@components']],
      excludes: [[['Drop'], '@components']],
    },
    { includes: [[['Keep'], '@components']] },
  ])(
    'applies import filters to nested inline components: %j',
    async options => {
      const result = String(
        await compile(
          `import { Container, Keep, Drop } from '@components';

<Container>

Before <Keep /> and <Drop /> after.

</Container>`,
          { remarkPlugins: [[remarkSplitMdx, options]], jsx: true },
        ),
      );
      expect(result).toContain(
        '{"Before "}<span><Keep /></span>{" and <Drop /> after.\\n"}',
      );
    },
  );
});

describe('MDX marker protocol', () => {
  const locations = [
    ['root', '', ''],
    ['flow container', '<Container>\n\n', '\n\n</Container>'],
    ['inline container', 'Before <Inline>', '</Inline> after.'],
  ];
  const parse = (markdown: string) =>
    JSON.parse(
      JSON.stringify(
        unified().use(remarkParse).use(remarkGfm).parse(markdown),
        (key, value) => (key === 'position' ? undefined : value),
      ),
    );

  async function render(
    source: string,
    calls: string[],
    options: RemarkSplitMdxOptions = {},
    transform?: (tree: Root) => void,
  ) {
    const { default: Content } = await evaluate(source, {
      ...jsxRuntime,
      remarkPlugins: [
        remarkGfm,
        ...(transform ? [() => transform] : []),
        [remarkSplitMdx, options],
      ],
    });
    const component = (name: string) => () => {
      calls.push(name);
      return name;
    };
    return (
      await renderToMarkdownString(
        createElement(Content, {
          components: {
            X: component('X'),
            Y: component('Y'),
            Container: ({ children }: { children?: ReactNode }) => children,
            Inline: ({ children }: { children?: ReactNode }) => children,
            Drop: component('Drop'),
          },
        }),
      )
    ).trim();
  }

  const attentionCases = [
    { source: '<Y/>*<X/>* b', calls: ['Y', 'X'] },
    { source: 'a *<X/>*<Y/>', calls: ['X', 'Y'] },
    { source: '<Y/>*<X/>*<Y/>', calls: ['Y', 'X', 'Y'] },
    { source: '<Y/> *<X/>* b', calls: ['Y', 'X'] },
    { source: 'a *<X/>* b', calls: ['X'] },
    { source: '<Y/>**!** b', calls: ['Y'] },
    { source: 'a **!**<Y/>', calls: ['Y'] },
    { source: '<Y/>**[link](https://example.com)** b', calls: ['Y'] },
    { source: '<Y/>**<X/>** b', calls: ['Y', 'X'] },
    { source: '<Y/>~~<X/>~~ b', calls: ['Y', 'X'] },
    { source: '{<Y/>}*{<X/>}* b', calls: ['Y', 'X'] },
    { source: '<Y/>*{<X/>}* b', calls: ['Y', 'X'] },
  ];
  it.each(
    locations.flatMap(([location, open, close]) =>
      attentionCases.map(test => ({ ...test, location, open, close })),
    ),
  )(
    'restores executable nodes exactly once across attention: %j',
    async test => {
      const calls: string[] = [];
      const markdown = await render(
        test.open + test.source + test.close,
        calls,
      );
      // This checks transport, independently of post-render delimiter semantics.
      expect(calls).toEqual(test.calls);
      expect(markdown).not.toMatch(/rspress[0-9a-f]{32}mdx/);
    },
  );

  const structures = [
    ['paragraph and text', 'Before <X/> and {7}.', 'Before X and 7.'],
    ['heading', '## <X/> and {7}', '## X and 7'],
    ['emphasis', 'a *<X/>* b', 'a *X* b'],
    ['strong', 'a **<X/>** b', 'a **X** b'],
    ['delete', 'a ~~<X/>~~ b', 'a ~~X~~ b'],
    [
      'link',
      '[<X/>](https://example.com "Title")',
      '[X](https://example.com "Title")',
    ],
    [
      'link reference and definition',
      '[<X/>][id]\n\n[id]: https://example.com "Title"',
      '[X][id]\n\n[id]: https://example.com "Title"',
    ],
    [
      'image and image reference',
      '![literal &lt;X/>](image.png "Title") <X/> ![literal &#123;7}][img]\n\n[img]: image.png',
      '![literal <X/>](image.png "Title") X ![literal {7}][img]\n\n[img]: image.png',
    ],
    ['list and list item', '3. <X/>\n   - **{7}**', '3. X\n   - **7**'],
    ['task list', '- [x] <X/>\n- [ ] {7}', '- [x] X\n- [ ] 7'],
    ['blockquote', '> <X/>\n>\n> {7}', '> X\n>\n> 7'],
    [
      'footnote definition and reference',
      'Note[^id].\n\n[^id]: <X/> and {7}.\n\n    Another paragraph.',
      'Note[^id].\n\n[^id]: X and 7.\n\n    Another paragraph.',
    ],
    [
      'table, row, and cell',
      '| Left | Right |\n| :--- | ---: |\n| **<X/>** | {7} |',
      '| Left | Right |\n| :--- | ---: |\n| **X** | 7 |',
    ],
    ['hard break', 'Before <X/>\\\nafter {7}.', 'Before X\\\nafter 7.'],
    ['soft break', 'Before <X/>\nafter {7}.', 'Before X\nafter 7.'],
    [
      'inline code and code',
      '`<Y/> {7}` <X/>\n\n```mdx\n<Y/> {7}\n```',
      '`<Y/> {7}` X\n\n```mdx\n<Y/> {7}\n```',
    ],
    [
      'thematic break',
      '<X/> here.\n\n---\n\n{7} after.',
      'X here.\n\n---\n\n7 after.',
    ],
    [
      'flow JSX and expression',
      '<div><X/></div>\n\n{<p>7</p>}\n\n<div><Y/></div>',
      'X\n\n7\n\nY',
    ],
    [
      'ESM and text expression',
      'export const value = 7;\n\n<X/> and {value}.',
      'X and 7.',
    ],
    [
      'filtered JSX with retained descendant',
      'Before <Drop><X/></Drop> and {7}.',
      'Before <Drop>X</Drop> and 7.',
    ],
    [
      'literal marker-like text and references',
      'rspress0123456789abcdef0123456789abcdefmdx0end &#x72; <X/>',
      'rspress0123456789abcdef0123456789abcdefmdx0end r X',
    ],
  ];
  it.each(
    locations.slice(0, 2).flatMap(([location, open, close]) =>
      structures.map(([name, source, expected]) => ({
        location,
        open,
        close,
        name,
        source,
        expected,
      })),
    ),
  )(
    'preserves Markdown structure through serializer handlers: %j',
    async test => {
      const calls: string[] = [];
      const markdown = await render(
        test.open + test.source + test.close,
        calls,
        {
          excludes: [[['Drop'], '@components']],
        },
      );
      expect(parse(markdown)).toEqual(parse(test.expected));
      expect(calls).toEqual(
        test.name === 'flow JSX and expression' ? ['X', 'Y'] : ['X'],
      );
    },
  );

  it('serializes HTML and the hardBreak alias introduced by remark plugins', async () => {
    const calls: string[] = [];
    const markdown = await render('Before <X/> after.', calls, {}, tree => {
      const paragraph = tree.children[0];
      if (paragraph.type !== 'paragraph') {
        throw new Error('Expected a paragraph fixture.');
      }
      paragraph.children.splice(
        2,
        0,
        { type: 'html', value: '<i>literal</i>' },
        // mdast-util-to-markdown supports this legacy handler alias.
        { type: 'hardBreak' } as any,
      );
    });
    // The synthetic AST contains a leading space after the break.
    expect(parse(markdown)).toEqual(
      parse('Before X<i>literal</i>\\\n&#x20;after.'),
    );
    expect(calls).toEqual(['X']);
  });

  it('keeps multi-digit marker IDs ordered without decoding authored code', async () => {
    const calls: string[] = [];
    const literal = '&#x72;spress0123456789abcdef0123456789abcdefmdx0en&#x64;';
    const markdown = await render(
      `\`${literal}\` ${Array.from({ length: 12 }, () => '<X/>').join(' ')}`,
      calls,
    );
    expect(markdown).toBe(
      `\`${literal}\` ${Array.from({ length: 12 }, () => 'X').join(' ')}`,
    );
    expect(calls).toEqual(Array.from({ length: 12 }, () => 'X'));
  });

  // These assertions describe the intended semantics, not the current output.
  // They deliberately keep the local draft's unresolved runtime boundary visible.
  it.each([
    ['adjacent emphasis', '<Y/>*<X/>* b', '&#89;_&#88;_ b'],
    ['adjacent strong punctuation', '<Y/>**!** b', '&#89;**!** b'],
    [
      'adjacent strong link',
      '<Y/>**[link](https://example.com)** b',
      '&#89;**[link](https://example.com)** b',
    ],
    ['expression emphasis', '{<Y/>}*{<X/>}* b', '&#89;_&#88;_ b'],
  ])(
    'preserves resolved boundary semantics for %s',
    async (_name, source, expected) => {
      const markdown = await render(source, []);
      expect(parse(markdown)).toEqual(parse(expected));
    },
  );
});

describe('mdx-to-md-loader', () => {
  it('should transform MDX with import and JSX component to template literal', async () => {
    const input = `# title

import Foo from '@components'

<Foo />`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import Foo from '@components';
      function _createMdxContent(props) {
        return <>{"# title\\n"}{"\\n"}<Foo /></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle MDX with props', async () => {
    const input = `# Hello World

import Button from '@components/Button'

<Button type="primary" disabled={true}>Click me</Button>`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import Button from '@components/Button';
      function _createMdxContent(props) {
        return <>{"# Hello World\\n"}{"\\n"}<Button type="primary" disabled={true}>{"Click me\\n"}</Button></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle multiple components', async () => {
    const input = `# Documentation

import Foo from '@components/Foo'
import Bar from '@components/Bar'

Some text here.

<Foo />

More content.

<Bar prop="value" />`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import Foo from '@components/Foo';
      import Bar from '@components/Bar';
      function _createMdxContent(props) {
        return <>{"# Documentation\\n"}{"\\n"}{"Some text here.\\n"}{"\\n"}<Foo />{"\\n"}{"More content.\\n"}{"\\n"}<Bar prop="value" /></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle codeblock', async () => {
    const input = `# Code Example
    
\`\`\`tsx
console.log('Hello, world!');
function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`
`;
    const result = await processMdx(input);
    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      function _createMdxContent(props) {
        return <>{"# Code Example\\n"}{"\\n"}{"\`\`\`tsx\\nconsole.log('Hello, world!');\\nfunction greet(name: string) {\\n  return \`Hello, \${name}!\`;\\n}\\n\`\`\`\\n"}</>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle self-closing and non-self-closing components', async () => {
    const input = `
# title

import Card from '@components'

<Card>Content inside</Card>

Content outside

<Card>

\`\`\`tsx
console.log('Hello, world!');
\`\`\`
</Card>

\`\`\`tsx
console.log('Hello, world!');
\`\`\`
`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import Card from '@components';
      function _createMdxContent(props) {
        return <>{"# title\\n"}{"\\n"}<Card>{"Content inside\\n"}</Card>{"\\n"}{"Content outside\\n"}{"\\n"}<Card>{"\`\`\`tsx\\nconsole.log('Hello, world!');\\n\`\`\`\\n"}</Card>{"\\n"}{"\`\`\`tsx\\nconsole.log('Hello, world!');\\n\`\`\`\\n"}</>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle MDX with image', async () => {
    const input = `# Image Example

import Img from '@components/Image'

import Svg from '@assets/image.svg'

Here is an image:

<Img src="/path/to/image.jpg" alt="An image" />

<img src={Svg} alt="An SVG image" />

End of content.`;

    const result = await processMdx(input);
    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import Img from '@components/Image';
      import Svg from '@assets/image.svg';
      function _createMdxContent(props) {
        return <>{"# Image Example\\n"}{"\\n"}{"Here is an image:\\n"}{"\\n"}<Img src="/path/to/image.jpg" alt="An image" />{"\\n"}<img src={Svg} alt="An SVG image" />{"\\n"}{"End of content.\\n"}</>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should preserve mdxFlowExpression as-is', async () => {
    const input = `# hello

{window.foo}`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      function _createMdxContent(props) {
        return <>{"# hello\\n"}{"\\n"}{window.foo}</>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should preserve referenced exports', async () => {
    const input = `export const a = 1;
export function Thing() {
  return <>World</>
}

# Hello <Thing /> {a}

{a}`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      export const a = 1;
      export function Thing() {
        return <>World</>;
      }
      function _createMdxContent(props) {
        return <><>{"# Hello "}<span><Thing /></span>{" "}<span>{a}</span>{"\\n"}</>{"\\n"}{a}</>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should preserve imports and referenced exports together', async () => {
    const input = `import Badge from '@components/Badge'
export const a = 1;
export function Thing() {
  return <>World</>
}

# Hello <Badge /> <Thing /> {a}

{a}`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import Badge from '@components/Badge';
      export const a = 1;
      export function Thing() {
        return <>World</>;
      }
      function _createMdxContent(props) {
        return <><>{"# Hello "}<span><Badge /></span>{" "}<span><Thing /></span>{" "}<span>{a}</span>{"\\n"}</>{"\\n"}{a}</>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should preserve inline mdxTextExpression in headings', async () => {
    const input = `# hello {window.foo}`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      function _createMdxContent(props) {
        return <><>{"# hello "}<span>{window.foo}</span>{"\\n"}</></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should preserve inline mdxTextExpression in paragraphs', async () => {
    const input = `Hello {window.foo}`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      function _createMdxContent(props) {
        return <><>{"Hello "}<span>{window.foo}</span>{"\\n"}</></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should preserve mdxTextExpression inside JSX children', async () => {
    const input = `import Foo from '@components'

<Foo>Hello {window.bar}</Foo>`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import Foo from '@components';
      function _createMdxContent(props) {
        return <Foo>{"Hello \\n"}{window.bar}</Foo>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });
});

describe('remarkWrapMarkdown with filters', () => {
  it('should filter imports by rule - includes only @lynx', async () => {
    const input = `import { Table } from '@lynx';
import Button from 'react';

<Table />
<Button>Click</Button>`;

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            includes: [[['Table'], '@lynx']],
          },
        ],
      ],
      jsx: true,
    });

    const code = String(result);
    expect(code).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import {Table} from '@lynx';
      import Button from 'react';
      function _createMdxContent(props) {
        return <><Table />{"\\n"}<>{"<Button>"}{"Click\\n"}{"</Button>"}</></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should filter imports by multiple specifiers', async () => {
    const input = `import { Table, Card } from '@lynx';
import Button from 'react';

<Table />
<Card />
<Button>Click</Button>`;

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            includes: [
              [['Table', 'Button'], '@lynx'],
              [['Button'], 'react'],
            ],
          },
        ],
      ],
      jsx: true,
    });

    const code = String(result);
    expect(code).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import {Table, Card} from '@lynx';
      import Button from 'react';
      function _createMdxContent(props) {
        return <><Table />{"\\n"}{"<Card />\\n"}{"\\n"}<Button>{"Click\\n"}</Button></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should filter imports by source - excludes react', async () => {
    const input = `import { Table } from '@lynx';
import Button from 'react';

<Table />
<Button>Click</Button>`;

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            excludes: [[['Button'], 'react']],
          },
        ],
      ],
      jsx: true,
    });

    const code = String(result);
    expect(code).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import {Table} from '@lynx';
      import Button from 'react';
      function _createMdxContent(props) {
        return <><Table />{"\\n"}<>{"<Button>"}{"Click\\n"}{"</Button>"}</></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should filter imports by multiple specifiers in exclude', async () => {
    const input = `import { Table, Card } from '@lynx';

<Table />
<Card />`;

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            excludes: [[['Card'], '@lynx']],
          },
        ],
      ],
      jsx: true,
    });

    const code = String(result);
    expect(code).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import {Table, Card} from '@lynx';
      function _createMdxContent(props) {
        return <><Table />{"\\n"}{"<Card />\\n"}</>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle import aliases correctly', async () => {
    const input = `import { Table as Tab } from '@lynx';

<Tab />`;

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            includes: [
              [['Table'], '@lynx'], // Match the local name (alias)
            ],
          },
        ],
      ],
      jsx: true,
    });

    const code = String(result);
    expect(code).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import {Table as Tab} from '@lynx';
      function _createMdxContent(props) {
        return <>{"<Tab />\\n"}</>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle combined includes and excludes - excludes takes precedence', async () => {
    const input = `import { Table, Card } from '@lynx';
import Button from 'react';

<Table />
<Card />
<Button>Click</Button>`;

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            includes: [[['Table', 'Card'], '@lynx']],
            excludes: [[['Card'], '@lynx']],
          },
        ],
      ],
      jsx: true,
    });

    const code = String(result);
    expect(code).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import {Table, Card} from '@lynx';
      import Button from 'react';
      function _createMdxContent(props) {
        return <><Table />{"\\n"}{"<Card />\\n"}{"\\n"}<>{"<Button>"}{"Click\\n"}{"</Button>"}</></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should support multiple include rules', async () => {
    const input = `import { Table } from '@lynx';
import { Button } from 'antd';
import Card from 'react';

<Table />
<Button />
<Card />`;

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            includes: [
              [['Table'], '@lynx'],
              [['Button'], 'antd'],
            ],
          },
        ],
      ],
      jsx: true,
    });

    const code = String(result);
    expect(code).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import {Table} from '@lynx';
      import {Button} from 'antd';
      import Card from 'react';
      function _createMdxContent(props) {
        return <><Table />{"\\n"}<Button />{"\\n"}{"<Card />\\n"}</>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle heading with inline JSX component', async () => {
    const input = `import Foo from '@components'

# title <Foo />

# title [link](./link)

# title [link](./link) <Foo />

Some text here.`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import Foo from '@components';
      function _createMdxContent(props) {
        return <><>{"# title "}<span><Foo /></span>{"\\n"}</>{"\\n"}{"# title [link](./link)\\n"}{"\\n"}<>{"# title [link](./link) "}<span><Foo /></span>{"\\n"}</>{"\\n"}{"Some text here.\\n"}</>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle paragraph with multiple inline JSX components', async () => {
    const input = `import { Button, Link } from '@components'

This is a <Button>click me</Button> and <Link href="/test">link</Link> example.`;

    const result = await processMdx(input);

    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import {Button, Link} from '@components';
      function _createMdxContent(props) {
        return <><>{"This is a "}<span><Button>{"click me"}</Button></span>{" and "}<span><Link href="/test">{"link"}</Link></span>{" example.\\n"}</></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should always keep import MDX fragments', async () => {
    const input = `import Button from './_button.mdx';

<Button />`;

    const result = await processMdx(input);
    expect(result).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import Button from './_button.mdx';
      function _createMdxContent(props) {
        return <Button />;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);

    const input2 = `
import { Tabs, Tab } from '@rspress/core/theme';

<Tabs>
<Tab>

import Button from './_button.mdx';

<Button />

</Tab>

<Tab>
</Tab>
</Tabs>
`;

    const result2 = await processMdx(input2);
    expect(result2).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import {Tabs, Tab} from '@rspress/core/theme';
      import Button from './_button.mdx';
      function _createMdxContent(props) {
        return <Tabs><Tab><Button /></Tab><Tab /></Tabs>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });
});
