import type { ReactNode } from 'react';

export function ReleaseLink() {
  const version = '4.2.0';
  const href = `https://github.com/lynx-family/lynx/releases/tag/${version}`;
  const label = `Lynx ${version}`;

  if (import.meta.env.SSG_MD) {
    return <>{`[${label}](${href})`}</>;
  }

  return <a href={href}>{label}</a>;
}

export function Download() {
  return <div>Download LynxExplorer</div>;
}

function Container({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}

export const PlatformTabs = Object.assign(Container, { Tab: Container });
