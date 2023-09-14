import * as babel from '@babel/standalone';
import type { Node } from '@babel/types';
import React, {
  HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  createMemberExpression,
  createObjectPattern,
  createVariableDeclaration,
} from './ast';

interface RunnerProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  language: string;
  imports: Map<string, any>;
}

export function Runner(props: RunnerProps) {
  const { code, language, imports, className = '', ...rest } = props;

  const currentCode = useRef(code);
  currentCode.current = code;

  const [comp, setComp] = useState<any>(null);

  const doCompile = useCallback(
    (targetCode: string) => {
      const useImports: string[] = [];
      try {
        // console.log(babel);
        const presets = [
          [babel.availablePresets.react],
          [babel.availablePresets.env, { modules: 'commonjs' }],
        ];
        if (language === 'tsx' || language === 'ts') {
          presets.unshift([
            babel.availablePresets.typescript,
            {
              allExtensions: true,
              isTSX: language === 'tsx',
            },
          ]);
        }
        const result = babel.transform(targetCode, {
          sourceType: 'module',
          presets,
          plugins: [
            {
              visitor: {
                ImportDeclaration(path) {
                  const pkg = path.node.source.value;
                  let pkgIndex = useImports.indexOf(pkg);
                  if (pkgIndex === -1) {
                    useImports.push(pkg);
                    pkgIndex = useImports.length - 1;
                  }
                  const code: Node[] = [];
                  const pkgImport = createMemberExpression(
                    '__imports',
                    pkgIndex,
                  );
                  for (const specifier of path.node.specifiers) {
                    // import X from 'xxx'
                    if (specifier.type === 'ImportDefaultSpecifier') {
                      // const ${specifier.local.name} = __imports[${pkgIndex}].default;
                      code.push(
                        createVariableDeclaration(specifier.local.name, {
                          type: 'LogicalExpression',
                          operator: '||',
                          left: createMemberExpression(pkgImport, 'default'),
                          right: pkgImport,
                        }),
                      );
                    }
                    // import * as X from 'xxx'
                    if (specifier.type === 'ImportNamespaceSpecifier') {
                      // const ${specifier.local.name} = __imports[${pkgIndex}];
                      code.push(
                        createVariableDeclaration(
                          specifier.local.name,
                          pkgImport,
                        ),
                      );
                    }
                    // import { a, b, c } from 'xxx'
                    if (specifier.type === 'ImportSpecifier') {
                      // const {${specifier.local.name}} = __imports[${pkgIndex}];
                      code.push(
                        createVariableDeclaration(
                          createObjectPattern([specifier.local.name]),
                          pkgImport,
                        ),
                      );
                    }
                  }
                  console.log('replace with', code);
                  path.replaceWithMultiple(code);
                },
              },
            },
          ],
        });

        console.log(result);

        // Code has been updated
        if (code !== currentCode.current || !result || !result.code) {
          return;
        }

        const importsObj = useImports.map(x => imports?.get(x));
        const runExports: any = {};
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
        const func = new Function('__imports', 'exports', result.code);
        // console.log(importsObj);
        func(importsObj, runExports);

        if (runExports.default) {
          setComp(React.createElement(runExports.default));
        } else {
          setComp(
            React.createElement(
              'span',
              { style: { color: 'red' } },
              'No default export',
            ),
          );
        }
      } catch (e) {
        // Code has been updated
        if (code !== currentCode.current) {
          return;
        }
        console.error(e);
        setComp(
          React.createElement(
            'span',
            { style: { color: 'red' } },
            (e as Error).message,
          ),
        );
      }
    },
    [language, imports],
  );

  const changeTimer = useRef<any>(null);
  useEffect(() => {
    if (changeTimer.current) {
      clearTimeout(changeTimer.current);
    }
    changeTimer.current = setTimeout(() => doCompile(code), 600);
  }, [code]);

  return (
    <div className={`rspress-playground-runner ${className}`} {...rest}>
      {comp}
    </div>
  );
}
