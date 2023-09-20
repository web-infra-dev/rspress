import React from 'react';
import MonacoEditor, {
  loader,
  EditorProps as MonacoEditorProps,
} from '@monaco-editor/react';
import { DEFAULT_MONACO_URL } from './constant';

// inject by builder in cli/index.ts
// see: https://modernjs.dev/builder/api/config-source.html#sourcedefine
declare global {
  const __PLAYGROUND_MONACO_LOADER__: any;
  const __PLAYGROUND_MONACO_OPTIONS__: any;
}

function initLoader() {
  let loaderConfig = {
    paths: {
      vs: DEFAULT_MONACO_URL,
    },
  };

  try {
    const keys = Object.keys(__PLAYGROUND_MONACO_LOADER__);

    if (keys.length > 0) {
      loaderConfig = __PLAYGROUND_MONACO_LOADER__;
    }
  } catch (e) {
    // ignore
  }

  loader.config(loaderConfig);
}
initLoader();

function getMonacoOptions() {
  try {
    return __PLAYGROUND_MONACO_OPTIONS__;
  } catch (e) {
    // ignore
  }
  return {};
}

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
          scrollPredominantAxis: false,
          ...getMonacoOptions(),
          ...options,
        }}
      />
    </div>
  );
}
