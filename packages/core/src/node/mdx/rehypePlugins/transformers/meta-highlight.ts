/**
 * these codes are copied from @shiki/transformers, transformerMetaHighlight
 * @source https://github.com/shikijs/shiki/blob/f5cf06f55a0b4643d7b02f15ee2c5033be6f1245/packages/transformers/src/transformers/meta-highlight.ts#L56
 * @license MIT
 */
import type { ShikiTransformer } from 'shiki';

function parseMetaHighlightString(meta: string): number[] | null {
  if (!meta) return null;
  const match = meta.match(/\{([\d,-]+)\}/);
  if (!match) return null;
  const lines = match[1].split(',').flatMap(v => {
    const num = v.split('-').map(v => Number.parseInt(v, 10));
    if (num.length === 1) return [num[0]];
    return Array.from({ length: num[1] - num[0] + 1 }, (_, i) => i + num[0]);
  });
  return lines;
}

export interface TransformerMetaHighlightOptions {
  /**
   * Class for highlighted lines
   *
   * @default 'highlighted'
   */
  classActiveLine?: string;
  /**
   *
   * @default 'has-highlighted'
   */
  classActivePre?: string;
}

const symbol = Symbol('highlighted-lines');

export const SHIKI_TRANSFORMER_META_HIGHLIGHT =
  'shiki-transformer:compatible-meta-highlight';

/**
 * Allow using `{1,3-5}` in the code snippet meta to mark highlighted lines.
 * @deprecated This is a workaround when migrating to Rspress 2.0, you should migrate to `import { transformerNotationHighlight } from '@shikijs/transformers'` instead.
 */
export function transformerCompatibleMetaHighlight(
  options: TransformerMetaHighlightOptions = {},
): ShikiTransformer {
  const {
    classActiveLine = 'highlighted',
    classActivePre = 'has-highlighted',
  } = options;

  return {
    name: '@shikijs/transformers:meta-highlight',
    line(node, line) {
      if (!this.options.meta?.__raw) {
        return;
      }
      const meta = this.meta as {
        [symbol]: number[] | null;
      };

      meta[symbol] ??= parseMetaHighlightString(this.options.meta.__raw);
      const lines: number[] = meta[symbol] ?? [];

      if (lines.includes(line)) this.addClassToHast(node, classActiveLine);
      return node;
    },
    pre(hast) {
      this.addClassToHast(hast, classActivePre);
      return hast;
    },
  };
}
