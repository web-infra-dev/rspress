import type { Options } from '../types';

export const normalizeOptions = (options: Options): Required<Options> => {
  const {
    languages = [],
    doc = {},
    isProduction = process.env.NODE_ENV === 'production',
    appDir = process.cwd(),
    entries = {},
    previewMode = 'web',
    apiParseTool = 'react-docgen-typescript',
    parseToolOptions = {},
    useModuleSidebar = true,
    iframePosition = 'follow',
    defaultRenderMode = 'preview',
  } = options;
  return {
    defaultRenderMode,
    iframePosition,
    languages,
    doc,
    isProduction,
    appDir,
    entries,
    previewMode,
    apiParseTool,
    parseToolOptions,
    useModuleSidebar,
  };
};
