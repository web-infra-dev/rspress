import MonacoEditor, {
  loader,
  type EditorProps as MonacoEditorProps,
} from '@monaco-editor/react';
import { safePreload, useDark } from '@rspress/core/runtime';
import { useMemo } from 'react';
import { DEFAULT_MONACO_URL } from './constant';

// inject by Rsbuild in cli/index.ts
// see: https://rsbuild.rs/config/source/define
declare global {
  const __PLAYGROUND_MONACO_LOADER__: Parameters<typeof loader.config>[0];
  const __PLAYGROUND_MONACO_OPTIONS__: MonacoEditorProps['options'];
}

function getLoaderConfig() {
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

  return loaderConfig;
}

const loaderConfig = getLoaderConfig();
const monacoPrefix = (loaderConfig.paths?.vs || DEFAULT_MONACO_URL).replace(
  /\/+$/,
  '',
);
loader.config(loaderConfig);

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
  safePreload?.(`${monacoPrefix}/loader.js`, { as: 'script' });
  safePreload?.(`${monacoPrefix}/editor/editor.main.js`, { as: 'script' });

  const { options, className = '', theme: themeProp, ...rest } = props || {};

  const dark = useDark();
  const theme = useMemo(() => {
    if (themeProp) {
      return themeProp;
    }
    return dark ? 'vs-dark' : 'light';
  }, [themeProp, dark]);

  return (
    <div className={`rp-playground-editor ${className}`}>
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
