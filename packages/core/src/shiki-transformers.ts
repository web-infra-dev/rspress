import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
  transformerRemoveNotationEscape,
} from '@shikijs/transformers';
import type { ShikiTransformer } from 'shiki';

export * from '@shikijs/transformers';
export * from './node/mdx/rehypePlugins/transformers/index';

/** @internal */
export function getShikiTransformers(
  transformers: ShikiTransformer[] = [],
): ShikiTransformer[] {
  const customNames = new Set(
    transformers.map(transformer => transformer.name),
  );
  const defaults = [
    transformerNotationHighlight(),
    transformerNotationWordHighlight(),
    transformerNotationDiff(),
    transformerNotationFocus(),
    transformerNotationErrorLevel(),
    transformerRemoveNotationEscape(),
  ];

  return [
    ...defaults.filter(transformer => !customNames.has(transformer.name)),
    ...transformers,
  ];
}
