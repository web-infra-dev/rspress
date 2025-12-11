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
  const styleElement = useRef<HTMLStyleElement>(null);

  function applyCssToStyleDom(content: string) {
    let styleEl: HTMLStyleElement | null = document.getElementById(
      styleId,
    ) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style') as HTMLStyleElement;
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
      styleElement.current = styleEl;
    }
    styleEl.textContent = content;
  }

  useEffect(() => {
    applyCssToStyleDom(value);
  }, [value]);

  return (
    <LiveCodeEditor
      lang="css"
      value={value}
      disabled={disabled}
      onChange={code => {
        onChange?.(code);
      }}
    />
  );
}

export function CssLiveCodeEditorWithDefault({
  defaultValue,
}: {
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return <CssLiveCodeEditor value={value} onChange={code => setValue(code)} />;
}
