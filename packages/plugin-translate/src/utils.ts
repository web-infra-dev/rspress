import { createHash as createHashFunc } from 'crypto';

const hashAlgorithm = 'sha512';

export function createHash(str: string) {
  return `${hashAlgorithm}-${createHashFunc(hashAlgorithm)
    .update(str)
    .digest('base64')}`;
}

export function processPromise<T>(
  promise: Promise<T>,
  defaultValue: any,
): Promise<[Error | null, T | any]> {
  return promise
    .then((data: T) => {
      return [null, data] as [null, T];
    })
    .catch((err: Error) => {
      return [err, defaultValue] as [Error, any];
    });
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export function simplifyPath(prefix: string, str: string) {
  return str.replace(new RegExp(prefix), '');
}
