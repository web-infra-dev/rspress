import { useEffect, useRef, useState } from 'react';
import { LiveCodeEditor } from './LiveCodeEditor';

export interface CssLiveCodeEditorProps {
  styleId?: string;
  value: string;
  onChange?: (code: string) => void; // New prop to notify parent of changes
  disabled?: boolean; // New prop to disable editing
}

export function CssLiveCodeEditor({
  value,
  styleId = 'live-css-editor-style',
  onChange,
  disabled = false, // Default to false
}: CssLiveCodeEditorProps) {
  const [code, setCode] = useState(value);
  const styleElement = useRef<HTMLStyleElement>(null);

  useEffect(() => {
    setCode(value);
  }, [value]);

  function setStyleElement(content: string) {
    let styleEl: HTMLStyleElement | null = document.getElementById(
      styleId,
    ) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style') as HTMLStyleElement;
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
      styleElement.current = styleEl;
    } else {
      styleEl.textContent = content;
    }
  }

  useEffect(() => {
    setStyleElement(value);
    return () => {
      const styleEl: HTMLStyleElement | null = document.getElementById(
        styleId,
      ) as HTMLStyleElement;
      if (styleEl) {
        styleEl.textContent = '';
      }
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
      disabled={disabled}
      onChange={code => {
        setStyleElement(code);
        // Call the onChange callback if provided
        onChange?.(code);
      }}
    />
  );
}
