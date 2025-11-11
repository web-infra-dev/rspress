import fs from 'node:fs/promises';
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
        return <>{"# Hello World\\n"}{"\\n"}{"\\n"}<Button type="primary" disabled={true}>{"Click me\\n"}</Button></>;
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
        return <>{"# title\\n"}{"\\n"}{"\\n"}<Card>{"Content inside\\n"}</Card>{"\\n"}{"Content outside\\n"}{"\\n"}<Card>{"\`\`\`tsx\\nconsole.log('Hello, world!');\\n\`\`\`\\n"}</Card>{"\\n"}{"\`\`\`tsx\\nconsole.log('Hello, world!');\\n\`\`\`\\n"}</>;
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
        return <><>{"This is a "}<Button>{"click me\\n"}</Button>{" and "}<Link href="/test">{"link\\n"}</Link>{" example."}</></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should lynx', async () => {
    const fixturesTestMdxPath = new URL('./fixtures/test.mdx', import.meta.url);
    const input = await fs.readFile(fixturesTestMdxPath, 'utf-8');

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            includes: [[['Go'], '@lynx']],
          },
        ],
      ],
      jsx: true,
    });
    expect(result.toString()).toMatchSnapshot();
  });
});

describe('remarkWrapMarkdown - mdx fragments', () => {
  it('should keep MDX fragments even when includes filter is set', async () => {
    const input = `import Content from './content.mdx'
import { Table } from '@lynx'

<Content />
<Table />`;

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            includes: [[['Table', 'Content'], '@lynx']],
          },
        ],
      ],
      jsx: true,
    });

    const code = String(result);
    expect(code).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import Content from './content.mdx';
      import {Table} from '@lynx';
      function _createMdxContent(props) {
        return <><Content />{"\\n"}<Table /></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle MDX fragments within Tabs', async () => {
    const input = `
import { PlatformTabs } from '@lynx';
import IntegratingLynxIOS from './fragments/ios/integrating-lynx-with-existing-app-ios.mdx';
import IntegratingLynxAndroid from './fragments/android/integrating-lynx-with-existing-app-android.mdx';
import IntegratingLynxHarmony from './fragments/harmony/integrating-lynx-with-existing-app-harmony.mdx';
import IntegratingLynxWeb from './fragments/web/integrating-lynx-with-web.mdx';

<PlatformTabs queryKey="platform">
<PlatformTabs.Tab platform="ios">
<IntegratingLynxIOS />
</PlatformTabs.Tab>

<PlatformTabs.Tab platform="android">
  <IntegratingLynxAndroid />
</PlatformTabs.Tab>

<PlatformTabs.Tab platform="harmony">
  <IntegratingLynxHarmony />
</PlatformTabs.Tab>

<PlatformTabs.Tab platform="web">
  <IntegratingLynxWeb />
</PlatformTabs.Tab>

</PlatformTabs>`;

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            includes: [[['Content'], '@lynx']],
          },
        ],
      ],
      jsx: true,
    });

    const code = String(result);
    expect(code).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      import {PlatformTabs} from '@lynx';
      import IntegratingLynxIOS from './fragments/ios/integrating-lynx-with-existing-app-ios.mdx';
      import IntegratingLynxAndroid from './fragments/android/integrating-lynx-with-existing-app-android.mdx';
      import IntegratingLynxHarmony from './fragments/harmony/integrating-lynx-with-existing-app-harmony.mdx';
      import IntegratingLynxWeb from './fragments/web/integrating-lynx-with-web.mdx';
      function _createMdxContent(props) {
        return <><>{"<PlatformTabs queryKey=\\"platform\\">"}<>{"<PlatformTabs.Tab platform=\\"ios\\">"}<IntegratingLynxIOS />{"</PlatformTabs.Tab>"}</><>{"<PlatformTabs.Tab platform=\\"android\\">"}<IntegratingLynxAndroid />{"</PlatformTabs.Tab>"}</><>{"<PlatformTabs.Tab platform=\\"harmony\\">"}<IntegratingLynxHarmony />{"</PlatformTabs.Tab>"}</><>{"<PlatformTabs.Tab platform=\\"web\\">"}<IntegratingLynxWeb />{"</PlatformTabs.Tab>"}</>{"</PlatformTabs>"}</></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });

  it('should handle MDX fragments within Steps', async () => {
    const input = `<Steps>
  
  ### Configuring Deps
  
  1. **Lynx**
  
  The core capabilities of [Lynx Engine](/guide/spec.html#engine) include basic capabilities such as parsing [Bundle](/guide/spec.html#lynx-bundle-or-bundle), style parsing, layout, and rendering views
  
  Get the latest version of Lynx from Cocoapods. Then add Lynx to your Podfile:
  
  <CodeFold height={360} toggle>
  
  \`\`\`ruby title="Podfile" {1,6-8,10}
  source 'https://cdn.cocoapods.org/'
  
  platform :ios, '10.0'
  
  target 'YourTarget' do
    pod 'Lynx', '3.4.1', :subspecs => [
      'Framework',
    ]
  
    pod 'PrimJS', '2.14.1', :subspecs => ['quickjs', 'napi']
  end
  \`\`\`
  
  </CodeFold>
  
  2. **Lynx Service**
  
  Lynx provides standard native Image, Log, and Http service capabilities, which can be quickly accessed and used by the access party;
  
  Get the latest version of Lynx Service from Cocoapods. Then add Lynx Service to your Podfile:
  
  </Steps>
  `;

    const result = await compile(input, {
      remarkPlugins: [
        [
          remarkSplitMdx,
          {
            includes: [[['Content'], '@lynx']],
          },
        ],
      ],
      jsx: true,
    });

    const code = String(result);
    expect(code).toMatchInlineSnapshot(`
      "/*@jsxRuntime automatic*/
      /*@jsxImportSource react*/
      function _createMdxContent(props) {
        return <><>{"<Steps>"}{"### Configuring Deps\\n1. **Lynx**\\nThe core capabilities of [Lynx Engine](/guide/spec.html#engine) include basic capabilities such as parsing [Bundle](/guide/spec.html#lynx-bundle-or-bundle), style parsing, layout, and rendering views\\nGet the latest version of Lynx from Cocoapods. Then add Lynx to your Podfile:\\n"}<>{"<CodeFold height={360} toggle>"}{"\`\`\`ruby title=\\"Podfile\\" {1,6-8,10}\\nsource 'https://cdn.cocoapods.org/'\\n\\nplatform :ios, '10.0'\\n\\ntarget 'YourTarget' do\\n  pod 'Lynx', '3.4.1', :subspecs => [\\n    'Framework',\\n  ]\\n\\n  pod 'PrimJS', '2.14.1', :subspecs => ['quickjs', 'napi']\\nend\\n\`\`\`\\n"}{"</CodeFold>"}</>{"2. **Lynx Service**\\nLynx provides standard native Image, Log, and Http service capabilities, which can be quickly accessed and used by the access party;\\nGet the latest version of Lynx Service from Cocoapods. Then add Lynx Service to your Podfile:\\n"}{"</Steps>"}</></>;
      }
      export default function MDXContent(props = {}) {
        const {wrapper: MDXLayout} = props.components || ({});
        return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
      }
      "
    `);
  });
});
