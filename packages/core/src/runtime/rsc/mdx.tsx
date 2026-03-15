import type { ReactNode } from 'react';

type MdxComponents = Record<string, unknown>;

export function MDXProvider({
  children,
}: {
  children?: ReactNode;
  components?: MdxComponents;
}) {
  return children ?? null;
}

export function useMDXComponents(
  components?: MdxComponents | ((currentComponents: MdxComponents) => MdxComponents),
) {
  if (typeof components === 'function') {
    return components({});
  }

  return components ?? {};
}
