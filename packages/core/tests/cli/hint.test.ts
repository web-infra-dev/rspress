import { logger } from '@rspress/shared/logger';
import { describe, it, rs } from '@rstest/core';
import { fs, vol } from 'memfs';
import { hintThemeBreakingChange } from '../../src/node/logger/hint';

rs.mock('node:fs/promises', () => {
  return { default: fs.promises, ...fs.promises };
});
rs.mock('@rspress/shared/logger', () => ({
  logger: {
    info: rs.fn(),
    warn: rs.fn(),
    error: rs.fn(),
    success: rs.fn(),
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
