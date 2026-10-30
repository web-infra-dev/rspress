import { langFromPath, parseSync } from '@swc-next/parser';
import type { Code } from 'mdast';

export const parseImports = (code: string, sourceExt: string) => {
  const lang = langFromPath(`index.${sourceExt}`);
  const { program } = parseSync(code, {
    // Preserve JSX support in JavaScript files, including .js, .mjs and .cjs.
    lang: lang === 'js' ? 'jsx' : lang,
    sourceType: 'module',
    comments: 'none',
  });

  const result: string[] = [];

  // Static imports are top-level statements.
  program.body.forEach(statement => {
    if (statement.type === 'ImportDeclaration') {
      result.push(statement.source.value);
    }
  });

  return result;
};

export const getNodeMeta = (
  node: Code,
  metaName: string,
): string | undefined => {
  if (!node.meta) {
    return;
  }
  const meta = node.meta.split(' ');
  // Match `name` or `name=value` exactly — a bare startsWith would claim
  // unrelated meta entries sharing the prefix (e.g. `direction2=`).
  const item = meta.find(x => x === metaName || x.startsWith(`${metaName}=`));
  if (item?.startsWith(`${metaName}=`)) {
    return item.slice(metaName.length + 1).replace(/['"`]/g, '');
  }
  return item;
};
