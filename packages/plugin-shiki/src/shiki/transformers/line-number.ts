import type { ShikiTransformer } from 'shiki';

export interface ITransformerLineNumberOptions {
  classActivePre?: string;
  classActiveLine?: string;
}

export const SHIKI_TRANSFORMER_LINE_NUMBER = 'shiki-transformer:line-number';

export function createTransformerLineNumber(
  options: ITransformerLineNumberOptions = {},
): ShikiTransformer {
  const {
    classActiveLine = 'line-number',
    classActivePre = 'has-line-number',
  } = options;

  return {
    name: SHIKI_TRANSFORMER_LINE_NUMBER,
    pre(pre) {
      return this.addClassToHast(pre, classActivePre);
    },
    line(node) {
      this.addClassToHast(node, classActiveLine);
    },
  };
}
