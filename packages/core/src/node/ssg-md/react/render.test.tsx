import { describe, expect, it } from '@rstest/core';
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

  it('does not wrap <pre><code> with inline backticks', async () => {
    // In MDX compilation, fenced code blocks usually become <pre><code>...</code></pre>.
    // We must NOT render the inner <code> as inline code (`...`) or we'd end up with
    // nested backticks inside the fence.
    expect(
      await renderToMarkdownString(
        <pre data-lang="ts" data-title="rspress.config.ts">
          <code>{'const a = 1;\n'}</code>
        </pre>,
      ),
    ).toMatchInlineSnapshot(`
      "
      \`\`\`ts title=rspress.config.ts
      const a = 1;

      \`\`\`
      "
    `);
  });

  it('should handle mdx language with ```` four backticks', async () => {
    expect(
      await renderToMarkdownString(
        <pre data-lang="mdx">
          <code>{`# Hello World
\`\`\`tsx
console.log('Hello, world!');
\`\`\`
`}</code>
        </pre>,
      ),
    ).toMatchInlineSnapshot(`
      "
      \`\`\`\`mdx
      # Hello World
      \`\`\`tsx
      console.log('Hello, world!');
      \`\`\`

      \`\`\`\`
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

describe('renderToMarkdownString - effects never execute (SSR behavior)', () => {
  it('useEffect callback never executes - document access does not throw', async () => {
    const effectLog: string[] = [];

    const Comp = () => {
      useEffect(() => {
        // This would throw "document is not defined" if the effect ran in Node.js
        effectLog.push('useEffect ran');
        document.documentElement.setAttribute('data-test', 'true');
      }, []);
      return <p>Content</p>;
    };

    const result = await renderToMarkdownString(<Comp />);
    expect(result).toMatchInlineSnapshot(`
      "Content

      "
    `);
    expect(effectLog).toEqual([]);
  });

  it('useLayoutEffect callback never executes - document access does not throw', async () => {
    const effectLog: string[] = [];

    const Comp = () => {
      useLayoutEffect(() => {
        effectLog.push('useLayoutEffect ran');
        document.documentElement.setAttribute('data-test', 'true');
      }, []);
      return <p>Content</p>;
    };

    const result = await renderToMarkdownString(<Comp />);
    expect(result).toMatchInlineSnapshot(`
      "Content

      "
    `);
    expect(effectLog).toEqual([]);
  });

  it('useInsertionEffect callback never executes', async () => {
    const effectLog: string[] = [];

    const Comp = () => {
      useInsertionEffect(() => {
        effectLog.push('useInsertionEffect ran');
      }, []);
      return <p>Content</p>;
    };

    const result = await renderToMarkdownString(<Comp />);
    expect(result).toMatchInlineSnapshot(`
      "Content

      "
    `);
    expect(effectLog).toEqual([]);
  });

  it('cleanup functions are never called', async () => {
    const effectLog: string[] = [];

    const Comp = () => {
      useEffect(() => {
        effectLog.push('useEffect mount');
        return () => {
          effectLog.push('useEffect cleanup');
        };
      }, []);
      useLayoutEffect(() => {
        effectLog.push('useLayoutEffect mount');
        return () => {
          effectLog.push('useLayoutEffect cleanup');
        };
      }, []);
      return <p>Content</p>;
    };

    await renderToMarkdownString(<Comp />);
    expect(effectLog).toEqual([]);
  });

  it('multiple effects in the same component are all suppressed', async () => {
    const effectLog: string[] = [];

    const Comp = () => {
      useEffect(() => {
        effectLog.push('effect-1');
      }, []);
      useEffect(() => {
        effectLog.push('effect-2');
      }, []);
      useLayoutEffect(() => {
        effectLog.push('layout-effect-1');
      }, []);
      useLayoutEffect(() => {
        effectLog.push('layout-effect-2');
      }, []);
      return <p>Content</p>;
    };

    await renderToMarkdownString(<Comp />);
    expect(effectLog).toEqual([]);
  });

  it('effects in nested child components are suppressed', async () => {
    const effectLog: string[] = [];

    const Child = () => {
      useEffect(() => {
        effectLog.push('child useEffect');
      }, []);
      useLayoutEffect(() => {
        effectLog.push('child useLayoutEffect');
      }, []);
      return <span>Child</span>;
    };

    const Parent = () => {
      useEffect(() => {
        effectLog.push('parent useEffect');
      }, []);
      return (
        <div>
          <Child />
        </div>
      );
    };

    const result = await renderToMarkdownString(<Parent />);
    expect(result).toBe('Child');
    expect(effectLog).toEqual([]);
  });

  it('useState returns initial value (effects that would update state are suppressed)', async () => {
    const Comp = () => {
      const [value, setValue] = useState('initial');
      useEffect(() => {
        setValue('from-effect');
      }, []);
      useLayoutEffect(() => {
        setValue('from-layout-effect');
      }, []);
      return <p>{value}</p>;
    };

    const result = await renderToMarkdownString(<Comp />);
    expect(result).toMatchInlineSnapshot(`
      "initial

      "
    `);
  });

  it('useRef, useMemo, useContext still work alongside suppressed effects', async () => {
    const MyContext = createContext('default-ctx');

    const Comp = () => {
      const ref = useRef('ref-value');
      const memo = useMemo(() => 'memo-value', []);
      const ctx = useContext(MyContext);

      useEffect(() => {
        // This should NOT run
        throw new Error('useEffect should not run');
      }, []);

      return (
        <p>
          {ref.current},{memo},{ctx}
        </p>
      );
    };

    const result = await renderToMarkdownString(
      <MyContext.Provider value="provided">
        <Comp />
      </MyContext.Provider>,
    );
    expect(result).toMatchInlineSnapshot(`
      "ref-value,memo-value,provided

      "
    `);
  });

  it('effects are suppressed independently per renderToMarkdownString call', async () => {
    const effectLog: string[] = [];

    const Comp = ({ id }: { id: string }) => {
      useEffect(() => {
        effectLog.push(`effect-${id}`);
      }, [id]);
      return <p>{id}</p>;
    };

    await renderToMarkdownString(<Comp id="first" />);
    await renderToMarkdownString(<Comp id="second" />);
    await renderToMarkdownString(<Comp id="third" />);

    expect(effectLog).toEqual([]);
  });

  it('effects with conditional deps are suppressed', async () => {
    const effectLog: string[] = [];

    const Comp = ({ count }: { count: number }) => {
      useEffect(() => {
        effectLog.push(`effect-${count}`);
      }, [count]);
      useEffect(() => {
        effectLog.push('effect-no-deps');
      });
      return <p>{count}</p>;
    };

    await renderToMarkdownString(<Comp count={42} />);
    expect(effectLog).toEqual([]);
  });
});
