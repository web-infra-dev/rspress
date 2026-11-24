import { evaluate } from '@mdx-js/mdx';
import { describe, expect, it } from '@rstest/core';
import {
  createContext,
  createElement,
  type ReactNode,
  type ComponentType,
  useContext,
  useState,
} from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToMarkdownString } from 'react-render-to-markdown';
import remarkGfm from 'remark-gfm';
import { remarkSplitMdx, type RemarkSplitMdxOptions } from './remarkSplitMdx';

const sdkComponents = `export const sdkVersion = '4.2.0';

export const ReleaseLink = () => (
  <a href={\`https://example.com/sdk/releases/\${sdkVersion}\`}>release notes</a>
);

export const Container = ({ children }) => <div>{children}</div>;

export const Inline = ({ children }) => <span>{children}</span>;`;

async function render(
  input: string,
  components: Record<string, ComponentType<any>> = {},
  options: RemarkSplitMdxOptions = {},
) {
  const { default: Content } = await evaluate(input, {
    ...jsxRuntime,
    remarkPlugins: [remarkGfm, [remarkSplitMdx, options]],
  });
  return (
    await renderToMarkdownString(createElement(Content, { components }))
  ).trim();
}

function renderSdk(input: string) {
  return render(`${sdkComponents}\n\n${input}`);
}

describe('SDK content and paragraph exports', () => {
  it('resolves the SDK inside a flow container', async () => {
    const input = `<Container>

2. **Read <ReleaseLink />** for SDK {sdkVersion}.

Next paragraph.

</Container>`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(`
      "2. **Read [release notes](https://example.com/sdk/releases/4.2.0)** for SDK 4.2.0.

      Next paragraph."
    `);
  });

  it('resolves the SDK inside a root list', async () => {
    const input = `2. **Read <ReleaseLink />** for SDK {sdkVersion}.

Next paragraph.`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(`
      "2. **Read [release notes](https://example.com/sdk/releases/4.2.0)** for SDK 4.2.0.

      Next paragraph."
    `);
  });

  it('resolves the SDK inside an inline container', async () => {
    const input =
      'See <Inline>**Read <ReleaseLink />** for SDK {sdkVersion}.</Inline>';

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(
      `"See **Read [release notes](https://example.com/sdk/releases/4.2.0)** for SDK 4.2.0."`,
    );
  });

  it('keeps a div-producing link inline inside the list item', async () => {
    const input = `export const BlockLink = () => (
  <div>
    <a href={\`https://example.com/sdk/releases/\${sdkVersion}\`}>release notes</a>
  </div>
);

<Container>

2. **Read <BlockLink />** for SDK {sdkVersion}.

</Container>`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(
      `"2. **Read [release notes](https://example.com/sdk/releases/4.2.0)** for SDK 4.2.0."`,
    );
  });

  it('separates adjacent authored paragraphs inside a container', async () => {
    const input = `<Container>

First paragraph.

Second paragraph.

</Container>`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(`
      "First paragraph.

      Second paragraph."
    `);
  });

  it('retains paragraphs produced by a flow component', async () => {
    const input = `export const Paragraphs = () => (
  <div>
    <p>First paragraph.</p>
    <p>Second paragraph.</p>
  </div>
);

<Container>

Before.

<Paragraphs />

After.

</Container>`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(`
      "Before.

      First paragraph.

      Second paragraph.


      After."
    `);
  });

  it('resolves task labels and retains their checkboxes', async () => {
    const input = `- [x] <ReleaseLink />
- [ ] {sdkVersion}`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(`
      "- [x] [release notes](https://example.com/sdk/releases/4.2.0)
      - [ ] 4.2.0"
    `);
  });

  it('keeps excluded table tags literal and resolves their retained children', async () => {
    const input = `| Content | Note |
| --- | --- |
| <Drop /> | Literal tag |
| <Drop>before <Keep /> after</Drop> | Retained child |

Download <Drop />.`;
    const components = { Keep: () => 'kept', Drop: () => 'unexpected' };
    const options: RemarkSplitMdxOptions = {
      excludes: [[['Drop'], '@components']],
    };

    const output = await render(input, components, options);
    expect(output).toMatchInlineSnapshot(`
      "| Content | Note |
      | --- | --- |
      | <Drop /> | Literal tag |
      | <Drop>before kept after</Drop> | Retained child |

      Download <Drop />."
    `);
  });

  it('keeps code examples literal beside executable content', async () => {
    const input = `Example: \`<ReleaseLink /> {sdkVersion}\`.

\`\`\`mdx
<ReleaseLink /> {sdkVersion}
\`\`\`

Actual: <ReleaseLink /> {sdkVersion}.`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(`
      "Example: \`<ReleaseLink /> {sdkVersion}\`.

      \`\`\`mdx
      <ReleaseLink /> {sdkVersion}
      \`\`\`

      Actual: [release notes](https://example.com/sdk/releases/4.2.0) 4.2.0."
    `);
  });
});

// Record readable content, including known formatting limits.
describe('readable output with known formatting limits', () => {
  const components = { X: () => 'X', Y: () => 'Y' };

  it('resolves adjacent emphasis content', async () => {
    const input = '<Y/>*<X/>* b';

    const output = await render(input, components);
    expect(output).toMatchInlineSnapshot(`"Y_X_ b"`);
  });

  it('resolves content before strong punctuation', async () => {
    const input = '<Y/>**!** b';

    const output = await render(input, components);
    expect(output).toMatchInlineSnapshot(`"Y**!** b"`);
  });

  it('resolves content before a strong link', async () => {
    const input = '<Y/>**[link](https://example.com)** b';

    const output = await render(input, components);
    expect(output).toMatchInlineSnapshot(
      `"Y**[link](https://example.com)** b"`,
    );
  });

  it('resolves expressions inside adjacent emphasis', async () => {
    const input = '{<Y/>}*{<X/>}* b';

    const output = await render(input, components);
    expect(output).toMatchInlineSnapshot(`"Y_X_ b"`);
  });

  it('resolves a component after emphasis', async () => {
    const input = 'a *text*<Y/>';

    const output = await render(input, components);
    expect(output).toMatchInlineSnapshot(`"a _text_Y"`);
  });

  it('resolves a component after strong punctuation', async () => {
    const input = 'a **!**<Y/>';

    const output = await render(input, components);
    expect(output).toMatchInlineSnapshot(`"a **!**Y"`);
  });
});

describe('other nested Markdown exports', () => {
  it('resolves a heading', async () => {
    const input = '## <ReleaseLink /> {sdkVersion}';

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(
      `"## [release notes](https://example.com/sdk/releases/4.2.0) 4.2.0"`,
    );
  });

  it('resolves a blockquote inside a container', async () => {
    const input = `<Container>

> **<ReleaseLink />** {sdkVersion}

</Container>`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(
      `"> **[release notes](https://example.com/sdk/releases/4.2.0)** 4.2.0"`,
    );
  });

  it('resolves a nested list', async () => {
    const input = `- SDK
  - **<ReleaseLink />** {sdkVersion}`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(`
      "- SDK
        - **[release notes](https://example.com/sdk/releases/4.2.0)** 4.2.0"
    `);
  });

  it('resolves footnote content inside a container', async () => {
    const input = `<Container>

SDK[^sdk].

[^sdk]: <ReleaseLink /> {sdkVersion}

</Container>`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(`
      "SDK[^sdk].

      [^sdk]: [release notes](https://example.com/sdk/releases/4.2.0)

          4.2.0"
    `);
  });

  it('retains literal code inside a container', async () => {
    const input = `<Container>

Example: \`<ReleaseLink /> {sdkVersion}\`.

\`\`\`mdx
<ReleaseLink /> {sdkVersion}
\`\`\`

Actual: **<ReleaseLink />**.

</Container>`;

    const output = await renderSdk(input);
    expect(output).toMatchInlineSnapshot(`
      "Example: \`<ReleaseLink /> {sdkVersion}\`.

      \`\`\`mdx
      <ReleaseLink /> {sdkVersion}
      \`\`\`

      Actual: **[release notes](https://example.com/sdk/releases/4.2.0)**."
    `);
  });

  it('preserves block separators when batching root Markdown', async () => {
    const input = `# SDK

First paragraph.

- First item
- Second item

> Note.

Last paragraph.`;

    const output = await render(input);
    expect(output).toMatchInlineSnapshot(`
      "# SDK

      First paragraph.

      - First item
      - Second item

      > Note.

      Last paragraph."
    `);
  });

  it('keeps expressions between batched Markdown blocks', async () => {
    const input = `export const version = '4.2.0';

# SDK

Before.

{version}

After.

## Install`;

    const output = await render(input);
    expect(output).toMatchInlineSnapshot(`
      "# SDK

      Before.
      4.2.0
      After.

      ## Install"
    `);
  });

  it('keeps nested serializer state isolated', async () => {
    const input = `export const Container = ({ children }) => <div>{children}</div>;

export const Inline = ({ children }) => <span>{children}</span>;

export const X = () => 'X';

<Container>

Before <Inline>left **<X/>** right</Inline> after <X/>.

Next **<X/>**.

</Container>`;

    const output = await render(input);
    expect(output).toMatchInlineSnapshot(`
      "Before left **X** right after X.

      Next **X**."
    `);
  });

  it('separates flow component text from following headings and paragraphs', async () => {
    const input = `export const Label = () => 'new';

# SDK

<Label/>

Next paragraph.

<Label/>

## Install`;

    const output = await render(input);
    expect(output).toMatchInlineSnapshot(`
      "# SDK
      new
      Next paragraph.
      new
      ## Install"
    `);
  });

  it('escapes literal Markdown characters beside a component', async () => {
    const input = 'Literal \\*stars\\* and \\[brackets\\] beside <X/>.';

    const output = await render(input, { X: () => 'X' });
    expect(output).toMatchInlineSnapshot(
      `"Literal \\*stars\\* and \\[brackets\\] beside X."`,
    );
  });

  it('escapes static table pipes beside an executable cell', async () => {
    const input = `| Example | Result |
| :--- | ---: |
| a \\| b and \`x \\| y\` | <X/> |`;

    const output = await render(input, { X: () => 'X' });
    expect(output).toMatchInlineSnapshot(`
      "| Example | Result |
      | :--- | ---: |
      | a \\| b and \`x \\| y\` | X |"
    `);
  });

  it('preserves link destinations and titles around dynamic labels', async () => {
    const input = '[<X/>](<https://example.com/a b> "A title")';

    const output = await render(input, { X: () => 'X' });
    expect(output).toMatchInlineSnapshot(
      `"[X](<https://example.com/a b> "A title")"`,
    );
  });

  it('preserves references with dynamic labels', async () => {
    const input = `[<X/>][sdk]

[sdk]: https://example.com/sdk "SDK"`;

    const output = await render(input, { X: () => 'X' });
    expect(output).toMatchInlineSnapshot(`
      "[X][sdk]

      [sdk]: https://example.com/sdk "SDK""
    `);
  });

  it('indents mixed nested task lists and code blocks', async () => {
    const input = `3. Read <X/>.

   - [x] <X/>
   - [ ] Next {4}.

   \`\`\`js
   const value = 4;
   \`\`\`

4. Finish.`;

    const output = await render(input, { X: () => 'X' });
    expect(output).toMatchInlineSnapshot(`
      "3. Read X.

         - [x] X
         - [ ] Next 4.

         \`\`\`js
         const value = 4;
         \`\`\`

      4. Finish."
    `);
  });

  it('prefixes each authored line in a mixed blockquote', async () => {
    const input = `> Read <X/>.
>
> Next paragraph.
>
> - One
> - {2}`;

    const output = await render(input, { X: () => 'X' });
    expect(output).toMatchInlineSnapshot(`
      "> Read X.
      >
      > Next paragraph.
      >
      > - One
      > - 2"
    `);
  });

  it('keeps marker-like code literal beside repeated components', async () => {
    const input = `\`rspress00000000000000000000000000000000mdx0end\`

Actual: <X/> <X/> <X/> <X/> <X/> <X/> <X/> <X/> <X/> <X/> <X/> <X/>`;

    const output = await render(input, { X: () => 'X' });
    expect(output).toMatchInlineSnapshot(`
      "\`rspress00000000000000000000000000000000mdx0end\`

      Actual: X X X X X X X X X X X X"
    `);
  });
});

describe('component execution and filters', () => {
  const filterCases: { name: string; options: RemarkSplitMdxOptions }[] = [
    { name: 'excludes', options: { excludes: [[['Drop'], '@components']] } },
    {
      name: 'includes',
      options: { includes: [[['Container', 'Keep'], '@components']] },
    },
    {
      name: 'excludes take precedence',
      options: {
        includes: [[['Container', 'Keep', 'Drop'], '@components']],
        excludes: [[['Drop'], '@components']],
      },
    },
  ];

  it.each(filterCases)(
    'executes retained children once with $name',
    async ({ options }) => {
      const input = `<Container>

Before <Drop>left <Keep /> right</Drop> after.

</Container>`;
      const calls: string[] = [];
      const Container = ({ children }: { children?: ReactNode }) => (
        <div>{children}</div>
      );
      const Keep = () => {
        calls.push('Keep');
        return 'kept';
      };
      const Drop = () => {
        calls.push('Drop');
        return 'unexpected';
      };

      const output = await render(input, { Container, Keep, Drop }, options);
      expect(output).toMatchInlineSnapshot(
        `"Before <Drop>left kept right</Drop> after."`,
      );
      expect(calls).toEqual(['Keep']);
    },
  );

  it('executes nested components once with Context and Hooks', async () => {
    const input = `<Provider>

Read **<Read/>** for SDK.

</Provider>`;
    const Value = createContext('default');
    const calls: string[] = [];
    const Provider = ({ children }: { children?: ReactNode }) => (
      <Value.Provider value="provided">{children}</Value.Provider>
    );
    const Read = () => {
      const value = useContext(Value);
      const [suffix] = useState('!');
      calls.push(value);
      return value + suffix;
    };

    const output = await render(input, { Provider, Read });
    expect(output).toMatchInlineSnapshot(`"Read **provided!** for SDK."`);
    expect(calls).toEqual(['provided']);
  });
});
