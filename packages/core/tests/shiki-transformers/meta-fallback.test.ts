import { describe, expect, it } from '@rstest/core';
import type { Element } from 'hast';
import type { ShikiTransformer } from 'shiki';
import {
  transformerAddLineNumbers,
  transformerAddTitle,
  transformerAddWrapCode,
} from '../../src/node/mdx/rehypePlugins/transformers';

function createPreElement(): Element {
  return {
    type: 'element',
    tagName: 'pre',
    properties: {},
    children: [],
  };
}

function runTransformers(
  transformers: ShikiTransformer[],
  pre: Element,
  rawMeta?: string,
): Element {
  const context = {
    options: {
      meta: rawMeta !== undefined ? { __raw: rawMeta } : undefined,
    },
  };
  let result = pre;
  for (const t of transformers) {
    result = t.pre!.call(context as any, result) as Element;
  }
  return result;
}

describe('combined transformers with meta fallback', () => {
  it('should apply both global showLineNumbers and wrapCode when meta only has title', () => {
    const transformers = [
      transformerAddTitle(),
      transformerAddLineNumbers({ defaultShowLineNumbers: true }),
      transformerAddWrapCode({ defaultWrapCode: true }),
    ];
    const pre = createPreElement();
    const result = runTransformers(transformers, pre, 'title="foo.js"');
    expect(result.properties.title).toBe('foo.js');
    expect(result.properties.lineNumbers).toBe(true);
    expect(result.properties.wrapCode).toBe(true);
  });

  it('should apply global defaults when meta has highlight ranges', () => {
    const transformers = [
      transformerAddTitle(),
      transformerAddLineNumbers({ defaultShowLineNumbers: true }),
      transformerAddWrapCode({ defaultWrapCode: true }),
    ];
    const pre = createPreElement();
    const result = runTransformers(transformers, pre, '{1,3-5}');
    expect(result.properties.title).toBeUndefined();
    expect(result.properties.lineNumbers).toBe(true);
    expect(result.properties.wrapCode).toBe(true);
  });

  it('should respect per-block meta keywords alongside title', () => {
    const transformers = [
      transformerAddTitle(),
      transformerAddLineNumbers({ defaultShowLineNumbers: false }),
      transformerAddWrapCode({ defaultWrapCode: false }),
    ];
    const pre = createPreElement();
    const result = runTransformers(
      transformers,
      pre,
      'title="example.ts" lineNumbers wrapCode',
    );
    expect(result.properties.title).toBe('example.ts');
    expect(result.properties.lineNumbers).toBe(true);
    expect(result.properties.wrapCode).toBe(true);
  });

  it('should not apply features when defaults are false and meta only has title', () => {
    const transformers = [
      transformerAddTitle(),
      transformerAddLineNumbers({ defaultShowLineNumbers: false }),
      transformerAddWrapCode({ defaultWrapCode: false }),
    ];
    const pre = createPreElement();
    const result = runTransformers(transformers, pre, 'title="foo.js"');
    expect(result.properties.title).toBe('foo.js');
    expect(result.properties.lineNumbers).toBeUndefined();
    expect(result.properties.wrapCode).toBeUndefined();
  });
});
