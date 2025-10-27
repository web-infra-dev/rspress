import path from 'path';
import { describe, expect, it } from 'vitest';
import { getHoverInfo } from './getHoverInfo';

describe('getHoverInfo', () => {
  it('should get hover info for Foo interface', () => {
    const fixtureBasic = path.join(__dirname, 'fixtures', 'basic.ts');
    const result = getHoverInfo({
      Foo: fixtureBasic,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "Foo": {
          "all": [
            {
              "character": 17,
              "docs": undefined,
              "length": 3,
              "line": 0,
              "start": 17,
              "tags": undefined,
              "target": "Foo",
              "text": "interface Foo",
              "type": "hover",
            },
            {
              "character": 2,
              "docs": "a is a number",
              "length": 1,
              "line": 4,
              "start": 56,
              "tags": undefined,
              "target": "a",
              "text": "(property) Foo.a: number",
              "type": "hover",
            },
            {
              "character": 2,
              "docs": "b is a string",
              "length": 1,
              "line": 11,
              "start": 174,
              "tags": [
                [
                  "example",
                  "const a: Foo = {a: 1, b: "hello"};
      a.b = "world";",
                ],
              ],
              "target": "b",
              "text": "(property) Foo.b: string",
              "type": "hover",
            },
            {
              "character": 12,
              "docs": undefined,
              "length": 3,
              "line": 15,
              "start": 201,
              "tags": undefined,
              "target": "Bar",
              "text": "type Bar = string",
              "type": "hover",
            },
          ],
          "main": [
            {
              "character": 17,
              "docs": undefined,
              "length": 3,
              "line": 0,
              "start": 17,
              "tags": undefined,
              "target": "Foo",
              "text": "interface Foo",
              "type": "hover",
            },
          ],
          "members": {
            "a": [
              {
                "character": 2,
                "docs": "a is a number",
                "length": 1,
                "line": 4,
                "start": 56,
                "tags": undefined,
                "target": "a",
                "text": "(property) Foo.a: number",
                "type": "hover",
              },
            ],
            "b": [
              {
                "character": 2,
                "docs": "b is a string",
                "length": 1,
                "line": 11,
                "start": 174,
                "tags": [
                  [
                    "example",
                    "const a: Foo = {a: 1, b: "hello"};
      a.b = "world";",
                  ],
                ],
                "target": "b",
                "text": "(property) Foo.b: string",
                "type": "hover",
              },
            ],
          },
        },
      }
    `);
  });

  it('should get hover info for Props extens', async () => {
    const fixtureProps = path.join(__dirname, 'fixtures', 'props.ts');
    const result = getHoverInfo({
      LinkProps: fixtureProps,
    });
    expect(result).toMatchInlineSnapshot(`
      {
        "LinkProps": {
          "all": [
            {
              "character": 14,
              "docs": "Used to retrieve the props a component accepts. Can either be passed a string,
      indicating a DOM element (e.g. 'div', 'span', etc.) or the type of a React
      component.

      It's usually better to use 
      {@link 
      ComponentPropsWithRef
      }
       or 
      {@link 
      ComponentPropsWithoutRef
      }

      instead of this type, as they let you be explicit about whether or not to include
      the \`ref\` prop.",
              "length": 14,
              "line": 1,
              "start": 15,
              "tags": [
                [
                  "see",
                  "{@link https://react-typescript-cheatsheet.netlify.app/docs/react-types/componentprops/ React TypeScript Cheatsheet}",
                ],
                [
                  "example",
                  "\`\`\`tsx
      // Retrieves the props an 'input' element accepts
      type InputProps = React.ComponentProps<'input'>;
      \`\`\`",
                ],
                [
                  "example",
                  "\`\`\`tsx
      const MyComponent = (props: { foo: number, bar: string }) => <div />;

      // Retrieves the props 'MyComponent' accepts
      type MyComponentProps = React.ComponentProps<typeof MyComponent>;
      \`\`\`",
                ],
              ],
              "target": "ComponentProps",
              "text": "(alias) type ComponentProps<T extends keyof React.JSX.IntrinsicElements | React.JSXElementConstructor<any>> = T extends React.JSXElementConstructor<infer Props> ? Props : T extends keyof React.JSX.IntrinsicElements ? React.JSX.IntrinsicElements[T] : {}
      import ComponentProps",
              "type": "hover",
            },
            {
              "character": 17,
              "docs": undefined,
              "length": 9,
              "line": 3,
              "start": 64,
              "tags": undefined,
              "target": "LinkProps",
              "text": "interface LinkProps",
              "type": "hover",
            },
            {
              "character": 35,
              "docs": "Used to retrieve the props a component accepts. Can either be passed a string,
      indicating a DOM element (e.g. 'div', 'span', etc.) or the type of a React
      component.

      It's usually better to use 
      {@link 
      ComponentPropsWithRef
      }
       or 
      {@link 
      ComponentPropsWithoutRef
      }

      instead of this type, as they let you be explicit about whether or not to include
      the \`ref\` prop.",
              "length": 14,
              "line": 3,
              "start": 82,
              "tags": [
                [
                  "see",
                  "{@link https://react-typescript-cheatsheet.netlify.app/docs/react-types/componentprops/ React TypeScript Cheatsheet}",
                ],
                [
                  "example",
                  "\`\`\`tsx
      // Retrieves the props an 'input' element accepts
      type InputProps = React.ComponentProps<'input'>;
      \`\`\`",
                ],
                [
                  "example",
                  "\`\`\`tsx
      const MyComponent = (props: { foo: number, bar: string }) => <div />;

      // Retrieves the props 'MyComponent' accepts
      type MyComponentProps = React.ComponentProps<typeof MyComponent>;
      \`\`\`",
                ],
              ],
              "target": "ComponentProps",
              "text": "(alias) type ComponentProps<T extends keyof React.JSX.IntrinsicElements | React.JSXElementConstructor<any>> = T extends React.JSXElementConstructor<infer Props> ? Props : T extends keyof React.JSX.IntrinsicElements ? React.JSX.IntrinsicElements[T] : {}
      import ComponentProps",
              "type": "hover",
            },
            {
              "character": 2,
              "docs": undefined,
              "length": 4,
              "line": 4,
              "start": 106,
              "tags": undefined,
              "target": "href",
              "text": "(property) LinkProps.href?: string | undefined",
              "type": "hover",
            },
            {
              "character": 2,
              "docs": undefined,
              "length": 8,
              "line": 5,
              "start": 123,
              "tags": undefined,
              "target": "children",
              "text": "(property) LinkProps.children?: React.ReactNode",
              "type": "hover",
            },
            {
              "character": 13,
              "docs": undefined,
              "length": 5,
              "line": 5,
              "start": 134,
              "tags": undefined,
              "target": "React",
              "text": "(alias) namespace React
      export namespace React",
              "type": "hover",
            },
            {
              "character": 19,
              "docs": "Represents all of the things React can render.

      Where 
      {@link 
      ReactElement
      }
       only represents JSX, \`ReactNode\` represents everything that can be rendered.",
              "length": 9,
              "line": 5,
              "start": 140,
              "tags": [
                [
                  "see",
                  "{@link https://react-typescript-cheatsheet.netlify.app/docs/react-types/reactnode/ React TypeScript Cheatsheet}",
                ],
                [
                  "example",
                  "\`\`\`tsx
      // Typing children
      type Props = { children: ReactNode }

      const Component = ({ children }: Props) => <div>{children}</div>

      <Component>hello</Component>
      \`\`\`",
                ],
                [
                  "example",
                  "\`\`\`tsx
      // Typing a custom element
      type Props = { customElement: ReactNode }

      const Component = ({ customElement }: Props) => <div>{customElement}</div>

      <Component customElement={<div>hello</div>} />
      \`\`\`",
                ],
              ],
              "target": "ReactNode",
              "text": "type React.ReactNode = string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<...> | null | undefined",
              "type": "hover",
            },
            {
              "character": 2,
              "docs": undefined,
              "length": 9,
              "line": 6,
              "start": 153,
              "tags": undefined,
              "target": "className",
              "text": "(property) LinkProps.className?: string | undefined",
              "type": "hover",
            },
            {
              "character": 2,
              "docs": undefined,
              "length": 12,
              "line": 7,
              "start": 175,
              "tags": undefined,
              "target": "onMouseEnter",
              "text": "(property) LinkProps.onMouseEnter?: ((event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void) | undefined",
              "type": "hover",
            },
            {
              "character": 4,
              "docs": undefined,
              "length": 5,
              "line": 8,
              "start": 196,
              "tags": undefined,
              "target": "event",
              "text": "(parameter) event: React.MouseEvent<HTMLAnchorElement, MouseEvent>",
              "type": "hover",
            },
            {
              "character": 11,
              "docs": undefined,
              "length": 5,
              "line": 8,
              "start": 203,
              "tags": undefined,
              "target": "React",
              "text": "(alias) namespace React
      export namespace React",
              "type": "hover",
            },
            {
              "character": 17,
              "docs": undefined,
              "length": 10,
              "line": 8,
              "start": 209,
              "tags": undefined,
              "target": "MouseEvent",
              "text": "interface React.MouseEvent<T = Element, E = MouseEvent>",
              "type": "hover",
            },
            {
              "character": 28,
              "docs": "Hyperlink elements and provides special properties and methods (beyond those of the regular HTMLElement object interface that they inherit from) for manipulating the layout and presentation of such elements.

      [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLAnchorElement)",
              "length": 17,
              "line": 8,
              "start": 220,
              "tags": undefined,
              "target": "HTMLAnchorElement",
              "text": "interface HTMLAnchorElement",
              "type": "hover",
            },
            {
              "character": 47,
              "docs": "Events that occur due to the user interacting with a pointing device (such as a mouse). Common events using this interface include click, dblclick, mouseup, mousedown.

      [MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent)",
              "length": 10,
              "line": 8,
              "start": 239,
              "tags": undefined,
              "target": "MouseEvent",
              "text": "interface MouseEvent",
              "type": "hover",
            },
          ],
          "main": [
            {
              "character": 17,
              "docs": undefined,
              "length": 9,
              "line": 3,
              "start": 64,
              "tags": undefined,
              "target": "LinkProps",
              "text": "interface LinkProps",
              "type": "hover",
            },
          ],
          "members": {
            "children?": [
              {
                "character": 2,
                "docs": undefined,
                "length": 8,
                "line": 5,
                "start": 123,
                "tags": undefined,
                "target": "children",
                "text": "(property) LinkProps.children?: React.ReactNode",
                "type": "hover",
              },
            ],
            "className?": [
              {
                "character": 2,
                "docs": undefined,
                "length": 9,
                "line": 6,
                "start": 153,
                "tags": undefined,
                "target": "className",
                "text": "(property) LinkProps.className?: string | undefined",
                "type": "hover",
              },
            ],
            "href?": [
              {
                "character": 2,
                "docs": undefined,
                "length": 4,
                "line": 4,
                "start": 106,
                "tags": undefined,
                "target": "href",
                "text": "(property) LinkProps.href?: string | undefined",
                "type": "hover",
              },
            ],
            "onMouseEnter?": [
              {
                "character": 2,
                "docs": undefined,
                "length": 12,
                "line": 7,
                "start": 175,
                "tags": undefined,
                "target": "onMouseEnter",
                "text": "(property) LinkProps.onMouseEnter?: ((event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void) | undefined",
                "type": "hover",
              },
            ],
          },
        },
      }
    `);
  });
});
