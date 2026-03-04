import { describe, expect, it } from '@rstest/core';
import type { Element } from 'hast';
import { transformerAddLineNumbers } from './add-line-numbers';

function createPreElement(): Element {
  return {
    type: 'element',
    tagName: 'pre',
    properties: {},
    children: [],
  };
}

function callTransformerPre(
  transformer: ReturnType<typeof transformerAddLineNumbers>,
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

describe('transformerAddLineNumbers', () => {
  it('should apply default showLineNumbers when meta has no lineNumbers keyword', () => {
    const transformer = transformerAddLineNumbers({
      defaultShowLineNumbers: true,
    });
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, 'title="foo.js"');
    expect(result.properties.lineNumbers).toBe(true);
  });

  it('should apply default showLineNumbers when meta is undefined', () => {
    const transformer = transformerAddLineNumbers({
      defaultShowLineNumbers: true,
    });
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, undefined);
    expect(result.properties.lineNumbers).toBe(true);
  });

  it('should respect lineNumbers keyword in meta over default', () => {
    const transformer = transformerAddLineNumbers({
      defaultShowLineNumbers: false,
    });
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, 'lineNumbers');
    expect(result.properties.lineNumbers).toBe(true);
  });

  it('should not add lineNumbers when default is false and meta has no keyword', () => {
    const transformer = transformerAddLineNumbers({
      defaultShowLineNumbers: false,
    });
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, 'title="foo.js"');
    expect(result.properties.lineNumbers).toBeUndefined();
  });

  it('should respect lineNumbers=false in meta to override default true', () => {
    const transformer = transformerAddLineNumbers({
      defaultShowLineNumbers: true,
    });
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, 'lineNumbers=false');
    expect(result.properties.lineNumbers).toBe(false);
  });

  it('should respect lineNumbers=false in meta when default is false', () => {
    const transformer = transformerAddLineNumbers({
      defaultShowLineNumbers: false,
    });
    const pre = createPreElement();
    const result = callTransformerPre(transformer, pre, 'lineNumbers=false');
    expect(result.properties.lineNumbers).toBe(false);
  });

  it('should respect lineNumbers=false in meta with other meta keywords', () => {
    const transformer = transformerAddLineNumbers({
      defaultShowLineNumbers: true,
    });
    const pre = createPreElement();
    const result = callTransformerPre(
      transformer,
      pre,
      'title="foo.js" lineNumbers=false',
    );
    expect(result.properties.lineNumbers).toBe(false);
  });
});
