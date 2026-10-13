export * from '@rspress/core/theme-original';
import { Content } from '@rspress/core/runtime';
import type { PropsWithChildren } from 'react';

export function Root({ children }: PropsWithChildren) {
  return <div data-testid="standalone-theme">{children}</div>;
}

export function Layout() {
  return <Content />;
}

export function LlmsHint() {
  return <div data-testid="custom-llms-hint">Custom LLM hint</div>;
}
