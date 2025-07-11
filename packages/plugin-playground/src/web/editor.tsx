import MonacoEditor, {
  loader,
  type EditorProps as MonacoEditorProps,
} from '@monaco-editor/react';
import { useMemo } from 'react';
import { useDark } from 'rspress/runtime';
import { DEFAULT_MONACO_URL } from './constant';

// inject by Rsbuild in cli/index.ts
// see: https://rsbuild.rs/config/source/define
declare global {
  const __PLAYGROUND_MONACO_LOADER__: Parameters<typeof loader.config>[0];
  const __PLAYGROUND_MONACO_OPTIONS__: MonacoEditorProps['options'];
}

function initLoader() {
  let loaderConfig: Parameters<typeof loader.config>[0] = {
    paths: {
      vs: DEFAULT_MONACO_URL,
    },
  };

  try {
    const keys = Object.keys(__PLAYGROUND_MONACO_LOADER__);

    if (keys.length > 0) {
      loaderConfig = __PLAYGROUND_MONACO_LOADER__;
    }
  } catch (_e) {
    // ignore
  }

  loader.config(loaderConfig);
}
initLoader();

function getMonacoOptions() {
  try {
    return __PLAYGROUND_MONACO_OPTIONS__;
  } catch (_e) {
    // ignore
  }
  return {};
}

export type EditorProps = Partial<MonacoEditorProps>;

export function Editor(props: EditorProps) {
  const { options, className = '', theme: themeProp, ...rest } = props || {};

  const dark = useDark();
  const theme = useMemo(() => {
    if (themeProp) {
      return themeProp;
    }
    return dark ? 'vs-dark' : 'light';
  }, [themeProp, dark]);

  return (
    <div className={`rspress-playground-editor ${className}`}>
      <MonacoEditor
        {...rest}
        theme={theme}
        options={{
          minimap: {
            enabled: true,
            autohide: true,
          },
          fontSize: 14,
          lineNumbersMinChars: 7,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          // @ts-expect-error - FIXME: seems upstream typing issue
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
