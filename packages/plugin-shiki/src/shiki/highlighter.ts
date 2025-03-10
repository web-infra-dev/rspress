import {
  type BuiltinLanguage,
  type BuiltinTheme,
  type Highlighter,
  type BundledHighlighterOptions as ShikiHighlighterOptions,
  type ShikiTransformer,
  createHighlighter as createShikiHighlighter,
} from 'shiki';

export interface HighlighterOptions
  extends ShikiHighlighterOptions<BuiltinLanguage, BuiltinTheme> {
  transformers?: ShikiTransformer[];
}

export async function getHighlighter(
  options: HighlighterOptions,
): Promise<Highlighter> {
  const highlighter = await createShikiHighlighter(options);
  const baseTransformers = options.transformers ?? [];

  return {
    ...highlighter,
    codeToHtml: (code, htmlOptions) => {
      const transformers = htmlOptions.transformers ?? [];
      return highlighter.codeToHtml(code, {
        ...htmlOptions,
        transformers: [...baseTransformers, ...transformers],
      });
    },
  };
}
