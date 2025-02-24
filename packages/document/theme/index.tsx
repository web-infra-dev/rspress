import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import { Layout as BasicLayout } from 'rspress/theme';
import { HomeLayout as BasicHomeLayout } from 'rspress/theme';
import { ToolStack } from './components/ToolStack';
import './index.css';

function HomeLayout() {
  return <BasicHomeLayout afterFeatures={<ToolStack />} />;
}

const Layout = () => {
  return <BasicLayout beforeNavTitle={<NavIcon />} />;
};

export { Layout, HomeLayout };
export * from 'rspress/theme';
