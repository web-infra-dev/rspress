import { normalizeSlash } from '@rspress/shared';
import { RuntimeModuleID, type VirtualModulePlugin } from './types';

/**
 * some configuration in `rspress.config.ts` serialized from compile time side to runtime
 */
export const runtimeConfigVMPlugin: VirtualModulePlugin = context => {
  return {
    [RuntimeModuleID.RuntimeConfig]: () => {
      const { config } = context;

      const { base } = config;

      // TODO: base can be normalized in compile time side in an earlier stage
      const normalizedBase = normalizeSlash(base ?? '/');
      // Use named export for better tree-shaking support
      return `export const base = ${JSON.stringify(normalizedBase)};
export const ssg = ${JSON.stringify(config.ssg ?? true)};`;
    },
  };
};
