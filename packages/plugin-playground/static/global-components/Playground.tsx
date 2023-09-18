import React, { HTMLAttributes, useCallback, useState } from 'react';
import getImport from '_rspress_playground_imports';
import { Editor, Runner } from '../../dist/web/esm';

interface PlaygroundProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  language: string;
  direction?: 'horizontal' | 'vertical';
  editorPosition?: 'left' | 'right';
}

export default function Playground(props: PlaygroundProps) {
  const {
    code: codeProp,
    language,
    className = '',
    direction = 'horizontal',
    editorPosition,
    ...rest
  } = props;

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
    </div>
  );
}
