import type {
  CallExpression,
  Expression,
  Identifier,
  ObjectPattern,
  ObjectProperty,
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

function createIdentifier(name: string): Identifier {
  return {
    type: 'Identifier',
    name,
  };
}

function createObjectProperty(key: string, value: string): ObjectProperty {
  return {
    type: 'ObjectProperty',
    key: createIdentifier(key),
    computed: false,
    shorthand: key === value,
    value: createIdentifier(value),
  };
}

export function createObjectPattern(
  names: (string | [string, string])[],
): ObjectPattern {
  return {
    type: 'ObjectPattern',
    properties: names.map(name =>
      Array.isArray(name)
        ? createObjectProperty(name[0], name[1])
        : createObjectProperty(name, name),
    ),
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
