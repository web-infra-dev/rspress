import type {
  CallExpression,
  Expression,
  ObjectPattern,
  VariableDeclaration,
} from '@babel/types';

export function createVariableDeclaration(
  id: string | ObjectPattern,
  init: Expression,
): VariableDeclaration {
  return {
    type: 'VariableDeclaration',
    declarations: [
      {
        type: 'VariableDeclarator',
        id:
          typeof id === 'string'
            ? {
                type: 'Identifier',
                name: id,
              }
            : id,
        init,
      },
    ],
    kind: 'const',
  };
}

export function createObjectPattern(names: string[]): ObjectPattern {
  return {
    type: 'ObjectPattern',
    properties: names.map(name => ({
      type: 'ObjectProperty',
      key: {
        type: 'Identifier',
        name,
      },
      computed: false,
      method: false,
      shorthand: true,
      value: {
        type: 'Identifier',
        name,
      },
    })),
  };
}

export function createGetImport(
  name: string,
  getDefault?: boolean,
): CallExpression {
  return {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: '__get_import',
    },
    arguments: [
      {
        type: 'StringLiteral',
        value: name,
      },
      {
        type: 'BooleanLiteral',
        value: Boolean(getDefault),
      },
    ],
  };
}
