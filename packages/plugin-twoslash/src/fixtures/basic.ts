export interface Foo {
  /**
   * a is a number
   */
  a: number;
  /**
   * b is a string
   * @example
   * const a: Foo = {a: 1, b: "hello"};
   * a.b = "world";
   */
  b: string;

  /**
   * ```ts
   * import { Bar } from './basic';
   * const myBar: Bar = "This is a Bar";
   * ```
   */
  c: string;
}

export type Bar = string;
