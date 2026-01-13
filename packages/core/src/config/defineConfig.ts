import type { UserConfig } from '@rspress/shared';

/**
 * A function that returns a Promise resolving to a UserConfig.
 * Use this type when you need to perform async operations during configuration,
 * such as fetching data or reading files.
 */
export type UserConfigAsyncFn = () => Promise<UserConfig>;

/**
 * Define a static Rspress configuration object.
 * @param config - The Rspress configuration object.
 * @returns The same configuration object (enables type checking and IDE autocompletion).
 * @example
 * ```ts
 * import { defineConfig } from '@rspress/core';
 *
 * export default defineConfig({
 *   title: 'My Site',
 * });
 * ```
 */
export function defineConfig(config: UserConfig): UserConfig;
/**
 * Define an async Rspress configuration function.
 * Use this overload when you need to perform async operations during configuration,
 * such as fetching remote data, reading files, or dynamically generating config.
 * @param config - An async function that returns the Rspress configuration.
 * @returns The same async function (enables type checking and IDE autocompletion).
 * @example
 * ```ts
 * import { defineConfig } from '@rspress/core';
 *
 * export default defineConfig(async () => {
 *   const remoteConfig = await fetchConfig();
 *   return {
 *     title: remoteConfig.title,
 *   };
 * });
 * ```
 */
export function defineConfig(config: UserConfigAsyncFn): UserConfigAsyncFn;
export function defineConfig(
  config: UserConfig | UserConfigAsyncFn,
): UserConfig | UserConfigAsyncFn {
  return config;
}
