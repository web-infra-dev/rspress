import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { getLlmsCopyContent } from '../../../../src/theme/components/Llms/getLlmsCopyContent';

afterEach(() => {
  rs.restoreAllMocks();
});

describe('getLlmsCopyContent', () => {
  it('fetches Markdown content in production mode', async () => {
    const warnSpy = rs.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchSpy = rs
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('# Hello'));

    await expect(getLlmsCopyContent('/guide/production.md')).resolves.toBe(
      '# Hello',
    );
    expect(fetchSpy).toHaveBeenCalledWith('/guide/production.md');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
