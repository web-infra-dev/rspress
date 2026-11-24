import { evaluate } from '@mdx-js/mdx';
import { describe, expect, it } from '@rstest/core';
import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useState,
} from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToMarkdownString } from 'react-render-to-markdown';
import remarkGfm from 'remark-gfm';
import { remarkSplitMdx, type RemarkSplitMdxOptions } from './remarkSplitMdx';

const Container = ({ children }: { children?: ReactNode }) =>
  createElement('div', null, children);
const Inline = ({ children }: { children?: ReactNode }) =>
  createElement('span', null, children);
const release = '[release notes](https://example.com/sdk/releases/4.2.0)';

async function render(
  source: string,
  components: Record<string, unknown> = {},
  options: RemarkSplitMdxOptions = {},
) {
  const { default: Content } = await evaluate(
    `export const sdkVersion = '4.2.0';\n\n${source}`,
    {
      ...jsxRuntime,
      remarkPlugins: [remarkGfm, [remarkSplitMdx, options]],
    },
  );
  return (
    await renderToMarkdownString(
      createElement(Content, {
        components: {
          Container,
          Inline,
          ReleaseLink: () =>
            createElement(
              'a',
              { href: 'https://example.com/sdk/releases/4.2.0' },
              'release notes',
            ),
          ...components,
        },
      }),
    )
  ).trim();
}

const locations = [
  ['root', '', ''],
  ['flow container', '<Container>\n\n', '\n\n</Container>'],
  ['inline container', 'See <Inline>', '</Inline>.'],
];

describe('readable nested MDX exports', () => {
  it.each(locations)(
    'resolves components and expressions in a %s',
    async (_name, open, close) => {
      const output = await render(
        `${open}**Read <ReleaseLink/>** for SDK {sdkVersion}.${close}`,
      );
      expect(output).toContain(`**Read ${release}** for SDK 4.2.0.`);
      expect(output).not.toContain('<ReleaseLink');
      expect(output).not.toContain('{sdkVersion}');
      expect(output).not.toMatch(/rspress[0-9a-f]{32}mdx/);
    },
  );

  it('preserves the SDK example and paragraph separators', async () => {
    const source = `export const ReleaseLink = () => <a href={\`https://example.com/sdk/releases/\${sdkVersion}\`}>release notes</a>;

export const Container = ({ children }) => <div>{children}</div>;

<Container>

2. **Read <ReleaseLink/>** for SDK {sdkVersion}.

Next paragraph.

</Container>`;
    expect(await render(source)).toBe(
      `2. **Read ${release}** for SDK 4.2.0.\n\nNext paragraph.`,
    );
  });

  it.each([
    ['heading', '## <ReleaseLink/> {sdkVersion}'],
    ['list', '3. **<ReleaseLink/>** {sdkVersion}'],
    ['quote', '> **<ReleaseLink/>** {sdkVersion}'],
    ['nested list', '- SDK\n  - **<ReleaseLink/>** {sdkVersion}'],
    [
      'table',
      '| Release | Version |\n| --- | --- |\n| <ReleaseLink/> | {sdkVersion} |',
    ],
    ['task label', '- [x] <ReleaseLink/>\n- [ ] {sdkVersion}'],
    ['footnote', 'SDK[^sdk].\n\n[^sdk]: <ReleaseLink/> {sdkVersion}'],
  ])(
    'resolves content in a %s at the root and inside containers',
    async (_name, source) => {
      for (const input of [
        source,
        `<Container>\n\n${source}\n\n</Container>`,
      ]) {
        const output = await render(input);
        expect(output).toContain(release);
        expect(output).toContain('4.2.0');
        expect(output).not.toContain('<ReleaseLink');
        expect(output).not.toContain('{sdkVersion}');
      }
    },
  );

  it('retains paragraph boundaries around flow output', async () => {
    const Paragraphs = () =>
      createElement(
        'div',
        null,
        createElement('p', null, 'First.'),
        createElement('p', null, 'Second.'),
      );
    expect(
      await render(
        '<Container>\n\nBefore.\n\n<Paragraphs/>\n\nAfter.\n\n</Container>',
        { Paragraphs },
      ),
    ).toBe('Before.\n\nFirst.\n\nSecond.\n\nAfter.');
    expect(
      await render('<Container>\n\nFirst.\n\nSecond.\n\n</Container>'),
    ).toBe('First.\n\nSecond.');
  });

  it('does not split inline content when a component returns a div', async () => {
    const Download = () => createElement('div', null, 'Download SDK');
    expect(
      await render('2. **<Download/>** for {sdkVersion}.', { Download }),
    ).toBe('2. **Download SDK** for 4.2.0.');
  });

  it('keeps JSX-looking code examples literal', async () => {
    const input =
      'Example: `<ReleaseLink/> {sdkVersion}`.\n\n```mdx\n<ReleaseLink/> {sdkVersion}\n```\n\nActual: **<ReleaseLink/>**.';
    expect(await render(`<Container>\n\n${input}\n\n</Container>`)).toContain(
      '```mdx\n<ReleaseLink/> {sdkVersion}\n```',
    );
    expect(await render(input)).toContain(
      'Example: `<ReleaseLink/> {sdkVersion}`.',
    );
    expect(await render(input)).toContain(`Actual: **${release}**.`);
  });

  it.each([
    { excludes: [[['Drop'], '@components']] },
    { includes: [[['Container', 'Keep'], '@components']] },
    {
      includes: [[['Container', 'Keep', 'Drop'], '@components']],
      excludes: [[['Drop'], '@components']],
    },
  ] satisfies RemarkSplitMdxOptions[])(
    'retains filters and content order: %j',
    async options => {
      const calls: string[] = [];
      const Keep = () => {
        calls.push('Keep');
        return 'kept';
      };
      const Drop = () => {
        calls.push('Drop');
        return 'wrong';
      };
      const source =
        '<Container>\n\nBefore <Drop>left <Keep/> right</Drop> after.\n\n</Container>';
      expect(await render(source, { Keep, Drop }, options)).toBe(
        'Before <Drop>left kept right</Drop> after.',
      );
      expect(calls).toEqual(['Keep']);
    },
  );

  it('executes nested components once under the normal Context and Hooks', async () => {
    const Value = createContext('default');
    const calls: string[] = [];
    const Provider = ({ children }: { children?: ReactNode }) =>
      createElement(Value.Provider, { value: 'provided' }, children);
    const Read = () => {
      const value = useContext(Value);
      const [suffix] = useState('!');
      calls.push(value);
      return value + suffix;
    };
    expect(
      await render(
        '<Provider>\n\nRead **<Read/>** for {sdkVersion}.\n\n</Provider>',
        { Provider, Read },
      ),
    ).toBe('Read **provided!** for 4.2.0.');
    expect(calls).toEqual(['provided']);
  });

  it('keeps marker-like authored content and restores multiple components', async () => {
    const calls: string[] = [];
    const X = () => {
      calls.push('X');
      return 'X';
    };
    const example = 'rspress00000000000000000000000000000000mdx0end';
    const source = `\`${example}\` ${Array.from({ length: 12 }, () => '<X/>').join(' ')}`;
    expect(await render(source, { X })).toBe(
      `\`${example}\` ${Array.from({ length: 12 }, () => 'X').join(' ')}`,
    );
    expect(calls).toEqual(Array.from({ length: 12 }, () => 'X'));
  });
});
