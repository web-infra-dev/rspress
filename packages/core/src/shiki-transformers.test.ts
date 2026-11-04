import { describe, expect, it } from '@rstest/core';
import { codeToHtml, type ShikiTransformer } from 'shiki';
import {
  getShikiTransformers,
  transformerNotationHighlight,
} from './shiki-transformers';

const highlight = (code: string, transformers?: ShikiTransformer[]) =>
  codeToHtml(code, {
    lang: 'ts',
    theme: 'github-light',
    transformers: getShikiTransformers(transformers),
  });

describe('default Shiki transformers', () => {
  it('supports notation syntax without configuration', async () => {
    const html = await highlight(`// [!code word:message]
const message = 'hello'; // [!code highlight]
console.log(message); // [!code ++]
console.log('removed'); // [!code --]
console.log('focused'); // [!code focus]
console.error('error'); // [!code error]
console.warn('warning'); // [!code warning]`);

    for (const className of [
      'line highlighted',
      'highlighted-word',
      'line diff add',
      'line diff remove',
      'line focused',
      'line highlighted error',
      'line highlighted warning',
    ]) {
      expect(html).toContain(`class="${className}"`);
    }
    expect(html).not.toContain('[!code');
  });

  it('preserves escaped annotations as literal text', async () => {
    const html = await highlight(
      "console.log('literal'); // [\\!code highlight]",
    );
    expect(html).toContain('[!code highlight]');
    expect(html).not.toContain('has-highlighted');
  });

  it('lets user options override a default transformer without losing other defaults', async () => {
    const custom = transformerNotationHighlight({ classActiveLine: 'custom' });
    const transformers = [custom];
    const html = await highlight(
      "console.log('custom'); // [!code highlight]\nconsole.log('diff'); // [!code ++]",
      transformers,
    );

    expect(html).toContain('class="line custom"');
    expect(html).not.toContain('class="line highlighted"');
    expect(html).toContain('class="line diff add"');
    expect(transformers).toEqual([custom]);
  });

  it('runs additional custom transformers alongside the defaults', async () => {
    const html = await highlight(
      "console.log('highlight'); // [!code highlight]",
      [
        {
          name: 'custom-transformer',
          pre(node) {
            node.properties['data-custom'] = 'applied';
          },
        },
      ],
    );

    expect(html).toContain('data-custom="applied"');
    expect(html).toContain('class="line highlighted"');
  });
});
