import { describe, expect, test } from '@rstest/core';
import { compile } from '../processor';

describe('remark-container', async () => {
  const process = (source: string) => {
    return compile({
      source,
      checkDeadLinks: false,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
  };

  test('No newline', async () => {
    const result = await process(`
  :::tip
  This is a tip
  :::

  12312
  `);
    expect(result).toMatchSnapshot();
  });

  test('With a new line after the start position of container', async () => {
    const result = await process(`
  :::tip

  This is a tip
  :::`);
    expect(result).toMatchSnapshot();
  });

  test('With new line before the end position of container', async () => {
    const result = await process(`
  :::tip
  This is a tip

  :::`);
    expect(result).toMatchSnapshot();
  });

  test('With new line in all case', async () => {
    const result = await process(`
  :::tip

  This is a tip

  :::`);
    expect(result).toMatchSnapshot();
  });

  test('With code block in container', async () => {
    const result = await process(`
  :::tip

  This is a tip with \`code\` and [link](foo) some text

  \`\`\`js
  const a = 1;
  \`\`\`

  :::`);
    expect(result).toMatchSnapshot();
  });

  test('With block quote in container', async () => {
    const result = await process(`
  :::tip

  This is a tip with \`code\` and [link](foo) some text

  > This is a quote

  :::`);
    expect(result).toMatchSnapshot();
  });

  test('With link, inlineCode, img, list in container', async () => {
    const result = await process(`
:::tip

This is a tip with \`code\` and [link](foo) some text

- list 1
- list 2

![img](foo)

:::`);
    expect(result).toMatchSnapshot();
  });

  test('With link, inlineCode, img, spread list in container', async () => {
    const result = await process(`
  :::tip

  This is a tip with \`code\` and [link](foo) some text

  - list 1
  - list 2

  ![img](foo)

  :::`);
    expect(result).toMatchSnapshot();
  });

  test('Has space before type', async () => {
    const result = await process(`
  ::: tip

  This is a tip.

  :::`);
    expect(result).toMatchSnapshot();
  });

  test('Use \\{title="foo"} as title', async () => {
    const result = await process(`
  ::: tip\\{title="Custom title"}

  This is a tip.

  :::`);
    expect(result).toMatchSnapshot();
  });

  test("Use \\{title='foo'} as title", async () => {
    const result = await process(`
::: tip\\{title='Custom title'}

This is a tip.

:::`);
    expect(result).toMatchSnapshot();
  });

  test('Use \\{title=foo} as title', async () => {
    const result = await process(`
::: tip\\{title=Custom title}

This is a tip.

:::`);
    expect(result).toMatchSnapshot();
  });

  test('Has space before :::', async () => {
    const result = await process(`
::: tip title
sss
  :::`);
    expect(result).toMatchSnapshot();
  });

  test('details', async () => {
    const result = await process(`::: details
This is a details block.
:::`);

    expect(result).toMatchSnapshot();
  });

  test('github alerts ~ tip', async () => {
    const result = await process(`> [!TIP]
> **Helpful advice for doing things better or more easily.**
`);

    expect(result).toMatchSnapshot();
  });

  test('github alerts ~ note', async () => {
    const result = await process(`> [!NOTE]
>
> # Please read this note!
`);

    expect(result).toMatchSnapshot();
  });

  test('github alerts ~ warning', async () => {
    const result = await process(`> [!warning]
> Use \`dummy\` instead of \`demo\`
`);

    expect(result).toMatchSnapshot();
  });

  test('github alerts ~ caution', async () => {
    const result = await process(`> [!CAUTION]
>
> Use this code:-
> \`\`\`javascript
> console.log(69);
> \`\`\`
`);

    expect(result).toMatchSnapshot();
  });

  test('nested in ordered list', async () => {
    const result = await process(`
1. Title1

    :::tip
    This is a tip.
    :::

2. Title2
`);

    expect(result).toMatchSnapshot();
  });

  test('nested in unordered list', async () => {
    const result = await process(`
- Title1

    :::tip
    This is a tip.
    :::

- Title2
`);

    expect(result).toMatchSnapshot();
  });

  test('nested in ordered list inside mdx component', async () => {
    const result = await process(`
<div>
  <div>
    <div>
      1. Title1

          :::tip
          This is a tip.
          :::

      2. Title2
    </div>
  </div>
</div>
`);

    expect(result).toMatchSnapshot();
  });

  test('nested in unordered list inside mdx component', async () => {
    const result = await process(`
<div>
  <div>
    <div>
    - Title1

      :::tip
      This is a tip.
      :::

    - Title2
    </div>
  </div>
</div>
`);

    expect(result).toMatchSnapshot();
  });

  test('nested in list - github alerts', async () => {
    const result = await process(`
- Title

  > [!TIP]
  > This is a 'tip' style block.

1. Title

  > [!TIP]
  > This is a 'tip' style block.
`);

    expect(result).toMatchSnapshot();
  });

  test('start with a link', async () => {
    const result = await process(`
:::tip
[link](https://example.com) is a link
:::
`);

    expect(result).toMatchSnapshot();
  });

  test('end with a link', async () => {
    const result = await process(`
:::tip
Line 1.

Line 2 with [link](http://example.com).
:::
`);

    expect(result).toMatchSnapshot();
  });

  test('end with an inline code', async () => {
    const result = await process(`
:::tip
Line 1.

Line 2 with \`code\`.
:::
`);

    expect(result).toMatchSnapshot();
  });

  test('end with a new line', async () => {
    const result = await process(`
:::tip
Line 1.

Line 2 with [link](http://example.com).

:::
`);

    expect(result).toMatchSnapshot();
  });

  test('empty blockquote', async () => {
    const result = await process(`

>

  `);
    expect(result).toMatchSnapshot();
  });
});
