import React, { HTMLAttributes, useCallback, useState } from 'react';
import imports from 'playground-imports';
import { Editor, Runner } from '../../src/web';

interface PlaygroundProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  language: string;
}

export default function Playground(props: PlaygroundProps) {
  const { code: codeProp, language, className = '', ...rest } = props;

  const [code, setCode] = useState(codeProp);

  const handleCodeChange = useCallback((e?: string) => {
    setCode(e || '');
  }, []);

  const monacoLanguage =
    language === 'tsx' || language === 'ts' ? 'typescript' : 'javascript';

  return (
    <div className={`rspress-playground ${className}`} {...rest}>
      <Runner language={language} code={code} imports={imports} />
      <Editor
        value={code}
        onChange={handleCodeChange}
        language={monacoLanguage}
      />
    </div>
  );
}
