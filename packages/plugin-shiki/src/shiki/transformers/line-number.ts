import type { ITransformer, TLineOptions } from '../types';
import { addClass } from '../utils';

export interface ITransformerLineNumberOptions {
  classActivePre?: string;
  classActiveLine?: string;
}

export function createTransformerLineNumber(
  options: ITransformerLineNumberOptions = {},
): ITransformer {
  const {
    classActiveLine = 'line-number',
    classActivePre = 'has-line-number',
  } = options;

  return {
    name: 'shiki-transformer:line-number',
    preTransformer: ({ code }) => {
      const lineOptions = [] as TLineOptions;

      code.split('\n').forEach((_, idx) => {
        const lineNumber = idx + 1;
        lineOptions.push({
          line: lineNumber,
          classes: [classActiveLine],
        });
      });

      lineOptions.pop();

      return {
        code,
        lineOptions,
      };
    },
    postTransformer: ({ code }) => {
      return addClass(code, classActivePre, 'pre');
    },
  };
}
