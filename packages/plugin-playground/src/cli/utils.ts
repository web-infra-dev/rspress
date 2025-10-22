import type { Program } from '@babel/types';
import oxc from '@oxidation-compiler/napi';
import type { Code } from 'mdast';

export const parseImports = (code: string, sourceExt: string) => {
  const parsed = oxc.parseSync(code, {
    sourceType: 'module',
    sourceFilename: `index.${sourceExt}`,
  });

  const ast = JSON.parse(parsed.program) as Program;

  const result: string[] = [];

  // oxc didn't have "traverse", so it currently only scans the first level
  // (generally, demos are not too complicated, right?)
  ast.body.forEach(statement => {
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
  const item = meta.find((x: string) => x.startsWith(metaName));
  if (item?.startsWith(`${metaName}=`)) {
    return item.slice(metaName.length + 1).replace(/'"`/g, '');
  }
  return item;
};
