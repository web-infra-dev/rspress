import * as babel from '@babel/standalone';
import type { Node } from '@babel/types';
import React, { Component, HTMLAttributes } from 'react';
import {
  createGetImport,
  createObjectPattern,
  createVariableDeclaration,
} from './ast';

interface RunnerProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  language: string;
  getImport: (name: string, getDefault?: boolean) => void;
}

interface RunnerState {
  error?: Error;
  comp: any;
}

class Runner extends Component<RunnerProps, RunnerState> {
  static getDerivedStateFromError(error: Error) {
    return {
      error,
      comp: null,
    };
  }

  timer: any;

  constructor(props: RunnerProps) {
    super(props);

    this.state = {
      error: undefined,
      comp: null,
    };

    this.doCompile = this.doCompile.bind(this);
    this.waitCompile = this.waitCompile.bind(this);
  }

  waitCompile(targetCode: string) {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      this.doCompile(targetCode);
    }, 600);
  }

  doCompile(targetCode: string) {
    const { language, getImport } = this.props;
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
                const code: Node[] = [];
                for (const specifier of path.node.specifiers) {
                  // import X from 'xxx'
                  if (specifier.type === 'ImportDefaultSpecifier') {
                    // const ${specifier.local.name} = __get_import()
                    code.push(
                      createVariableDeclaration(
                        specifier.local.name,
                        createGetImport(pkg, true),
                      ),
                    );
                  }
                  // import * as X from 'xxx'
                  if (specifier.type === 'ImportNamespaceSpecifier') {
                    // const ${specifier.local.name} = __get_import()
                    code.push(
                      createVariableDeclaration(
                        specifier.local.name,
                        createGetImport(pkg),
                      ),
                    );
                  }
                  // import { a, b, c } from 'xxx'
                  if (specifier.type === 'ImportSpecifier') {
                    // const {${specifier.local.name}} = __get_import()
                    code.push(
                      createVariableDeclaration(
                        createObjectPattern([specifier.local.name]),
                        createGetImport(pkg),
                      ),
                    );
                  }
                }
                // console.log('replace with', code);
                path.replaceWithMultiple(code);
              },
            },
          },
        ],
      });

      // console.log(result);

      // Code has been updated
      if (targetCode !== this.props.code || !result || !result.code) {
        return;
      }

      const runExports: any = {};
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      const func = new Function('__get_import', 'exports', result.code);
      func(getImport, runExports);

      if (runExports.default) {
        this.setState({
          error: undefined,
          comp: React.createElement(runExports.default),
        });
        return;
      }

      this.setState({
        error: new Error('No default export'),
        comp: null,
      });
    } catch (e) {
      // Code has been updated
      if (targetCode !== this.props.code) {
        return;
      }
      console.error(e);
      this.setState({
        error: e as Error,
        comp: null,
      });
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(error);
    console.error(errorInfo);
  }

  componentDidMount() {
    this.doCompile(this.props.code);
  }

  componentDidUpdate(prevProps: RunnerProps) {
    if (prevProps.code !== this.props.code) {
      this.waitCompile(this.props.code);
    }
  }

  render() {
    const { className = '', code, language, getImport, ...rest } = this.props;
    const { error, comp } = this.state;

    if (error) {
      return (
        <div className={`rspress-playground-runner ${className}`} {...rest}>
          <span style={{ color: 'red' }}>{error.message}</span>
        </div>
      );
    }

    return (
      <div className={`rspress-playground-runner ${className}`} {...rest}>
        {comp}
      </div>
    );
  }
}

export { Runner };
