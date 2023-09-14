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
