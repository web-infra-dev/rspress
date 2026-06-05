import { describe, expect, test } from '@rstest/core';
import type { Root } from 'mdast';

import { collectHeadingIds } from './anchor';

const heading = (depth: number, children: unknown[]) => ({
  type: 'heading',
  depth,
  children,
});

const text = (value: string) => ({
  type: 'text',
  value,
});

describe('anchor', () => {
  test('collects heading ids from h1 to h6', () => {
    const tree = {
      type: 'root',
      children: [
        heading(1, [text('Title')]),
        heading(2, [text('Section')]),
        heading(5, [text('Deep Section')]),
        heading(6, [text('Deepest Section')]),
      ],
    } as Root;

    expect(Array.from(collectHeadingIds(tree))).toEqual([
      'title',
      'section',
      'deep-section',
      'deepest-section',
    ]);
  });

  test('supports duplicate headings', () => {
    const tree = {
      type: 'root',
      children: [
        heading(2, [text('Duplicate')]),
        heading(2, [text('Duplicate')]),
      ],
    } as Root;

    expect(Array.from(collectHeadingIds(tree))).toEqual([
      'duplicate',
      'duplicate-1',
    ]);
  });

  test('supports custom heading ids', () => {
    const tree = {
      type: 'root',
      children: [heading(2, [text('Hello world {#custom-id}')])],
    } as Root;

    expect(Array.from(collectHeadingIds(tree))).toEqual(['custom-id']);
  });

  test('supports inline formatting in headings', () => {
    const tree = {
      type: 'root',
      children: [
        heading(2, [
          text('Using '),
          { type: 'inlineCode', value: 'useState' },
          text(' hook'),
        ]),
        heading(2, [
          text('Bold '),
          { type: 'strong', children: [text('heading')] },
        ]),
      ],
    } as Root;

    expect(Array.from(collectHeadingIds(tree))).toEqual([
      // cspell:disable-next-line
      'using-usestate-hook',
      'bold-heading',
    ]);
  });
});
