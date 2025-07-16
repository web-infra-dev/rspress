import { Layout as BaseLayout } from '@rspress/core/theme';

const Layout = () => {
  return (
    <BaseLayout
      uiSwitch={{
        showNavbar: false,
      }}
    />
  );
};

export { Layout };
export * from '@rspress/core/theme';
