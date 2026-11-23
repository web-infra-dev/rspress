import { compile, evaluate } from '@mdx-js/mdx';
import { describe, expect, it } from '@rstest/core';
import {
  createContext,
  createElement,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToMarkdownString } from 'react-render-to-markdown';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { markdownRegionOptions } from '../../runtime/serializeMarkdownRegion';
import { remarkSplitMdx, type RemarkSplitMdxOptions } from './remarkSplitMdx';

const parse = (value: string) =>
  JSON.parse(
    JSON.stringify(
      unified().use(remarkParse).use(remarkGfm).parse(value),
      (key, value) => (key === 'position' ? undefined : value),
    ),
  );
const Container = ({ children }: { children?: ReactNode }) =>
  createElement('div', null, children);
const Inline = ({ children }: { children?: ReactNode }) =>
  createElement('span', null, children);

async function render(
  source: string,
  components: Record<string, unknown> = {},
  options: RemarkSplitMdxOptions = {},
) {
  const { default: Content } = await evaluate(source, {
    ...jsxRuntime,
    remarkPlugins: [remarkGfm, [remarkSplitMdx, options]],
  });
  return (
    await renderToMarkdownString(
      createElement(Content, {
        components: {
          X: () => 'X',
          Y: () => 'Y',
          Container,
          Inline,
          ...components,
        },
      }),
      markdownRegionOptions,
    )
  ).trim();
}

const regions = [
  ['root', '', ''],
  ['flow container', '<Container>\n\n', '\n\n</Container>'],
  ['inline container', '<Inline>', '</Inline>'],
];
const boundaries = [
  ['<Y/>*<X/>* b', '&#89;_&#88;_ b'],
  ['<Y/>**!** b', '&#89;**!** b'],
  [
    '<Y/>**[link](https://example.com)** b',
    '&#89;**[link](https://example.com)** b',
  ],
  ['{<Y/>}*{<X/>}* b', '&#89;_&#88;_ b'],
  ['a *text*<Y/>', 'a _tex&#116;_&#89;'],
  ['a **!**<Y/>', 'a **!**&#89;'],
];

describe('deferred Markdown serialization', () => {
  it.each(
    regions.flatMap(([location, open, close]) =>
      boundaries.map(([source, expected]) => ({
        location,
        open,
        close,
        source,
        expected,
      })),
    ),
  )(
    'preserves final boundary semantics: %j',
    async ({ open, close, source, expected }) => {
      expect(parse(await render(open + source + close))).toEqual(
        parse(expected),
      );
    },
  );

  it('resolves the SDK example and preserves declarations and paragraph boundaries', async () => {
    const source = `export const sdkVersion = '4.2.0';

export const ReleaseLink = () => <a href={\`https://example.com/sdk/releases/\${sdkVersion}\`}>release notes</a>;

export const Container = ({ children }) => <div>{children}</div>;

<Container>

2. **Read <ReleaseLink />** for SDK {sdkVersion}.

Next paragraph.

</Container>`;
    expect(parse(await render(source))).toEqual(
      parse(
        '2. **Read [release notes](https://example.com/sdk/releases/4.2.0)** for SDK 4.2.0.\n\nNext paragraph.',
      ),
    );
    const code = String(
      await compile(source, { jsx: true, remarkPlugins: [remarkSplitMdx] }),
    );
    expect(code).toContain('export const sdkVersion');
    expect(code).toContain('rspress-md-region');
    expect(code).not.toContain('Read <ReleaseLink />');
  });

  it.each([
    ['list', '3. **<X/>**\n   - {7}', '3. **X**\n   - 7'],
    ['task list', '- [x] <X/>\n- [ ] {7}', '- [x] X\n- [ ] 7'],
    ['blockquote', '> **<X/>** {7}', '> **X** 7'],
    [
      'reference',
      '[<X/>][id]\n\n[id]: https://example.com',
      '[X][id]\n\n[id]: https://example.com',
    ],
    [
      'footnote',
      'Note[^id].\n\n[^id]: <X/> and {7}.',
      'Note[^id].\n\n[^id]: X and 7.',
    ],
    [
      'code',
      '`<Y/> {7}` <X/>\n\n```mdx\n<Y/> {7}\n```',
      '`<Y/> {7}` X\n\n```mdx\n<Y/> {7}\n```',
    ],
    ['break', 'Before <X/>\\\nafter {7}.', 'Before X\\\nafter 7.'],
  ])('preserves %s', async (_name, source, expected) => {
    expect(parse(await render(source))).toEqual(parse(expected));
    expect(
      parse(await render(`<Container>\n\n${source}\n\n</Container>`)),
    ).toEqual(parse(expected));
  });

  it('escapes actual component output inside tables and links', async () => {
    const Pipe = () => createElement('code', null, 'left | right');
    const Bracket = () => ']test';
    expect(
      parse(await render('| Content |\n| --- |\n| <Pipe/> |', { Pipe })),
    ).toEqual(parse('| Content |\n| --- |\n| `left \\| right` |'));
    expect(
      parse(await render('a [<Bracket/>](https://example.com) b', { Bracket })),
    ).toEqual(parse('a [\\]test](https://example.com) b'));
  });

  it('keeps component strings as Markdown and native element text as literal text', async () => {
    expect(
      parse(await render('**<Link/>**', { Link: () => '[release](/release)' })),
    ).toEqual(parse('**[release](/release)**'));
    expect(
      parse(
        await render('**<Code/>**', {
          Code: () => createElement('code', null, '*'),
        }),
      ),
    ).toEqual(parse('**`*`**'));
  });

  it('keeps filtered tags literal and executes retained descendants once', async () => {
    const calls: string[] = [];
    const Keep = () => {
      calls.push('Keep');
      return 'kept';
    };
    const Drop = () => {
      calls.push('Drop');
      return 'wrong';
    };
    const markdown = await render(
      '| Content |\n| --- |\n| <Drop>before <Keep/> after</Drop> |',
      { Keep, Drop },
      { excludes: [[['Drop'], '@components']] },
    );
    expect(parse(markdown)).toEqual(
      parse('| Content |\n| --- |\n| <Drop>before kept after</Drop> |'),
    );
    expect(calls).toEqual(['Keep']);
  });

  it('retains Context, Hooks, and child ownership', async () => {
    const Value = createContext('default');
    const calls: string[] = [];
    const Read = () => {
      const value = useContext(Value);
      const [suffix] = useState('!');
      calls.push(value);
      return value + suffix;
    };
    const Provider = ({ children }: { children?: ReactNode }) =>
      createElement(Value.Provider, { value: 'provided' }, children);
    const Twice = ({ children }: { children?: ReactNode }) =>
      createElement('span', null, children, children);
    const Ignore = () => null;
    expect(
      parse(
        await render(
          '<Provider>\n\n**<Read/>** <Twice>*<Read/>*</Twice><Ignore><Read/></Ignore>\n\n</Provider>',
          { Provider, Read, Twice, Ignore },
        ),
      ),
    ).toEqual(parse('**provided!** _provided!_*provided!*'));
    expect(calls).toEqual(['provided', 'provided', 'provided']);
  });

  it('preserves plain container paragraphs and flow component paragraphs', async () => {
    expect(
      await render('<Container>\n\nFirst.\n\nSecond.\n\n</Container>'),
    ).toBe('First.\n\nSecond.');
    const Paragraphs = () =>
      createElement(
        'div',
        null,
        createElement('p', null, 'First'),
        createElement('p', null, 'Second'),
      );
    expect(
      parse(
        await render(
          '<Container>\n\nBefore.\n\n<Paragraphs/>\n\nAfter.\n\n</Container>',
          { Paragraphs },
        ),
      ),
    ).toEqual(parse('Before.\n\nFirst\n\nSecond\n\nAfter.'));
  });
  it('treats native link text literally and rejects block output in inline positions', async () => {
    const Literal = () => createElement('a', { href: '/docs' }, '*literal*');
    expect(parse(await render('Read **<Literal/>**.', { Literal }))).toEqual(
      parse('Read **[\\*literal\\*](/docs)**.'),
    );
    const Paragraphs = () =>
      createElement(
        'div',
        null,
        createElement('p', null, 'First'),
        createElement('p', null, 'Second'),
      );
    await expect(
      render('Read **<Paragraphs/>**.', { Paragraphs }),
    ).rejects.toThrow('Multiple paragraphs');
  });
});
