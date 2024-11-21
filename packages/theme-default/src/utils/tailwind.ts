/**
 * Utility for merging class names.
 *
 * @see https://github.com/lukeed/clsx/blob/925494cf31bcd97d3337aacd34e659e80cae7fe2/src/lite.js
 *
 * @example
 *
 * ```ts
 * const defaultClasses = 'm-8'
 * const indented = true
 * const classNames = clsx('w-4 h-4', indented && 'pl-8', defaultClasses)
 * ```
 */
export function clsx(...args: unknown[]) {
  let str = '';

  for (const arg of args) {
    if (typeof arg === 'string') {
      str += (str && ' ') + arg;
    }
  }

  return str;
}

export default clsx;
