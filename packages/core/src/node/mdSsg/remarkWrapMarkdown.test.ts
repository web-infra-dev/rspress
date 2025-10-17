import { compile } from '@mdx-js/mdx';
import { describe, expect, it } from 'vitest';
import { remarkWrapMarkdown } from './remarkWrapMarkdown';

/**
 * Process MDX with custom remark plugin
 */
export async function processMdx(source: string): Promise<string> {
  // Compile MDX with our custom remark plugin
  const result = await compile(source, {
    remarkPlugins: [remarkWrapMarkdown],
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
        return <><>{"# title\\n"}</>{"\\n"}{"\\n"}<Foo /></>;
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
        return <><>{"# Hello World\\n"}</>{"\\n"}{"\\n"}<Button type="primary" disabled={true}>{"Click me"}</Button></>;
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
        return <><>{"# Documentation\\n"}</>{"\\n"}{"\\n"}<>{"Some text here.\\n"}</>{"\\n"}<Foo />{"\\n"}<>{"More content.\\n"}</>{"\\n"}<Bar prop="value" /></>;
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
        return <><>{"# title\\n"}</>{"\\n"}{"\\n"}<Card>{"Content inside"}</Card>{"\\n"}<>{"Content outside\\n"}</>{"\\n"}<Card><_components.pre><_components.code className="language-tsx">{"console.log('Hello, world!');\\n"}</_components.code></_components.pre></Card>{"\\n"}<>{"\`\`\`tsx\\nconsole.log('Hello, world!');\\n\`\`\`\\n"}</></>;
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
     return <><>{"# Image Example\\n"}</>{"\\n"}{"\\n"}{"\\n"}<>{"Here is an image:\\n"}</>{"\\n"}<Img src="/path/to/image.jpg" alt="An image" />{"\\n"}<img src={Svg} alt="An SVG image" />{"\\n"}<>{"End of content.\\n"}</></>;
   }
   export default function MDXContent(props = {}) {
     const {wrapper: MDXLayout} = props.components || ({});
     return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
   }
   "
 `);
  });
});
