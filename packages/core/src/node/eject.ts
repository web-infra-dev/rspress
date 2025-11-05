import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '@rspress/shared/logger';
import picocolors from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For testing purposes, allow overriding the theme path
let _themeComponentsPathOverride: string | undefined;

export function __setThemeComponentsPathForTesting(
  themePath: string | undefined,
): void {
  _themeComponentsPathOverride = themePath;
}

/**
 * Get the path to the theme components directory
 */
function getThemeComponentsPath(): string {
  if (_themeComponentsPathOverride) {
    return _themeComponentsPathOverride;
  }

  // From dist/node/eject.js, we need to go to dist/theme/components
  // The theme source is in packages/core/src/theme/components
  // After build, it's in packages/core/dist/theme/components
  const coreDistPath = path.resolve(__dirname, '..');
  const distThemePath = path.join(coreDistPath, 'theme', 'components');

  // For development/testing, check if src directory exists
  const srcThemePath = path.join(coreDistPath, 'src', 'theme', 'components');

  // Try to use source path first (for development), then fallback to dist path
  try {
    // Synchronously check if source path exists - this is only used for path resolution
    const fs = require('node:fs');
    if (fs.existsSync(srcThemePath)) {
      return srcThemePath;
    }
  } catch {
    // If check fails, use dist path
  }

  return distThemePath;
}

/**
 * Get all available components that can be ejected
 */
export async function getAvailableComponents(): Promise<string[]> {
  const themePath = getThemeComponentsPath();
  try {
    const entries = await fs.readdir(themePath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();
  } catch (error) {
    logger.error('Failed to read theme components directory');
    throw error;
  }
}

/**
 * Check if a component exists in the theme
 */
async function componentExists(componentName: string): Promise<boolean> {
  const themePath = getThemeComponentsPath();
  const componentPath = path.join(themePath, componentName);
  try {
    const stat = await fs.stat(componentPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Copy a directory recursively
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Transform import paths in the ejected component files
 */
async function transformImports(filePath: string): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');

  // Transform @theme imports to relative imports
  // e.g., "import { Link } from '@theme'" -> "import { Link } from '@rspress/core/theme'"
  const transformed = content.replace(
    /from ['"]@theme['"]/g,
    "from '@rspress/core/theme'",
  );

  // Transform @theme-assets imports
  // Note: @theme-assets imports cannot be directly imported by users.
  // These will need to be manually handled or we could provide helper functions.
  // For now, we keep them as is.

  if (transformed !== content) {
    await fs.writeFile(filePath, transformed, 'utf-8');
  }

  return;
}

/**
 * Transform all TypeScript/TSX files in a directory
 */
async function transformDirectory(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await transformDirectory(fullPath);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      await transformImports(fullPath);
    }
  }
}

/**
 * Eject a component from the theme
 */
export async function ejectComponent(
  componentName: string,
  cwd: string = process.cwd(),
): Promise<void> {
  // Check if component exists
  const exists = await componentExists(componentName);
  if (!exists) {
    logger.error(
      `Component "${picocolors.cyan(componentName)}" not found in theme.`,
    );
    const available = await getAvailableComponents();
    logger.info(
      `\nAvailable components:\n${available.map(c => `  - ${c}`).join('\n')}`,
    );
    process.exit(1);
  }

  // Set up paths
  const themePath = getThemeComponentsPath();
  const sourceComponentPath = path.join(themePath, componentName);
  const destThemePath = path.join(cwd, 'src', 'theme', 'components');
  const destComponentPath = path.join(destThemePath, componentName);

  // Check if component already exists in destination
  try {
    await fs.access(destComponentPath);
    logger.warn(
      `Component "${picocolors.cyan(componentName)}" already exists in ${picocolors.yellow(
        path.relative(cwd, destComponentPath),
      )}`,
    );
    logger.info('Overwriting existing component...');
  } catch {
    // Component doesn't exist, which is fine
  }

  try {
    // Create destination directory
    await fs.mkdir(destThemePath, { recursive: true });

    // Copy component directory
    await copyDir(sourceComponentPath, destComponentPath);

    // Transform imports in copied files
    await transformDirectory(destComponentPath);

    logger.success(
      `✨ Component "${picocolors.cyan(componentName)}" ejected successfully!`,
    );
    logger.info(
      `\nComponent files copied to: ${picocolors.green(
        path.relative(cwd, destComponentPath),
      )}`,
    );
    logger.info(
      `\nYou can now customize the component. To use it in your theme, you'll need to:\n` +
        `  1. Import it in your custom theme file\n` +
        `  2. Re-export or use it in your layouts\n`,
    );
  } catch (error) {
    logger.error(`Failed to eject component: ${error}`);
    throw error;
  }
}

/**
 * List all available components
 */
export async function listComponents(): Promise<void> {
  const components = await getAvailableComponents();
  logger.info(`\n📦 Available components to eject:\n`);
  components.forEach(component => {
    logger.info(`  ${picocolors.cyan('•')} ${component}`);
  });
  logger.info(
    `\n💡 Usage: ${picocolors.dim('rspress eject <ComponentName>')}\n`,
  );
}
