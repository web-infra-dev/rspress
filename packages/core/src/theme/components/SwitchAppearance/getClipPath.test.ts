import { describe, expect, it } from '@rstest/core';
import { getClipPath } from './getClipPath';

describe('getClipPath', () => {
  it('uses percentages relative to the view transition snapshot', () => {
    expect(
      getClipPath({
        height: 600,
        width: 800,
        x: 800,
        y: 0,
      }),
    ).toEqual(['circle(0% at 100% 0%)', 'circle(160% at 100% 0%)']);
  });
});
