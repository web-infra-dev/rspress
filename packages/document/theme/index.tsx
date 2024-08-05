import Theme from 'rspress/theme';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import { HomeLayout as BasicHomeLayout } from 'rspress/theme';
import { ToolStack } from './components/ToolStack';
import './index.css';

function HomeLayout() {
  return (
    <BasicHomeLayout
      afterFeatures={
        <>
          <ToolStack />
        </>
      }
    />
  );
}

const Layout = () => {
  return <Theme.Layout beforeNavTitle={<NavIcon />} />;
};

export default {
  ...Theme,
  Layout,
  HomeLayout,
};

export * from 'rspress/theme';
