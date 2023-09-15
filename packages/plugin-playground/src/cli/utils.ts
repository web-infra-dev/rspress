/* eslint-disable consistent-return */
import * as babelParser from '@babel/parser';
import traverse from '@babel/traverse';

export const parseImports = (code: string) => {
  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  const result: string[] = [];

  traverse(ast, {
    ImportDeclaration(path) {
      const pkg = path.node.source.value;
      if (!result.includes(pkg)) {
        result.push(pkg);
      }
    },
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
