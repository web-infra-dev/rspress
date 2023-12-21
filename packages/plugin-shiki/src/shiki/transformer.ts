import type { ITransformer, ITransformerResult } from './types';

/**
 * Defines a transformer.
 */
export function defineTransformer(transformer: ITransformer): ITransformer {
  return transformer;
}

/**
 * Transforms code through the given transformer.
 */
export function transformer(
  transformers: ITransformer[],
  code: string,
  lang: string,
) {
  return transformers.reduce(
    (options, transformer) => {
      const { code, lineOptions } =
        transformer?.preTransformer?.({
          code: options.code,
          lang,
        }) ?? options;

      return {
        code,
        lineOptions: [...options.lineOptions, ...lineOptions],
      };
    },
    {
      code,
      lineOptions: [],
    } as ITransformerResult,
  );
}

/**
 * Transforms final code through the given Transformers.
 */
export function postTransformer(
  transformers: ITransformer[],
  code: string,
  lang: string,
) {
  return transformers.reduce(
    (code, transformer) =>
      transformer?.postTransformer?.({
        code,
        lang,
      }) ?? code,
    code,
  );
}
