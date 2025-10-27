import path from 'path';
import { describe, expect, it } from 'vitest';
import { getInterfaceInfoWithTsMorph } from './getHoverInfoTsMorph';

describe('getHoverInfo', () => {
  it('should get hover info for Foo interface', () => {
    const fixtureBasic = path.join(__dirname, 'fixtures', 'basic.ts');
    const result = getInterfaceInfoWithTsMorph(fixtureBasic, 'Foo');

    expect(result).toMatchInlineSnapshot(`
      {
        "docs": undefined,
        "extends": undefined,
        "members": [
          {
            "docs": "a is a number",
            "name": "a",
            "optional": false,
            "readonly": false,
            "tags": undefined,
            "type": "number",
          },
          {
            "docs": "b is a string",
            "name": "b",
            "optional": false,
            "readonly": false,
            "tags": [
              {
                "name": "example",
                "text": "const a: Foo = {a: 1, b: "hello"};
      a.b = "world";",
              },
            ],
            "type": "string",
          },
          {
            "docs": "\`\`\`ts
      import { Bar } from './basic';
      const myBar: Bar = "This is a Bar";
      \`\`\`",
            "name": "c",
            "optional": false,
            "readonly": false,
            "tags": undefined,
            "type": "string",
          },
        ],
        "name": "Foo",
        "typeParameters": undefined,
      }
    `);
  });

  it('should get hover info for Props extens', async () => {
    const fixtureProps = path.join(__dirname, 'fixtures', 'props.ts');
    const result = getInterfaceInfoWithTsMorph(fixtureProps, 'LinkProps');
    expect(result).toMatchInlineSnapshot(`
      {
        "docs": undefined,
        "extends": [
          "ComponentProps<'a'>",
        ],
        "members": [
          {
            "docs": undefined,
            "name": "href",
            "optional": true,
            "readonly": false,
            "tags": undefined,
            "type": "string | undefined",
          },
          {
            "docs": undefined,
            "name": "children",
            "optional": true,
            "readonly": false,
            "tags": undefined,
            "type": "import("<ROOT>/node_modules/<PNPM_INNER>/@types/react/index").ReactNode",
          },
          {
            "docs": undefined,
            "name": "className",
            "optional": true,
            "readonly": false,
            "tags": undefined,
            "type": "string | undefined",
          },
          {
            "docs": undefined,
            "name": "onMouseEnter",
            "optional": true,
            "readonly": false,
            "tags": undefined,
            "type": "((event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void) | undefined",
          },
        ],
        "name": "LinkProps",
        "typeParameters": undefined,
      }
    `);
  });
});
