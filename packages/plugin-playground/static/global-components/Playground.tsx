import React, {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import getImport from '_rspress_playground_imports';
import { usePageData } from '@rspress/core/runtime';
import { Editor, Runner } from '../../dist/web/esm';

// inject by builder in cli/index.ts
declare global {
  const __PLAYGROUND_DIRECTION__: any;
}

type Direction = 'horizontal' | 'vertical';

export interface PlaygroundProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  language: string;
  direction?: Direction;
  editorPosition?: 'left' | 'right';
  renderChildren?: (
    props: PlaygroundProps,
    code: string,
    direction: Direction,
  ) => ReactNode;
}

function useDirection(props: PlaygroundProps): Direction {
  const { page } = usePageData();
  const { frontmatter = {} } = page;
  const { playgroundDirection } = frontmatter;

  // from props
  if (props.direction) {
    return props.direction;
  }

  // from page frontmatter
  if (playgroundDirection) {
    return playgroundDirection as Direction;
  }

  // inject by config
  try {
    return __PLAYGROUND_DIRECTION__;
  } catch (e) {
    // ignore
  }

  return 'horizontal';
}

export default function Playground(props: PlaygroundProps) {
  const {
    code: codeProp,
    language,
    className = '',
    direction: directionProp,
    editorPosition,
    renderChildren,
    ...rest
  } = props;

  const direction = useDirection(props);

  const [code, setCode] = useState(codeProp);

  const handleCodeChange = useCallback((e?: string) => {
    setCode(e || '');
  }, []);

  const useReverseLayout =
    direction === 'horizontal' && editorPosition === 'left';

  const monacoLanguage =
    language === 'tsx' || language === 'ts' ? 'typescript' : 'javascript';

  const classNames = [
    'rspress-playground',
    `rspress-playground-${direction}`,
    `rspress-playground-reverse-${useReverseLayout ? 'y' : 'n'}`,
    className,
  ].join(' ');

  return (
    <div className={classNames} {...rest}>
      <Runner language={language} code={code} getImport={getImport} />
      <Editor
        value={code}
        onChange={handleCodeChange}
        language={monacoLanguage}
      />
      {renderChildren?.(props, code, direction)}
    </div>
  );
}
