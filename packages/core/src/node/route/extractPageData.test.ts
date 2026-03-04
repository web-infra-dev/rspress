import { join } from 'node:path';
import { describe, expect, it } from '@rstest/core';
import { extractPageData, getPageIndexInfoByRoute } from './extractPageData';
import type { RouteService } from './RouteService';

const fixtureContentProcessingDir = join(
  __dirname,
  './fixtures/content-processing',
);

function createRoute(relativePath: string, fixtureDir: string) {
  return {
    absolutePath: join(fixtureDir, relativePath),
    lang: '',
    pageName: relativePath.replace(/\.(mdx?|md)$/, ''),
    relativePath,
    routePath: `/${relativePath.replace(/\.(mdx?|md)$/, '')}`,
    version: '',
  };
}

describe('extractPageData', async () => {
  it('basic', async () => {
    const fixtureBasicDir = join(__dirname, './fixtures/basic');
    const absolutize = (relativePath: string) => {
      return join(fixtureBasicDir, `.${relativePath}`);
    };
    const pageData = await extractPageData(
      {
        getRoutes: () =>
          Object.values({
            '/a': {
              absolutePath: absolutize('/a.mdx'),
              lang: '',
              pageName: 'a',
              relativePath: 'a.mdx',
              routePath: '/a',
              version: '',
            },
            '/guide/b': {
              absolutePath: absolutize('/guide/b.mdx'),
              lang: '',
              pageName: 'guide_b',
              relativePath: 'guide/b.mdx',
              routePath: '/guide/b',
              version: '',
            },
            '/guide/c': {
              absolutePath: absolutize('/guide/c.tsx'),
              lang: '',
              pageName: 'guide_c',
              relativePath: 'guide/c.tsx',
              routePath: '/guide/c',
              version: '',
            },
            '/': {
              absolutePath: absolutize('/index.mdx'),
              lang: '',
              pageName: 'index',
              relativePath: 'index.mdx',
              routePath: '/',
              version: '',
            },
          }),
        getRoutePageByRoutePath: () => undefined,
      } as RouteService,
      {
        alias: {},
        replaceRules: [],
        root: fixtureBasicDir,
        searchCodeBlocks: false,
      },
    );
    expect(pageData).toMatchInlineSnapshot(`
      [
        {
          "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/basic/a.mdx",
          "_flattenContent": "# Page a
      ",
          "_relativePath": "a.mdx",
          "content": "",
          "description": undefined,
          "frontmatter": {
            "__content": undefined,
          },
          "lang": "",
          "routePath": "/a",
          "title": "Page a",
          "toc": [],
          "version": "",
        },
        {
          "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/b.mdx",
          "_flattenContent": "# Page b
      ",
          "_relativePath": "guide/b.mdx",
          "content": "",
          "description": undefined,
          "frontmatter": {
            "__content": undefined,
          },
          "lang": "",
          "routePath": "/guide/b",
          "title": "Page b",
          "toc": [],
          "version": "",
        },
        {
          "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/basic/guide/c.tsx",
          "_flattenContent": "",
          "_relativePath": "guide/c.tsx",
          "content": "",
          "frontmatter": {},
          "lang": "",
          "routePath": "/guide/c",
          "title": "",
          "toc": [],
          "version": "",
        },
        {
          "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/basic/index.mdx",
          "_flattenContent": "# homePage
      ",
          "_relativePath": "index.mdx",
          "content": "",
          "description": undefined,
          "frontmatter": {
            "__content": undefined,
          },
          "lang": "",
          "routePath": "/",
          "title": "homePage",
          "toc": [],
          "version": "",
        },
      ]
    `);
  });
});

describe('getPageIndexInfoByRoute', async () => {
  it('recursive', async () => {
    const fixtureRecursiveDir = join(__dirname, './fixtures/recursive');
    const absolutize = (relativePath: string) => {
      return join(fixtureRecursiveDir, `.${relativePath}`);
    };
    const pageIndexInfo = await getPageIndexInfoByRoute(
      {
        absolutePath: absolutize('/index.mdx'),
        lang: '',
        pageName: 'index',
        relativePath: 'index.mdx',
        routePath: '/',
        version: '',
      },
      {
        alias: {},
        replaceRules: [],
        root: fixtureRecursiveDir,
        searchCodeBlocks: false,
      },
    );
    expect(pageIndexInfo).toMatchInlineSnapshot(`
      {
        "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/recursive/index.mdx",
        "_flattenContent": "# Recursive comp test



      ## h2 Comp

      Comp content



      ## H2 comp in comp

      Comp in Comp content \`code\`


      ",
        "_relativePath": "index.mdx",
        "content": "## h2 Comp

      Comp content

      ## H2 comp in comp

      Comp in Comp content \`code\`
      ",
        "description": undefined,
        "frontmatter": {
          "__content": undefined,
        },
        "lang": "",
        "routePath": "/",
        "title": "Recursive comp test",
        "toc": [
          {
            "charIndex": 0,
            "depth": 2,
            "id": "h2-comp",
            "text": "h2 Comp",
          },
          {
            "charIndex": 26,
            "depth": 2,
            "id": "h2-comp-in-comp",
            "text": "H2 comp in comp",
          },
        ],
        "version": "",
      }
    `);
  });

  it('should remove code blocks when searchCodeBlocks is false', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-code.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    expect(pageIndexInfo).toMatchInlineSnapshot(`
      {
        "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/content-processing/with-code.mdx",
        "_flattenContent": "# Page with code

      Some text before code.

      \`\`\`javascript
      const foo = 'bar';
      console.log(foo);
      \`\`\`

      Some text after code.

      ## Section two

      More content here.
      ",
        "_relativePath": "with-code.mdx",
        "content": "Some text before code.

      Some text after code.

      ## Section two

      More content here.
      ",
        "description": "Some text before code. Some text after code.",
        "frontmatter": {
          "__content": undefined,
        },
        "lang": "",
        "routePath": "/with-code",
        "title": "Page with code",
        "toc": [
          {
            "charIndex": 47,
            "depth": 2,
            "id": "section-two",
            "text": "Section two",
          },
        ],
        "version": "",
      }
    `);
  });

  it('should keep code blocks when searchCodeBlocks is true', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-code.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: true,
      },
    );

    expect(pageIndexInfo).toMatchInlineSnapshot(`
      {
        "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/content-processing/with-code.mdx",
        "_flattenContent": "# Page with code

      Some text before code.

      \`\`\`javascript
      const foo = 'bar';
      console.log(foo);
      \`\`\`

      Some text after code.

      ## Section two

      More content here.
      ",
        "_relativePath": "with-code.mdx",
        "content": "Some text before code.

      \`\`\`javascript
      const foo = 'bar';
      console.log(foo);
      \`\`\`

      Some text after code.

      ## Section two

      More content here.
      ",
        "description": "Some text before code. Some text after code.",
        "frontmatter": {
          "__content": undefined,
        },
        "lang": "",
        "routePath": "/with-code",
        "title": "Page with code",
        "toc": [
          {
            "charIndex": 103,
            "depth": 2,
            "id": "section-two",
            "text": "Section two",
          },
        ],
        "version": "",
      }
    `);
  });

  it('should remove images from content', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-images.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    expect(pageIndexInfo).toMatchInlineSnapshot(`
      {
        "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/content-processing/with-images.mdx",
        "_flattenContent": "# Page with images

      Here is an image:

      ![Alt text](./image.png)

      And some text after.

      ## Another section

      ![Another image](https://example.com/image.jpg)

      Final text.
      ",
        "_relativePath": "with-images.mdx",
        "content": "Here is an image:

      And some text after.

      ## Another section

      Final text.
      ",
        "description": "Here is an image: And some text after.",
        "frontmatter": {
          "__content": undefined,
        },
        "lang": "",
        "routePath": "/with-images",
        "title": "Page with images",
        "toc": [
          {
            "charIndex": 41,
            "depth": 2,
            "id": "another-section",
            "text": "Another section",
          },
        ],
        "version": "",
      }
    `);
  });

  it('should strip link URLs but keep link text', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-links.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    expect(pageIndexInfo).toMatchInlineSnapshot(`
      {
        "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/content-processing/with-links.mdx",
        "_flattenContent": "# Page with links

      This is a [link to Google](https://google.com) in text.

      ## Links section

      - [First link](https://example.com/first)
      - [Second link](https://example.com/second)
      - Plain text item

      Visit [our docs](./docs/intro.md) for more info.
      ",
        "_relativePath": "with-links.mdx",
        "content": "This is a [link to Google]() in text.

      ## Links section

      - [First link]()
      - [Second link]()
      - Plain text item

      Visit [our docs]() for more info.
      ",
        "description": "This is a link to Google in text.",
        "frontmatter": {
          "__content": undefined,
        },
        "lang": "",
        "routePath": "/with-links",
        "title": "Page with links",
        "toc": [
          {
            "charIndex": 39,
            "depth": 2,
            "id": "links-section",
            "text": "Links section",
          },
        ],
        "version": "",
      }
    `);
  });

  it('should handle tables correctly', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-table.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    expect(pageIndexInfo).toMatchInlineSnapshot(`
      {
        "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/content-processing/with-table.mdx",
        "_flattenContent": "# Page with table

      Some intro text.

      | Header 1 | Header 2 | Header 3 |
      | -------- | -------- | -------- |
      | Cell 1   | Cell 2   | Cell 3   |
      | Cell 4   | Cell 5   | Cell 6   |

      ## After table

      More content.
      ",
        "_relativePath": "with-table.mdx",
        "content": "Some intro text.

      | Header 1 | Header 2 | Header 3 |
      | -------- | -------- | -------- |
      | Cell 1   | Cell 2   | Cell 3   |
      | Cell 4   | Cell 5   | Cell 6   |

      ## After table

      More content.
      ",
        "description": "Some intro text.",
        "frontmatter": {
          "__content": undefined,
        },
        "lang": "",
        "routePath": "/with-table",
        "title": "Page with table",
        "toc": [
          {
            "charIndex": 159,
            "depth": 2,
            "id": "after-table",
            "text": "After table",
          },
        ],
        "version": "",
      }
    `);
  });

  it('should use frontmatter title over heading title', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-frontmatter.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    expect(pageIndexInfo).toMatchInlineSnapshot(`
      {
        "_filepath": "<ROOT>/packages/core/src/node/route/fixtures/content-processing/with-frontmatter.mdx",
        "_flattenContent": "
      # Heading in content

      This page has frontmatter with a custom title.

      ## Section

      More content here.
      ",
        "_relativePath": "with-frontmatter.mdx",
        "content": "This page has frontmatter with a custom title.

      ## Section

      More content here.
      ",
        "description": "A page with frontmatter",
        "frontmatter": {
          "__content": undefined,
          "description": "A page with frontmatter",
          "title": "Custom Title",
        },
        "lang": "",
        "routePath": "/with-frontmatter",
        "title": "Custom Title",
        "toc": [
          {
            "charIndex": 48,
            "depth": 2,
            "id": "section",
            "text": "Section",
          },
        ],
        "version": "",
      }
    `);
  });

  it('should extract description from first paragraph before h2 when frontmatter.description is not set', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-description.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    // description field should have extracted value
    expect(pageIndexInfo.description).toBe(
      'This is the first paragraph that should be used as description.',
    );
    // frontmatter.description should remain undefined
    expect(pageIndexInfo.frontmatter.description).toBeUndefined();
  });

  it('should use frontmatter description when provided instead of extracting from content', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-frontmatter.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    // description field should use frontmatter value
    expect(pageIndexInfo.description).toBe('A page with frontmatter');
    // frontmatter.description should preserve original value
    expect(pageIndexInfo.frontmatter.description).toBe(
      'A page with frontmatter',
    );
  });

  it('should skip code blocks when extracting description', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-code.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    // Code blocks should be skipped, only paragraph text collected
    expect(pageIndexInfo.description).toBe(
      'Some text before code. Some text after code.',
    );
    // frontmatter.description should remain undefined
    expect(pageIndexInfo.frontmatter.description).toBeUndefined();
  });

  it('should collect all text between h1 and h2 for description', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute(
        'multi-paragraph-description.mdx',
        fixtureContentProcessingDir,
      ),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    // Should collect all paragraphs and list items between h1 and h2
    expect(pageIndexInfo.description).toBe(
      'This is the first paragraph. This is the second paragraph with bold and italic. List item oneList item two',
    );
    expect(pageIndexInfo.frontmatter.description).toBeUndefined();
  });

  it('should skip container directives (:::tip, :::info, etc.) when extracting description', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-container-directive.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    // Container directive content should be stripped from description
    expect(pageIndexInfo.description).toBe(
      'This is the actual description. More description text after the tip.',
    );
    expect(pageIndexInfo.frontmatter.description).toBeUndefined();
  });

  it('should skip container directives with blank lines (split across AST nodes)', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute(
        'with-container-directive-blank-lines.mdx',
        fixtureContentProcessingDir,
      ),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    expect(pageIndexInfo.description).toBe(
      'This is the description. More text after.',
    );
    expect(pageIndexInfo.frontmatter.description).toBeUndefined();
  });

  it('should skip multiple consecutive container directives', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute(
        'with-container-directive-multiple.mdx',
        fixtureContentProcessingDir,
      ),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    expect(pageIndexInfo.description).toBe(
      'Description before directives. Description after directives.',
    );
    expect(pageIndexInfo.frontmatter.description).toBeUndefined();
  });

  it('should handle unclosed container directives without dropping content', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute(
        'with-container-directive-unclosed.mdx',
        fixtureContentProcessingDir,
      ),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
      },
    );

    // The :::tip line and its inline content are stripped,
    // but "More text" is kept since the directive was never closed
    expect(pageIndexInfo.description).toBe(
      'Description text. This directive is never closed. More text that should still appear.',
    );
    expect(pageIndexInfo.frontmatter.description).toBeUndefined();
  });

  it('should not extract description when extractDescription is false', async () => {
    const pageIndexInfo = await getPageIndexInfoByRoute(
      createRoute('with-description.mdx', fixtureContentProcessingDir),
      {
        alias: {},
        replaceRules: [],
        root: fixtureContentProcessingDir,
        searchCodeBlocks: false,
        extractDescription: false,
      },
    );

    expect(pageIndexInfo.description).toBeUndefined();
    expect(pageIndexInfo.frontmatter.description).toBeUndefined();
  });
});
