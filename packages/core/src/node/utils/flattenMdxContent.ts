import path from 'path';
import enhancedResolve from 'enhanced-resolve';
import type { Resolver } from 'enhanced-resolve';
import fs from '@rspress/shared/fs-extra';
import { createProcessor } from '@mdx-js/mdx';
import type { Root } from 'hast';
import { MDX_REGEXP } from '@rspress/shared';
import { importStatementRegex } from '../constants';

const { CachedInputFileSystem, ResolverFactory } = enhancedResolve;
const processor = createProcessor();
let resolver: Resolver;
let startFlatten = false;

export async function resolveDepPath(
  importPath: string,
  importer: string,
  alias: Record<string, string | string[]>,
) {
  if (!resolver) {
    resolver = ResolverFactory.createResolver({
      fileSystem: new CachedInputFileSystem(fs),
      extensions: ['.mdx', '.md'],
      alias,
    });
  }
  const resolveResult = await new Promise<string>((resolve, reject) => {
    resolver.resolve(
      {
        importer,
      },
      importer,
      importPath,
      {},
      (err, filePath) => {
        if (err) {
          return reject(err);
        }
        if (!filePath) {
          return reject(
            new Error(
              `Empty result when resolving ${importPath} from ${importer}`,
            ),
          );
        }
        return resolve(filePath);
      },
    );
  });
  return resolveResult;
}

interface ImportNode {
  type: 'ImportDeclaration';
  specifiers: { local: { name: string } }[];
  source: { value: string };
}

export async function flattenMdxContent(
  content: string,
  basePath: string,
  alias: Record<string, string | string[]>,
): Promise<{ flattenContent: string; deps: string[] }> {
  const deps = [];
  // Performance optimization: if the content does not contain any import statement, we can skip the parsing process
  // So we need to check this match

  // Create new regExp to avoid the regex cache the last match index
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test#using_test_on_a_regex_with_the_global_flag
  const regex = new RegExp(importStatementRegex);
  if (!regex.test(content)) {
    return { flattenContent: content, deps };
  }
  let result = content;
  // We should update the resolver instanceof because the alias should be passed to it
  // If we reuse the resolver instance in `detectReactVersion` method, the resolver will lose the alias info and cannot resolve path correctly in mdx files.
  if (!startFlatten) {
    resolver = ResolverFactory.createResolver({
      fileSystem: new CachedInputFileSystem(fs),
      extensions: ['.mdx', '.md', '.js'],
      alias,
    });
    startFlatten = true;
  }
  let ast: Root;
  try {
    ast = processor.parse(content) as Root;
  } catch (e) {
    // Fallback: if mdx parse failed, just return the content
    return { flattenContent: content, deps };
  }
  const importNodes = ast.children
    .filter(node => node.type === 'mdxjsEsm')
    .map(node => {
      return (node.data?.estree as { body: ImportNode[] })?.body || [];
    })
    .flat()
    .filter(node => node.type === 'ImportDeclaration');
  for (const importNode of importNodes) {
    // import Comp from './a';
    // id: Comp
    // importPath: './a'
    const id = importNode.specifiers[0].local.name;
    const importPath = importNode.source.value;

    let absoluteImportPath: string;
    try {
      absoluteImportPath = await resolveDepPath(
        importPath,
        path.dirname(basePath),
        alias,
      );
    } catch (e) {
      continue;
    }

    if (MDX_REGEXP.test(absoluteImportPath)) {
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
