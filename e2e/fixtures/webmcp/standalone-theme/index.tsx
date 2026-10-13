import { Content } from '@rspress/core/runtime';
import { type PropsWithChildren, useState } from 'react';

export function useThemeState() {
  return useState<'light' | 'dark'>('light');
}

export function ErrorLayout() {
  return <p>Page failed to load</p>;
}

export function Root({ children }: PropsWithChildren) {
  return <div data-testid="standalone-theme">{children}</div>;
}

export function Layout() {
  return <Content />;
}

export function LlmsHint() {
  return <div data-testid="custom-llms-hint">Custom LLM hint</div>;
}
