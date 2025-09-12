import { useEffect, useRef, useState } from 'react';
import { LiveCodeEditor } from './LiveCodeEditor';

export interface CssLiveCodeEditorProps {
  initialCode: string;
  styleId?: string;
  value?: string;
}

export function CssLiveCodeEditor({
  initialCode,
  value,
  styleId = 'live-css-editor-style',
}: CssLiveCodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const styleElement = useRef<HTMLStyleElement>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    let styleEl: HTMLStyleElement | null = document.getElementById(
      styleId,
    ) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style') as HTMLStyleElement;
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
      styleElement.current = styleEl;
    } else {
      styleEl.textContent = initialCode;
    }
    return () => {
      styleEl && (styleEl.textContent = '');
    };
  }, []);

  useEffect(() => {
    if (styleElement.current) {
      styleElement.current.textContent = code;
    }
  }, [code]);

  return (
    <LiveCodeEditor
      lang="css"
      value={value ?? code}
      onChange={code => {
        setCode(code);
        if (styleElement.current) {
          styleElement.current.textContent = code;
        }
      }}
    />
  );
}
