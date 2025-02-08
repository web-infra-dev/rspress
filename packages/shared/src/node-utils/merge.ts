import type { UserConfig } from '../types/index';

const castArray = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value];

export const mergeDocConfig = async (
  ...configs: UserConfig[]
): Promise<UserConfig> => {
  const { mergeWith } = await import('lodash-es');
  return mergeWith({}, ...configs, (target: UserConfig, source: UserConfig) => {
    const pair = [target, source];
    if (pair.some(item => item === undefined)) {
      // fallback to lodash default merge behavior
      return undefined;
    }
    if (pair.some(item => Array.isArray(item))) {
      return [...castArray(target), ...castArray(source)];
    }
    // fallback to lodash default merge behavior
    return undefined;
  });
};
