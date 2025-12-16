import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { rspack } from '@rsbuild/core';

type ResolveAsyncType = (
  directory: string,
  request: string,
) => Promise<{ path?: string; error?: string }>;

const resolver = new rspack.experiments.resolver.ResolverFactory({
  extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  mainFiles: ['index'],
  mainFields: ['module', 'browser', 'main'],
  alias: {},
});

type ParseResult = {
  exports: Set<string>;
  exportStarRequests: string[];
};

function lastNonEmpty<T>(arr: T[]): T | undefined {
  return arr.length ? arr[arr.length - 1] : undefined;
}

function addNamedExportsFromSpecifier(exports: Set<string>, specifier: string) {
  specifier
    .split(',')
    .map(n => n.trim())
    .filter(Boolean)
    .forEach(item => {
      // Support `foo as bar` -> bar
      const parts = item.split(/\s+as\s+/).map(p => p.trim());
      const name = lastNonEmpty(parts);
      if (name) {
        exports.add(name);
      }
    });
}

function parseExportsFromCode(code: string): ParseResult {
  const exports = new Set<string>();
  const exportStarRequests: string[] = [];

  // export const/let/var name = ...
  const varExportRegex = /export\s+(?:const|let|var)\s+(\w+)/g;
  for (const m of code.matchAll(varExportRegex)) {
    exports.add(m[1]);
  }

  // export function / export async function / export class
  const funcOrClassRegex =
    /export\s+(?:async\s+)?function\*?\s+(\w+)|export\s+class\s+(\w+)/g;
  for (const m of code.matchAll(funcOrClassRegex)) {
    const name = m[1] || m[2];
    if (name) {
      exports.add(name);
    }
  }

  // export { a, b as c }
  const namedExportRegex = /export\s*\{([^}]+)\}(?!\s*from)/g;
  for (const m of code.matchAll(namedExportRegex)) {
    addNamedExportsFromSpecifier(exports, m[1]);
  }

  // export { a, b as c } from '...'
  const reExportRegex = /export\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g;
  for (const m of code.matchAll(reExportRegex)) {
    addNamedExportsFromSpecifier(exports, m[1]);
  }

  // export * from '...'
  const exportStarRegex = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
  for (const m of code.matchAll(exportStarRegex)) {
    exportStarRequests.push(m[1]);
  }

  if (/export\s+default/.test(code)) {
    exports.add('default');
  }

  return { exports, exportStarRequests };
}

/**
 * Convert `export *` into named exports via regex for tree-shaking friendliness.
 */
class ExportStarOptimizer {
  filepath: string;
  resolveAsync?: ResolveAsyncType;

  localExports: Set<string>;

  reExports: Map<string, { source: string; imported: string }>;

  constructor(filepath: string, resolveAsync?: ResolveAsyncType) {
    this.filepath = filepath;
    this.localExports = new Set();
    this.reExports = new Map();
    this.resolveAsync = resolveAsync;
  }

  resolve(
    directory: string,
    request: string,
  ): Promise<{ path?: string; error?: string }> {
    if (this.resolveAsync) {
      return this.resolveAsync(directory, request);
    }
    return resolver.async(directory, request);
  }

  /**
   * Parse source code to collect local exports.
   */
  parseLocalExports(code: string): void {
    const cleanCode = this.removeComments(code);
    const parsed = parseExportsFromCode(cleanCode);
    parsed.exports.forEach(name => this.localExports.add(name));
  }

  /**
   * Get all exports of a module.
   */
  async getModuleExports(
    modulePath: string,
    visited: Set<string> = new Set(),
  ): Promise<Set<string>> {
    const baseDir = dirname(this.filepath);
    const resolved = await this.resolve(baseDir, modulePath);

    if (resolved.error || !resolved.path) {
      throw new Error(resolved.error || 'Failed to resolve path');
    }

    if (visited.has(resolved.path)) {
      return new Set();
    }
    visited.add(resolved.path);

    try {
      const moduleCode = await readFile(resolved.path, 'utf-8');
      const cleanCode = this.removeComments(moduleCode);
      const parsed = parseExportsFromCode(cleanCode);

      const exports = new Set(parsed.exports);

      for (const request of parsed.exportStarRequests) {
        const targetExports = await this.getModuleExports(request, visited);
        targetExports.forEach(name => exports.add(name));
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
  resolveAsync?: ResolveAsyncType,
): Promise<string> {
  const transformer = new ExportStarOptimizer(filepath, resolveAsync);
  return transformer.transform(code);
}
