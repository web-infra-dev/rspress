import fs from 'node:fs';
import path from 'node:path';

import { createProcessor } from '@mdx-js/mdx';
import { rspack } from '@rsbuild/core';
import { MDX_OR_MD_REGEXP } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import type { Root } from 'mdast';
import { importStatementRegex } from '../constants';
import { createError } from './error';

const RspackResolveFactory = rspack.experiments.resolver.ResolverFactory;

type RspackExperiments = typeof rspack.experiments;

type RspackResolveFactory = RspackExperiments['resolver']['ResolverFactory'];

let startFlatten = false;

let resolver: InstanceType<RspackResolveFactory>;

const processor = createProcessor();

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

  let ast: Root;
  let result = content;

  try {
    ast = processor.parse(content);
  } catch (e) {
    // Fallback: if mdx parse failed, just return the content
    logger.debug('flattenMdxContent parse failed: \n', e);
    return { flattenContent: content, deps };
  }

  const importNodes = ast.children
    .filter(node => node.type === 'mdxjsEsm')
    .flatMap(node => node.data?.estree?.body || [])
    .filter(node => node.type === 'ImportDeclaration');
  for (const importNode of importNodes) {
    // import Comp from './a';
    // {id: Comp, importPath: './a'}
    const id = importNode.specifiers[0].local.name;
    const importPath = importNode.source.value as string;

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
          new RegExp(`import\\s+${id}\\s+from\\s+['"](${importPath})['"];?`),
          '',
        )
        .replace(new RegExp(`<${id}\\s*/>`, 'g'), () => replacedValue);

      deps.push(...subDeps, absoluteImportPath);
    }
  }

  return { flattenContent: result, deps };
}
