import type { IRangeTransformerOptions, ITransformer } from '../types';
import { addClass } from '../utils/add-class';
import { checkClass } from '../utils/check-class';
import { createRangeTransformer } from '../utils/create-range-transformer';

export interface ITransformerHighlightOptions extends IRangeTransformerOptions {
  classActivePre?: string;
  classActiveLine?: string;
}

export function createTransformerHighlight(
  options: ITransformerHighlightOptions = {},
): ITransformer {
  const { classActiveLine = 'highlighted', classActivePre = 'has-highlight' } =
    options;

  return {
    name: 'shiki-transformer:highlight',
    preTransformer: createRangeTransformer(
      {
        highlight: classActiveLine,
        hl: classActiveLine,
      },
      options,
    ),
    postTransformer: ({ code }) => {
      if (!checkClass(code, classActiveLine)) {
        return code;
      }

      return addClass(code, classActivePre, 'pre');
    },
  };
}
