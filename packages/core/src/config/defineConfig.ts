import type { UserConfig } from '@rspress/shared';

export type UserConfigAsyncFn = () => Promise<UserConfig>;

export function defineConfig(config: UserConfig): UserConfig;
export function defineConfig(config: UserConfigAsyncFn): UserConfigAsyncFn;
export function defineConfig(
  config: UserConfig | UserConfigAsyncFn,
): UserConfig | UserConfigAsyncFn {
  return config;
}
