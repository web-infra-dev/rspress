import { useEffect, useRef, useState } from 'react';
import { LiveCodeEditor } from './LiveCodeEditor';

export interface CssLiveCodeEditorProps {
  initialCode: string;
  styleId?: string;
}

export function CssLiveCodeEditor({
  initialCode,
  styleId = 'live-css-editor-style',
}: CssLiveCodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const styleElement = useRef<HTMLStyleElement>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    const styleEl = styleElement.current || document.getElementById(styleId);
    if (!styleEl) {
      styleElement.current = document.createElement('style');
      styleElement.current.id = styleId;
      document.head.appendChild(styleElement.current);
    } else {
      styleEl.textContent = initialCode;
    }
    return () => {
      styleEl && (styleEl.textContent = '');
    };
  }, []);

  return (
    <LiveCodeEditor
      lang="css"
      value={code}
      onChange={code => {
        setCode(code);
        const styleEl =
          styleElement.current || document.getElementById(styleId);
        if (styleEl) {
          styleEl.textContent = code;
        }
      }}
    />
  );
}
