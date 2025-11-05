import { compile } from '@mdx-js/mdx';
import { describe, expect, it } from 'vitest';
import { remarkSplitMdx } from './remarkSplitMdx';

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
        return <>{"# title\\n"}{"\\n"}{"\\n"}<Foo /></>;
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
        return <>{"# Hello World\\n"}{"\\n"}{"\\n"}<Button type="primary" disabled={true}>{"Click me"}</Button></>;
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
        return <>{"# Documentation\\n"}{"\\n"}{"\\n"}{"Some text here.\\n"}{"\\n"}<Foo />{"\\n"}{"More content.\\n"}{"\\n"}<Bar prop="value" /></>;
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
        const _components = {
          code: "code",
          pre: "pre",
          ...props.components
        };
        return <>{"# title\\n"}{"\\n"}{"\\n"}<Card>{"Content inside"}</Card>{"\\n"}{"Content outside\\n"}{"\\n"}<Card><_components.pre><_components.code className="language-tsx">{"console.log('Hello, world!');\\n"}</_components.code></_components.pre></Card>{"\\n"}{"\`\`\`tsx\\nconsole.log('Hello, world!');\\n\`\`\`\\n"}</>;
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
        return <>{"# Image Example\\n"}{"\\n"}{"\\n"}{"\\n"}{"Here is an image:\\n"}{"\\n"}<Img src="/path/to/image.jpg" alt="An image" />{"\\n"}<img src={Svg} alt="An SVG image" />{"\\n"}{"End of content.\\n"}</>;
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
        return <><Table />{"\\n"}{"<Button>\\n  Click\\n</Button>\\n"}</>;
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
        return <><Table />{"\\n"}{"<Card />\\n"}{"\\n"}<Button>{"Click"}</Button></>;
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
        return <><Table />{"\\n"}{"<Button>\\n  Click\\n</Button>\\n"}</>;
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
        return <><Table />{"\\n"}{"<Card />\\n"}{"\\n"}{"<Button>\\n  Click\\n</Button>\\n"}</>;
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
        return <><>{"# title "}<Foo /></>{"\\n"}{"# title [link](./link)\\n"}{"\\n"}<>{"# title [link](./link)\\n "}<Foo /></>{"\\n"}{"Some text here.\\n"}</>;
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
        return <><>{"This is a "}<Button>{"click me"}</Button>{" and "}<Link href="/test">{"link"}</Link>{" example."}</></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });
});
