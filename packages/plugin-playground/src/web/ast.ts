import type {
  Expression,
  MemberExpression,
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

export function createMemberExpression(
  obj: any,
  property: number | string,
): MemberExpression {
  return {
    type: 'MemberExpression',
    object:
      typeof obj === 'string'
        ? {
            type: 'Identifier',
            name: obj,
          }
        : obj,
    computed: true,
    property:
      typeof property === 'number'
        ? {
            type: 'NumericLiteral',
            value: property,
          }
        : {
            type: 'StringLiteral',
            value: property,
          },
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
