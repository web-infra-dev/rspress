import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import Theme from 'rspress/theme';
import { HomeLayout as BasicHomeLayout } from 'rspress/theme';
import { ToolStack } from './components/ToolStack';
import './index.css';

function HomeLayout() {
  return <BasicHomeLayout afterFeatures={<ToolStack />} />;
}

const Layout = () => {
  return <Theme.Layout beforeNavTitle={<NavIcon />} HomeLayout={HomeLayout} />;
};

export default {
  ...Theme,
  Layout,
};

export * from 'rspress/theme';
