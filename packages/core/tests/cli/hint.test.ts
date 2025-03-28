import { logger } from '@rspress/shared/logger';
import { fs, vol } from 'memfs';
import { describe, it, vi } from 'vitest';
import { hintThemeBreakingChange } from '../../src/node/logger/hint';

vi.mock('node:fs/promises', () => {
  return { default: fs.promises, ...fs.promises };
});
vi.mock('@rspress/shared/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('hintThemeBreakingChange', () => {
  it('should log a warning when theme/index.tsx is using default exports', async () => {
    vol.fromJSON({
      '/theme/index.tsx': `
        const Theme = {};
        export default {
          ...Theme
        }
      `,
    });
    await hintThemeBreakingChange('/theme');
    expect(logger.warn).toHaveBeenCalled();
  });
});
