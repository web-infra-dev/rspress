import React from 'react';
import MonacoEditor, {
  loader,
  EditorProps as MonacoEditorProps,
} from '@monaco-editor/react';

loader.config({
  paths: { vs: 'https://unpkg.com/monaco-editor@0.30.1/min/vs' },
});

export type EditorProps = Partial<MonacoEditorProps>;

export function Editor(props: EditorProps) {
  const { options, className = '', ...rest } = props || {};

  return (
    <div className={`rspress-playground-editor ${className}`}>
      <MonacoEditor
        {...rest}
        theme="vs"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbersMinChars: 7,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordBasedSuggestions: false,
          quickSuggestions: false,
          ...options,
        }}
      />
    </div>
  );
}
