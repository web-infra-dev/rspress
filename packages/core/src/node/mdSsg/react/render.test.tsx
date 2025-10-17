import { createContext, useContext, useState } from 'react';
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
    const Comp1 = () => {
      const [count, setCount] = useState(1);
      return (
        <h1
          onClick={() => {
            setCount(count => count + 1);
          }}
        >
          Header {count}
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
    expect(await renderToMarkdownString(<Comp2 />)).toMatchInlineSnapshot(`
      "# Header 1

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
});
