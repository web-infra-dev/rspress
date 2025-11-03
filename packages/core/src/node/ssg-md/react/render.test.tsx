import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { describe, expect, it } from 'vitest';
import { renderToMarkdownString } from './render';

describe('renderToMarkdownString', () => {
  it('renders text', async () => {
    expect(
      await renderToMarkdownString(
        <div>
          <strong>foo</strong>
          <span>bar</span>
        </div>,
      ),
    ).toMatchInlineSnapshot(`"**foo**bar"`);
  });
  it('renders header and paragraph', async () => {
    const Comp1 = ({ children }: { children?: ReactNode }) => {
      const [count, setCount] = useState(1);
      return (
        <h1
          onClick={() => {
            setCount(count => count + 1);
          }}
        >
          Header {count} {children}
        </h1>
      );
    };
    const Comp2 = () => {
      return (
        <>
          <Comp1 />
          <p>Paragraph</p>
        </>
      );
    };

    const Comp3 = () => {
      return (
        <>
          <Comp1>{<>children text</>}</Comp1>
          <p>Paragraph</p>
        </>
      );
    };
    expect(await renderToMarkdownString(<Comp2 />)).toMatchInlineSnapshot(`
      "# Header 1 

      Paragraph

      "
    `);
    expect(await renderToMarkdownString(<Comp3 />)).toMatchInlineSnapshot(`
      "# Header 1 children text

      Paragraph

      "
    `);
  });

  it('renders markdown string', async () => {
    const context = createContext({ a: 1 });
    const Comp = () => {
      const value = useContext(context);
      return (
        <div>
          <p>{value.a}</p>
        </div>
      );
    };
    expect(
      await renderToMarkdownString(
        <context.Provider value={{ a: 2 }}>
          <div>
            <h2>Title</h2>
            <p>Paragraph</p>
            <Comp />
          </div>
        </context.Provider>,
      ),
    ).toMatchInlineSnapshot(`
      "## Title

      Paragraph

      2

      "
    `);
  });

  it('useEffect and useLayoutEffect', async () => {
    const Comp1 = ({ children }: { children?: ReactNode }) => {
      const [mounted, setMounted] = useState(false);
      useEffect(() => {
        setMounted(true);
        window.location.assign('about:blank');
      }, []);
      return (
        <>
          {mounted ? (
            <h1>
              Header {mounted} {children}
            </h1>
          ) : null}
        </>
      );
    };

    const Comp2 = ({ children }: { children?: ReactNode }) => {
      const [mounted, setMounted] = useState(false);
      useLayoutEffect(() => {
        setMounted(true);
        window.location.assign('about:blank');
      }, []);
      return (
        <>
          {mounted ? (
            <h1>
              Header {mounted} {children}
            </h1>
          ) : null}
        </>
      );
    };

    const Comp3 = () => {
      return (
        <>
          <Comp1 />
          <p>Paragraph</p>
        </>
      );
    };

    const Comp4 = () => {
      return (
        <>
          <Comp2 />
          <p>Paragraph</p>
        </>
      );
    };
    expect(await renderToMarkdownString(<Comp3 />)).toMatchInlineSnapshot(`
      "Paragraph

      "
    `);
    // SSR behavior: useLayoutEffect also does NOT run
    expect(await renderToMarkdownString(<Comp4 />)).toMatchInlineSnapshot(`
      "Paragraph

      "
    `);
  });

  it('componentDidMount', async () => {
    class Base extends React.Component {
      state: Readonly<{ mounted: boolean }> = { mounted: false };
      render(): ReactNode {
        return <div>Base {this.state.mounted}</div>;
      }
      componentDidMount(): void {
        window.location.assign('about:blank');
        this.setState({ mounted: true });
      }
    }

    expect(await renderToMarkdownString(<Base />)).toMatchInlineSnapshot(
      `"Base "`,
    );
  });

  it('text-indent of code', async () => {
    function _createMdxContent() {
      return (
        <>
          <>{'# Code Example\\n'}</>
          {'\n'}
          <>
            {
              // biome-ignore lint/suspicious/noTemplateCurlyInString: special case of ansi
              '```tsx\n"console.log(\'Hello, world!\');\nfunction greet(name: string) {\n  return `Hello, \${name}!`;\n}"\n```\n'
            }
          </>
        </>
      );
    }

    expect(
      await renderToMarkdownString(_createMdxContent()),
    ).toMatchInlineSnapshot(`
        "# Code Example\\n
        \`\`\`tsx
        "console.log('Hello, world!');
        function greet(name: string) {
          return \`Hello, \${name}!\`;
        }"
        \`\`\`
        "
      `);
  });
});

describe('renderToMarkdownString - styles', () => {
  it('renders two row correctly', async () => {
    const Comp1 = () => {
      return (
        <>
          <div>Row 1</div>
          <div>Row 2</div>
        </>
      );
    };

    expect(await renderToMarkdownString(<Comp1 />)).toMatchInlineSnapshot(
      `"Row 1Row 2"`,
    );
  });
});
