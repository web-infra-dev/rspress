import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { describe, expect, test } from 'vitest';
import { remarkPluginContainer } from '../src/remarkPlugin';

describe('remark-container', () => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkPluginContainer)
    .use(remarkDirective)
    .use(remarkRehype)
    .use(rehypeStringify);

  const mdxProcessor = processor().use(remarkMdx);

  test('No newline', () => {
    const result = processor.processSync(`
  :::tip
  This is a tip
  :::

  12312
  `);
    expect(result.value).toMatchSnapshot();
  });

  test('With a new line after the start position of container', () => {
    const result = processor.processSync(`
  :::tip

  This is a tip
  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With new line before the end position of container', () => {
    const result = processor.processSync(`
  :::tip
  This is a tip

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With new line in all case', () => {
    const result = processor.processSync(`
  :::tip

  This is a tip

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With code block in container', () => {
    const result = processor.processSync(`
  :::tip

  This is a tip with \`code\` and [link](foo) some text

  \`\`\`js
  const a = 1;
  \`\`\`

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With block quote in container', () => {
    const result = processor.processSync(`
  :::tip

  This is a tip with \`code\` and [link](foo) some text

  > This is a quote

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With link, inlineCode, img, list in container', () => {
    const result = processor.processSync(`
:::tip

This is a tip with \`code\` and [link](foo) some text

- list 1
- list 2

![img](foo)

:::`);
    expect(result.value).toMatchSnapshot();
  });

  test('With link, inlineCode, img, spread list in container', () => {
    const result = processor.processSync(`
  :::tip

  This is a tip with \`code\` and [link](foo) some text

  - list 1
  - list 2

  ![img](foo)

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('Has space before type', () => {
    const result = processor.processSync(`
  ::: tip

  This is a tip.

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('Use {title="foo"} as title', () => {
    const result = processor.processSync(`
  ::: tip{title="Custom title"}

  This is a tip.

  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test("Use {title='foo'} as title", () => {
    const result = processor.processSync(`
::: tip{title='Custom title'}

This is a tip.

:::`);
    expect(result.value).toMatchSnapshot();
  });

  test('Use {title=foo} as title', () => {
    const result = processor.processSync(`
::: tip{title=Custom title}

This is a tip.

:::`);
    expect(result.value).toMatchSnapshot();
  });

  test('Has space before :::', () => {
    const result = processor.processSync(`
::: tip title
sss
  :::`);
    expect(result.value).toMatchSnapshot();
  });

  test('details', () => {
    const result = processor.processSync(`::: details
This is a details block.
:::`);

    expect(result.value).toMatchSnapshot();
  });

  test('github alerts ~ tip', () => {
    const result = processor.processSync(`> [!TIP]
> **Helpful advice for doing things better or more easily.**
`);

    expect(result.value).toMatchSnapshot();
  });

  test('github alerts ~ note', () => {
    const result = processor.processSync(`> [!NOTE]
>
> # Please read this note!
`);

    expect(result.value).toMatchSnapshot();
  });

  test('github alerts ~ warning', () => {
    const result = processor.processSync(`> [!warning]
> Use \`dummy\` instead of \`demo\`
`);

    expect(result.value).toMatchSnapshot();
  });

  test('github alerts ~ caution', () => {
    const result = processor.processSync(`> [!CAUTION]
>
> Use this code:-
> \`\`\`javascript
> console.log(69);
> \`\`\`
`);

    expect(result.value).toMatchSnapshot();
  });

  test('nested in ordered list', () => {
    const result = processor.processSync(`
1. Title1

    :::tip
    This is a tip.
    :::

2. Title2
`);

    expect(result.value).toMatchSnapshot();
  });

  test('nested in unordered list', () => {
    const result = processor.processSync(`
- Title1

    :::tip
    This is a tip.
    :::

- Title2
`);

    expect(result.value).toMatchSnapshot();
  });

  test('nested in ordered list inside mdx component', () => {
    const result = mdxProcessor.processSync(`
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

    expect(result.value).toMatchSnapshot();
  });

  test('nested in unordered list inside mdx component', () => {
    const result = mdxProcessor.processSync(`
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

    expect(result.value).toMatchSnapshot();
  });

  test('nested in list - github alerts', () => {
    const result = processor.processSync(`
- Title

  > [!TIP]
  > This is a 'tip' style block.

1. Title

  > [!TIP]
  > This is a 'tip' style block.
`);

    expect(result.value).toMatchSnapshot();
  });
});
