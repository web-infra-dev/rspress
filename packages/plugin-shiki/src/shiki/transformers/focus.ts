import { checkClass } from '../utils/check-class';
import type { IRangeTransformerOptions, ITransformer } from '../types';
import { addClass } from '../utils/add-class';
import { createRangeTransformer } from '../utils/create-range-transformer';

export interface ITransformerFocusOptions extends IRangeTransformerOptions {
  /**
   * Class for focused lines
   */
  classActiveLine?: string;
  /**
   * Class added to the root element when the code has focused lines
   */
  classActivePre?: string;
}

export function createTransformerFocus(
  options: ITransformerFocusOptions = {},
): ITransformer {
  const { classActiveLine = 'focused', classActivePre = 'has-focused' } =
    options;

  return {
    name: 'shiki-transformer:focus',
    preTransformer: createRangeTransformer(
      {
        focus: classActiveLine,
        fc: classActiveLine,
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
