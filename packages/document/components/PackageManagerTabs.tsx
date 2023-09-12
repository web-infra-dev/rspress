import { Tabs } from '@theme';
import { Npm } from './icons/Npm';
import { Yarn } from './icons/Yarn';
import { Pnpm } from './icons/Pnpm';

const packageMangerToIcon = {
  npm: Npm,
  yarn: Yarn,
  pnpm: Pnpm,
};

export function PackageManagerTabs({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Tabs
      values={Object.entries(packageMangerToIcon).map(([key, Icon]) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 15,
          }}
        >
          <Icon />
          <span style={{ marginLeft: 6, marginBottom: 4 }}>{key}</span>
        </div>
      ))}
    >
      {children}
    </Tabs>
  );
}

export { Tab } from '@theme';
