import { describe, expect, it } from '@rstest/core';
import type { Element } from 'hast';
import { transformerAddWrapCode } from './add-wrap-code';

function createPreElement(): Element {
  return {
    type: 'element',
    tagName: 'pre',
    properties: {},
    children: [],
  };
}

function callTransformerPre(
  transformer: ReturnType<typeof transformerAddWrapCode>,
  pre: Element,
  rawMeta?: string,
): Element {
  const context = {
    options: {
      meta: rawMeta !== undefined ? { __raw: rawMeta } : undefined,
    },
  };
  return transformer.pre!.call(context as any, pre) as Element;
}

describe('transformerAddWrapCode', () => {
  it('should apply default wrapCode when meta has no wrapCode keyword', () => {
    const transformer = transformerAddWrapCode({
      defaultWrapCode: true,
    });
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, 'title="foo.js"');
    expect(result.properties.wrapCode).toBe(true);
  });

  it('should apply default wrapCode when meta is undefined', () => {
    const transformer = transformerAddWrapCode({
      defaultWrapCode: true,
    });
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, undefined);
    expect(result.properties.wrapCode).toBe(true);
  });

  it('should respect wrapCode keyword in meta over default', () => {
    const transformer = transformerAddWrapCode({
      defaultWrapCode: false,
    });
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, 'wrapCode');
    expect(result.properties.wrapCode).toBe(true);
  });

  it('should not add wrapCode when default is false and meta has no keyword', () => {
    const transformer = transformerAddWrapCode({
      defaultWrapCode: false,
    });
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, 'title="foo.js"');
    expect(result.properties.wrapCode).toBeUndefined();
  });
});
