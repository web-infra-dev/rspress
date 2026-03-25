import { describe, expect, it } from '@rstest/core';
import type { Element } from 'hast';
import { transformerAddFold } from './add-fold';

function createPreElement(): Element {
  return {
    type: 'element',
    tagName: 'pre',
    properties: {},
    children: [],
  };
}

function callTransformerPre(
  transformer: ReturnType<typeof transformerAddFold>,
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

describe('transformerAddFold', () => {
  describe('legacy fold API', () => {
    it('should enable fold with default height when meta has fold', () => {
      const transformer = transformerAddFold();
      const pre = createPreElement();
      const result = callTransformerPre(transformer, pre, 'fold');
      expect(result.properties.fold).toBe(true);
      expect(result.properties.height).toBe(300);
    });

    it('should enable fold with custom height', () => {
      const transformer = transformerAddFold();
      const pre = createPreElement();
      const result = callTransformerPre(transformer, pre, 'fold height="200"');
      expect(result.properties.fold).toBe(true);
      expect(result.properties.height).toBe(200);
    });

    it('should not fold when fold=false', () => {
      const transformer = transformerAddFold();
      const pre = createPreElement();
      const result = callTransformerPre(transformer, pre, 'fold=false');
      expect(result.properties.fold).toBeUndefined();
    });

    it('should not fold when no fold keyword', () => {
      const transformer = transformerAddFold();
      const pre = createPreElement();
      const result = callTransformerPre(transformer, pre, 'title="foo.js"');
      expect(result.properties.fold).toBeUndefined();
    });
  });

  describe('maxHeight API', () => {
    it('should auto-enable fold when maxHeight is in meta', () => {
      const transformer = transformerAddFold();
      const pre = createPreElement();
      const result = callTransformerPre(transformer, pre, 'maxHeight="200"');
      expect(result.properties.fold).toBe(true);
      expect(result.properties.height).toBe(200);
    });

    it('should respect fold=false even with maxHeight', () => {
      const transformer = transformerAddFold();
      const pre = createPreElement();
      const result = callTransformerPre(
        transformer,
        pre,
        'fold=false maxHeight="200"',
      );
      expect(result.properties.fold).toBeUndefined();
    });

    it('maxHeight should take priority over height', () => {
      const transformer = transformerAddFold();
      const pre = createPreElement();
      const result = callTransformerPre(
        transformer,
        pre,
        'fold maxHeight="150" height="400"',
      );
      expect(result.properties.fold).toBe(true);
      expect(result.properties.height).toBe(150);
    });
  });

  describe('defaultMaxHeight config', () => {
    it('should auto-enable fold when defaultMaxHeight is set', () => {
      const transformer = transformerAddFold({ defaultMaxHeight: 250 });
      const pre = createPreElement();
      const result = callTransformerPre(transformer, pre, 'title="foo.js"');
      expect(result.properties.fold).toBe(true);
      expect(result.properties.height).toBe(250);
    });

    it('should auto-enable fold when meta is undefined', () => {
      const transformer = transformerAddFold({ defaultMaxHeight: 250 });
      const pre = createPreElement();
      const result = callTransformerPre(transformer, pre, undefined);
      expect(result.properties.fold).toBe(true);
      expect(result.properties.height).toBe(250);
    });

    it('should respect fold=false to override defaultMaxHeight', () => {
      const transformer = transformerAddFold({ defaultMaxHeight: 250 });
      const pre = createPreElement();
      const result = callTransformerPre(transformer, pre, 'fold=false');
      expect(result.properties.fold).toBeUndefined();
    });

    it('maxHeight in meta should override defaultMaxHeight', () => {
      const transformer = transformerAddFold({ defaultMaxHeight: 250 });
      const pre = createPreElement();
      const result = callTransformerPre(transformer, pre, 'maxHeight="400"');
      expect(result.properties.fold).toBe(true);
      expect(result.properties.height).toBe(400);
    });

    it('should not fold without defaultMaxHeight or fold keyword', () => {
      const transformer = transformerAddFold();
      const pre = createPreElement();
      const result = callTransformerPre(transformer, pre, undefined);
      expect(result.properties.fold).toBeUndefined();
    });
  });
});
