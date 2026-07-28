import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { DEV_COPY_WARNING, getLlmsCopyContent } from './getLlmsCopyContent';

afterEach(() => {
  rs.restoreAllMocks();
});

describe('getLlmsCopyContent', () => {
  it('returns and logs a warning in development mode', async () => {
    const fetchSpy = rs.spyOn(globalThis, 'fetch');
    const warnSpy = rs.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(getLlmsCopyContent('/guide/index.md', true)).resolves.toBe(
      DEV_COPY_WARNING,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(DEV_COPY_WARNING);
  });

  it('fetches Markdown content in production mode', async () => {
    const warnSpy = rs.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchSpy = rs
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('# Hello'));

    await expect(
      getLlmsCopyContent('/guide/production.md', false),
    ).resolves.toBe('# Hello');
    expect(fetchSpy).toHaveBeenCalledWith('/guide/production.md');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
