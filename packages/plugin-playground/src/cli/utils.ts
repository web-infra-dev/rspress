/* eslint-disable consistent-return */
import type { Program } from '@babel/types';
import oxc from '@oxidation-compiler/napi';

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

export const getNodeAttribute = (
  node: any,
  attrName: string,
): string | undefined => {
  return node.attributes.find(
    (attr: { name: string; value: string }) => attr.name === attrName,
  )?.value;
};

export const getNodeMeta = (
  node: any,
  metaName: string,
): string | undefined => {
  if (!node.meta) {
    return;
  }
  const meta: string[] = node.meta.split(' ');
  const item: string | undefined = meta.find((x: string) =>
    x.startsWith(metaName),
  );
  if (item?.startsWith(`${metaName}=`)) {
    return item.substring(metaName.length + 1);
  }
  return item;
};
