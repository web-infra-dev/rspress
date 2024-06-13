import {
  getHighlighter as getShikiHighlighter,
  type Highlighter,
  type HighlighterOptions as ShikiHighlighterOptions,
} from 'shiki';

import { postTransformer, transformer } from './transformer';
import type { ITransformer } from './types';

export interface HighlighterOptions extends ShikiHighlighterOptions {
  transformers?: ITransformer[];
}

export async function getHighlighter(
  options: HighlighterOptions = {},
): Promise<Highlighter> {
  const highlighter = await getShikiHighlighter(options);
  const transformers = options.transformers ?? [];

  return {
    ...highlighter,
    codeToHtml: (str, htmlOptions) => {
      const lang =
        typeof htmlOptions === 'object' ? htmlOptions.lang! : htmlOptions!;

      const baseLineOptions =
        typeof htmlOptions === 'object' ? htmlOptions.lineOptions ?? [] : [];

      const theme =
        typeof htmlOptions === 'object' ? htmlOptions.theme : undefined;

      const { code, lineOptions } = transformer(transformers, str, lang);

      const highlighted = highlighter.codeToHtml(code, {
        lang,
        theme,
        lineOptions: [...lineOptions, ...baseLineOptions],
      });

      return postTransformer(transformers, highlighted, lang);
    },
  };
}
