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

  // Shiki caches parsed notation comments across transformers. Run user
  // transformers first so their matching algorithm and hook order take priority.
  return [
    ...transformers,
    ...defaults.filter(transformer => !customNames.has(transformer.name)),
  ];
}
