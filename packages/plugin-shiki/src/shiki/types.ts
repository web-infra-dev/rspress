import type { HtmlRendererOptions } from 'shiki';

export type TLineOptions = NonNullable<HtmlRendererOptions['lineOptions']>;
export interface ITransformerResult {
  code: string;
  lineOptions: TLineOptions;
}

export type TPostTransformerResult = string | undefined;

export interface ITransformerOptions {
  code: string;
  lang: string;
}

export type TPreTransformer = (
  options: ITransformerOptions,
) => ITransformerResult;
export type TPostTransformerHandler = (
  options: ITransformerOptions,
) => TPostTransformerResult;

export interface IRangeTransformerOptions {
  tagRegExp?: RegExp;
}

export interface ITransformer {
  name: string;
  preTransformer?: TPreTransformer;
  postTransformer?: TPostTransformerHandler;
}
