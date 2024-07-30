import Theme from 'rspress/theme';
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

export default {
  ...Theme,
  Layout,
};

export * from 'rspress/theme';
