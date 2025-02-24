import { Layout as BaseLayout } from 'rspress/theme';

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
export * from 'rspress/theme';
