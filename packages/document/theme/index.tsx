import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import Theme from 'rspress/theme';
import { HomeLayout as BasicHomeLayout } from 'rspress/theme';
import { ToolStack } from './components/ToolStack';
import { V2Banner } from './components/V2Banner';
import './index.css';

function HomeLayout() {
  return (
    <BasicHomeLayout afterFeatures={<ToolStack />} beforeNav={<V2Banner />} />
  );
}

const Layout = () => {
  return <Theme.Layout beforeNavTitle={<NavIcon />} beforeNav={<V2Banner />} />;
};

export default {
  ...Theme,
  Layout,
  HomeLayout,
};

export * from 'rspress/theme';
