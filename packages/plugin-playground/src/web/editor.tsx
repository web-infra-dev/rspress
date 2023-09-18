import React from 'react';
import MonacoEditor, {
  loader,
  EditorProps as MonacoEditorProps,
} from '@monaco-editor/react';

loader.config({
  paths: { vs: 'https://unpkg.com/monaco-editor@0.43.0/min/vs' },
});

export type EditorProps = Partial<MonacoEditorProps>;

export function Editor(props: EditorProps) {
  const { options, className = '', ...rest } = props || {};

  return (
    <div className={`rspress-playground-editor ${className}`}>
      <MonacoEditor
        {...rest}
        theme="light"
        options={{
          minimap: {
            enabled: true,
            autohide: true,
          },
          fontSize: 14,
          lineNumbersMinChars: 7,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordBasedSuggestions: true,
          quickSuggestions: true,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          ...options,
        }}
      />
    </div>
  );
}
