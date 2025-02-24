export type AnyFunction = (...args: any[]) => any;

export type ExtractFunctionKeys<T> = {
  [K in keyof T]: T[K] extends AnyFunction ? K : never;
}[keyof T];
