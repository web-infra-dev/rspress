import fs from 'node:fs';
import path from 'node:path';

import { rspack } from '@rsbuild/core';
import { MDX_OR_MD_REGEXP } from '@rspress/shared';
import { importStatementRegex } from '../constants';
import { createError } from './error';

const RspackResolveFactory = rspack.experiments.resolver.ResolverFactory;

type RspackExperiments = typeof rspack.experiments;

type RspackResolveFactory = RspackExperiments['resolver']['ResolverFactory'];

let startFlatten = false;

let resolver: InstanceType<RspackResolveFactory>;

/**
 * Regex to extract default import statements
 * Matches: import Identifier from 'path' or import Identifier from "path"
 * Group 1: identifier name
 * Group 2: import path
 */
const defaultImportRegex =
  /^import\s+([A-Z_$][A-Za-z0-9_$]*)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/gm;

export async function resolveDepPath(
  moduleSpecifier: string,
  importer: string,
  alias: Record<string, string | string[]>,
) {
  if (!resolver) {
    resolver = new RspackResolveFactory({
      extensions: ['.mdx', '.md'],
      alias,
    });
  }

  const resolved = await resolver.async(importer, moduleSpecifier);

  if (resolved.path) {
    return resolved.path;
  } else {
    throw createError(
      `Empty result when resolving ${moduleSpecifier} from ${importer}`,
    );
  }
}

/**
 * Extract default import statements from MDX content using regex
 * This is a performance optimization over using the full MDX parser
 * @returns Array of {id, importPath} for each default import found
 */
function extractDefaultImports(
  content: string,
): Array<{ id: string; importPath: string }> {
  const imports: Array<{ id: string; importPath: string }> = [];
  // Reset regex lastIndex for fresh matching
  const regex = new RegExp(defaultImportRegex.source, 'gm');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const [, id, importPath] = match;
    imports.push({ id, importPath });
  }

  return imports;
}

export async function flattenMdxContent(
  content: string,
  basePath: string,
  alias: Record<string, string | string[]>,
): Promise<{ flattenContent: string; deps: string[] }> {
  const deps: string[] = [];
  // Performance optimization: if the content does not contain any import statement, we can skip the parsing process
  // So we need to check this match

  // Create new regExp to avoid the regex cache the last match index
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test#using_test_on_a_regex_with_the_global_flag
  const regex = new RegExp(importStatementRegex);
  if (!regex.test(content)) {
    return { flattenContent: content, deps };
  }

  // We should update the resolver instanceof because the alias should be passed to it
  // If we reuse the resolver instance in `detectReactVersion` method, the resolver will lose the alias info and cannot resolve path correctly in mdx files.
  if (!startFlatten) {
    resolver = new RspackResolveFactory({
      extensions: ['.mdx', '.md', '.js'],
      alias,
    });
    startFlatten = true;
  }

  let result = content;

  // Use regex-based extraction instead of full MDX parsing for better performance
  const importStatements = extractDefaultImports(content);

  for (const { id, importPath } of importStatements) {
    let absoluteImportPath: string;
    try {
      absoluteImportPath = await resolveDepPath(
        importPath,
        path.dirname(basePath),
        alias,
      );
    } catch (_e) {
      continue;
    }

    if (MDX_OR_MD_REGEXP.test(absoluteImportPath)) {
      // replace import statement with the content of the imported file
      const importedContent = fs.readFileSync(absoluteImportPath, 'utf-8');
      const { flattenContent: replacedValue, deps: subDeps } =
        await flattenMdxContent(importedContent, absoluteImportPath, alias);

      result = result
        .replace(
          new RegExp(
            `import\\s+${id}\\s+from\\s+['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?`,
          ),
          '',
        )
        .replace(new RegExp(`<${id}\\s*/>`, 'g'), () => replacedValue);

      deps.push(...subDeps, absoluteImportPath);
    }
  }

  return { flattenContent: result, deps };
}
