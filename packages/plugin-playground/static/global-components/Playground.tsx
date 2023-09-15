import React, { HTMLAttributes, useCallback, useState } from 'react';
import getImport from 'playground-imports';
import { Editor, Runner } from '../../dist/web/esm';

interface PlaygroundProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  language: string;
  direction?: 'horizontal' | 'vertical';
}

export default function Playground(props: PlaygroundProps) {
  const {
    code: codeProp,
    language,
    className = '',
    direction = 'horizontal',
    ...rest
  } = props;

  const [code, setCode] = useState(codeProp);

  const handleCodeChange = useCallback((e?: string) => {
    setCode(e || '');
  }, []);

  const monacoLanguage =
    language === 'tsx' || language === 'ts' ? 'typescript' : 'javascript';

  return (
    <div
      className={`rspress-playground rspress-playground-${direction} ${className}`}
      {...rest}
    >
      <Runner language={language} code={code} getImport={getImport} />
      <Editor
        value={code}
        onChange={handleCodeChange}
        language={monacoLanguage}
      />
    </div>
  );
}
