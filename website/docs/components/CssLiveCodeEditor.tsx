import { useEffect, useRef, useState } from 'react';
import { useCssModification } from './CssModificationContext';
import { LiveCodeEditor } from './LiveCodeEditor';

export interface CssLiveCodeEditorProps {
  styleId: string; // Required - unique ID for this editor
  defaultValue: string; // Required - the default CSS value
  disabled?: boolean;
}

export function CssLiveCodeEditor({
  styleId,
  defaultValue,
  disabled = false,
}: CssLiveCodeEditorProps) {
  const { register, updateValue, getEntry } = useCssModification();

  // Register or get existing entry on mount
  const entryRef = useRef<{
    defaultValue: string;
    currentValue: string;
  } | null>(null);
  if (!entryRef.current) {
    entryRef.current = register(styleId, defaultValue);
  }

  const [value, setValue] = useState(entryRef.current.currentValue);

  // Update context when value changes
  useEffect(() => {
    updateValue(styleId, value);
  }, [value, styleId, updateValue]);

  // Sync from context when re-entering page (entry might have been updated)
  useEffect(() => {
    const entry = getEntry(styleId);
    if (entry && entry.currentValue !== value) {
      setValue(entry.currentValue);
    }
  }, [styleId, getEntry]);

  const handleChange = (code: string) => {
    setValue(code);
  };

  return (
    <LiveCodeEditor
      lang="css"
      value={value}
      disabled={disabled}
      onChange={handleChange}
    />
  );
}

export function CssLiveCodeEditorWithDefault({
  styleId,
  defaultValue,
}: {
  styleId: string;
  defaultValue: string;
}) {
  return <CssLiveCodeEditor styleId={styleId} defaultValue={defaultValue} />;
}
