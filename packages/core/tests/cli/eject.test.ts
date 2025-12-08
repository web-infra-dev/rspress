import path from 'node:path';
import { fs, vol } from 'memfs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __setThemeComponentsPathForTesting,
  ejectComponent,
  getAvailableComponents,
} from '../../src/node/eject';

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

const MOCK_THEME_PATH = '/mock/theme/components';

describe('eject command', () => {
  beforeEach(() => {
    vol.reset();
    __setThemeComponentsPathForTesting(MOCK_THEME_PATH);
  });

  afterEach(() => {
    vol.reset();
    __setThemeComponentsPathForTesting(undefined);
  });

  describe('getAvailableComponents', () => {
    it('should return list of available components', async () => {
      // TODO: add more components to
      // Mock the theme components directory
      // vol.fromJSON({
      //   [`${MOCK_THEME_PATH}/Sidebar/index.tsx`]:
      //     'export const Sidebar = () => null;',
      //   [`${MOCK_THEME_PATH}/Banner/index.tsx`]:
      //     'export const Banner = () => null;',
      //   [`${MOCK_THEME_PATH}/Button/index.tsx`]:
      //     'export const Button = () => null;',
      // });

      const components = await getAvailableComponents();
      expect(components).toContain('Banner');
      expect(components).toContain('HomeFeature');
      expect(components).toContain('HomeHero');
      expect(components).toContain('HomeBackground');
      expect(components).toContain('HomeFooter');
      expect(components).toContain('Root');
    });
  });

  describe('ejectComponent', () => {
    it('should copy component files to user directory', async () => {
      const componentName = 'TestComponent';
      const themePath = path.join(MOCK_THEME_PATH, componentName);
      const destPath = path.join('/project/theme/components', componentName);

      // Setup mock file structure
      vol.fromJSON({
        [`${themePath}/index.tsx`]: `import { Link } from '@theme';\nexport const TestComponent = () => <Link>Test</Link>;`,
        [`${themePath}/styles.scss`]: '.test { color: red; }',
      });

      await ejectComponent(componentName, '/project');

      // Check files were copied
      const indexExists = await fs.promises
        .access(`${destPath}/index.tsx`)
        .then(() => true)
        .catch(() => false);
      const stylesExist = await fs.promises
        .access(`${destPath}/styles.scss`)
        .then(() => true)
        .catch(() => false);

      expect(indexExists).toBe(true);
      expect(stylesExist).toBe(true);
    });

    it('should handle nested file structures', async () => {
      const componentName = 'ComplexComponent';
      const themePath = path.join(MOCK_THEME_PATH, componentName);
      const destPath = path.join('/project/theme/components', componentName);

      // Setup mock file structure with nested files
      vol.fromJSON({
        [`${themePath}/index.tsx`]:
          'export const ComplexComponent = () => null;',
        [`${themePath}/SubComponent.tsx`]:
          'export const SubComponent = () => null;',
        [`${themePath}/utils/helper.ts`]: 'export const helper = () => {};',
      });

      await ejectComponent(componentName, '/project');

      // Check all files were copied including nested ones
      const indexExists = await fs.promises
        .access(`${destPath}/index.tsx`)
        .then(() => true)
        .catch(() => false);
      const subExists = await fs.promises
        .access(`${destPath}/SubComponent.tsx`)
        .then(() => true)
        .catch(() => false);
      const helperExists = await fs.promises
        .access(`${destPath}/utils/helper.ts`)
        .then(() => true)
        .catch(() => false);

      expect(indexExists).toBe(true);
      expect(subExists).toBe(true);
      expect(helperExists).toBe(true);
    });

    it('should exit with error for non-existent component', async () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Setup empty components directory
      vol.fromJSON({
        [`${MOCK_THEME_PATH}/Sidebar/index.tsx`]:
          'export const Sidebar = () => null;',
      });

      await expect(
        ejectComponent('NonExistentComponent', '/project'),
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });
});
