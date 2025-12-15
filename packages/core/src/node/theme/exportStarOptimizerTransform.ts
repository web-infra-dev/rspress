import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { rspack } from '@rsbuild/core';

/**
 * Convert `export *` into named exports via regex for tree-shaking friendliness.
 */
class ExportStarOptimizer {
  filepath: string;

  localExports: Set<string>;

  reExports: Map<string, { source: string; imported: string }>;

  constructor(filepath: string) {
    this.filepath = filepath;
    this.localExports = new Set();
    this.reExports = new Map();
  }

  /**
   * Parse source code to collect local exports.
   */
  parseLocalExports(code: string): void {
    // 移除注释
    const cleanCode = this.removeComments(code);

    // 1. export const/let/var name = ...
    const varExportRegex = /export\s+(?:const|let|var)\s+(\w+)/g;
    let match: RegExpExecArray | null;
    while ((match = varExportRegex.exec(cleanCode)) !== null) {
      this.localExports.add(match[1]);
    }

    // 2. export function name() {} 或 export class Name {}
    const funcClassRegex = /export\s+(?:function|class)\s+(\w+)/g;
    while ((match = funcClassRegex.exec(cleanCode)) !== null) {
      this.localExports.add(match[1]);
    }

    // 3. export { name1, name2 }
    const namedExportRegex = /export\s*\{([^}]+)\}/g;
    while ((match = namedExportRegex.exec(cleanCode)) !== null) {
      const names = match[1].split(',').map(n => {
        // Handle `name as alias`.
        const parts = n.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      });
      names.forEach(name => this.localExports.add(name));
    }

    // 4. export { name } from 'module'
    const reExportRegex = /export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
    while ((match = reExportRegex.exec(cleanCode)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/));
      const source = match[2];
      names.forEach(parts => {
        const exported = parts[parts.length - 1].trim();
        const imported = parts[0].trim();
        this.localExports.add(exported);
        this.reExports.set(exported, { source, imported });
      });
    }

    // 5. export default
    if (/export\s+default/.test(cleanCode)) {
      this.localExports.add('default');
    }
  }

  /**
   * Get all exports of a module.
   */
  async getModuleExports(modulePath: string): Promise<Set<string>> {
    const resolver = new rspack.experiments.resolver.ResolverFactory({
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
      mainFiles: ['index'],
      mainFields: ['module', 'browser', 'main'],
      alias: {},
    });

    const baseDir = dirname(this.filepath);
    const resolved = await resolver.async(baseDir, modulePath);

    if (resolved.error || !resolved.path) {
      throw new Error(resolved.error || 'Failed to resolve path');
    }

    try {
      const moduleCode = await readFile(resolved.path, 'utf-8');
      const cleanCode = this.removeComments(moduleCode);
      const exports = new Set<string>();

      // Extract export names.
      const varExportRegex = /export\s+(?:const|let|var)\s+(\w+)/g;
      let match: RegExpExecArray | null;
      while ((match = varExportRegex.exec(cleanCode)) !== null) {
        exports.add(match[1]);
      }

      const funcClassRegex = /export\s+(?:function|class)\s+(\w+)/g;
      while ((match = funcClassRegex.exec(cleanCode)) !== null) {
        exports.add(match[1]);
      }

      const namedExportRegex = /export\s*\{([^}]+)\}(?!\s*from)/g;
      while ((match = namedExportRegex.exec(cleanCode)) !== null) {
        const names = match[1].split(',').map(n => {
          const parts = n.trim().split(/\s+as\s+/);
          return parts[parts.length - 1].trim();
        });
        names.forEach(name => exports.add(name));
      }

      const reExportRegex = /export\s*\{([^}]+)\}\s*from/g;
      while ((match = reExportRegex.exec(cleanCode)) !== null) {
        const names = match[1].split(',').map(n => {
          const parts = n.trim().split(/\s+as\s+/);
          return parts[parts.length - 1].trim();
        });
        names.forEach(name => exports.add(name));
      }

      if (/export\s+default/.test(cleanCode)) {
        exports.add('default');
      }

      return exports;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Cannot parse module ${modulePath}: ${message}`);
      return new Set();
    }
  }

  /**
   * Remove comments from code.
   */
  removeComments(code: string): string {
    // Remove single-line comments
    code = code.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    return code;
  }

  /**
   * Transform code by replacing `export *`.
   */
  async transform(code: string): Promise<string> {
    // Parse local exports.
    this.parseLocalExports(code);

    // Find all `export * from 'xxx'` statements.
    const exportStarRegex = /export\s*\*\s*from\s*['"]([^'"]+)['"]\s*;?/g;
    let match: RegExpExecArray | null;
    const replacements: Array<{
      startIndex: number;
      endIndex: number;
      replacement: string;
    }> = [];

    while ((match = exportStarRegex.exec(code)) !== null) {
      const fullMatch = match[0];
      const source = match[1];
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;

      // Get exports of the target module.
      const moduleExports = await this.getModuleExports(source);

      // Filter out exports already defined locally (avoid conflicts).
      const exportsToInclude = Array.from(moduleExports)
        .filter(name => !this.localExports.has(name))
        .sort();

      // Generate the replacement export statement.
      let replacement = '';
      if (exportsToInclude.length > 0) {
        replacement = `export { ${exportsToInclude.join(', ')} } from '${source}';`;
      }

      replacements.push({ startIndex, endIndex, replacement });
    }

    // Replace from back to front to avoid index shifts.
    replacements.reverse().forEach(({ startIndex, endIndex, replacement }) => {
      code =
        code.substring(0, startIndex) + replacement + code.substring(endIndex);
    });

    return code;
  }
}

/**
 * Transform a code string.
 */
export async function exportStarOptimizerTransform(
  code: string,
  filepath: string,
): Promise<string> {
  const transformer = new ExportStarOptimizer(filepath);
  return transformer.transform(code);
}
