import { logger } from '@rspress/shared/logger';
import { fs, vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkLanguageParity } from '../src/node/utils/checkLanguageParity';

vi.mock('node:fs/promises');
vi.mock('@rspress/shared/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('checkLanguageParity', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  // base config
  const mockConfig: any = {
    root: '/content',
    locales: [{ lang: 'en' }, { lang: 'zh' }],
    languageParity: {
      enabled: true,
      include: [],
      exclude: [],
    },
  };

  it('expect check all directory when empty config', async () => {
    vol.fromJSON({
      '/content/en/docs/guide.mdx': 'English content',
      '/content/zh/docs/guide.mdx': '中文内容',
      '/content/en/api/api.mdx': 'API docs',
      // '/content/zh/api/api.mdx': 'API 文档',
    });

    try {
      await checkLanguageParity(mockConfig);
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain('zh/api/api.md');
    }
  });

  it('only check docs and about/me directory', async () => {
    vol.fromJSON({
      '/content/en/docs/guide.md': 'English content',
      '/content/zh/docs/guide.md': '中文内容',
      '/content/en/api/api.md': 'API docs',
      // '/content/zh/api/api.md': 'API 文档',
      '/content/en/about/me/secret.mdx': 'secret',
      '/content/zh/about/me/secret.mdx': '秘密',
      '/content/en/about/qq/secret.mdx': 'secret',
      // '/content/zh/about/qq/secret.mdx': '秘密',
    });
    const onlyIncludeConfig = {
      ...mockConfig,
      languageParity: {
        include: ['docs', 'about/me'],
      },
    };

    await checkLanguageParity(onlyIncludeConfig);
    expect(logger.success).toHaveBeenCalledWith(
      'Language parity checked successfully.',
    );
  });

  it('test exclude config both on path and file', async () => {
    vol.fromJSON({
      '/content/en/docs/guide.mdx': 'English content',
      '/content/zh/docs/guide.mdx': '中文内容',
      '/content/en/api/api.mdx': 'API docs',
      // '/content/zh/api/api.mdx': 'API 文档',
      '/content/en/excludePath/secret.md': 'Secret English content',
      //content/zh/excludePath/secret.md，
    });
    const excludeConfig = {
      ...mockConfig,
      languageParity: {
        exclude: ['excludePath', 'api/api.mdx'],
      },
    };
    await checkLanguageParity(excludeConfig);
    expect(logger.success).toHaveBeenCalledWith(
      'Language parity checked successfully.',
    );
  });

  it('throw error when include non-existent file', async () => {
    vol.fromJSON({
      '/content/en/docs/exists.md': 'English content',
      '/content/zh/docs/exists.md': '中文内容',
    });

    const configWithNonExistentDir = {
      ...mockConfig,
      languageParity: {
        ...mockConfig.languageParity,
        include: ['docs', 'non-existent'],
      },
    };

    await expect(async () => {
      await checkLanguageParity(configWithNonExistentDir);
    }).rejects.toThrow('Failed to access directory: /content/en/non-existent');
  });
});
