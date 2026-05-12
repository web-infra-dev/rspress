import { describe, expect, it } from '@rstest/core';
import type { Element } from 'hast';
import { transformerAddTitle } from './add-title';

type TransformerPreContext = {
  options: {
    meta?: {
      __raw: string;
    };
  };
};

function createPreElement(): Element {
  return {
    type: 'element',
    tagName: 'pre',
    properties: {},
    children: [],
  };
}

function callTransformerPre(
  transformer: ReturnType<typeof transformerAddTitle>,
  pre: Element,
  rawMeta?: string,
): Element {
  const context = {
    options: {
      meta: rawMeta !== undefined ? { __raw: rawMeta } : undefined,
    },
  } satisfies TransformerPreContext;
  return transformer.pre!.call(context, pre) as Element;
}

describe('transformerAddTitle', () => {
  it('should add an unquoted title from meta', () => {
    const transformer = transformerAddTitle();
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, 'title=foo.ts');
    expect(result.properties.title).toBe('foo.ts');
  });

  it('should preserve whitespace in a quoted title', () => {
    const transformer = transformerAddTitle();
    const pre = createPreElement();
    const result = callTransformerPre(
      transformer,
      pre,
      'file="./assets/reference.yaml" title="Code Block"',
    );
    expect(result.properties.title).toBe('Code Block');
  });

  it('should preserve whitespace in a quoted title with other meta', () => {
    const transformer = transformerAddTitle();
    const pre = createPreElement();
    const result = callTransformerPre(
      transformer,
      pre,
      'title="Code Block" lineNumbers wrapCode',
    );
    expect(result.properties.title).toBe('Code Block');
  });
});
