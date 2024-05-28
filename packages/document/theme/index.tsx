import Theme from 'rspress/theme';
import { RsfamilyNavIcon } from 'rsfamily-nav-icon';
import 'rsfamily-nav-icon/dist/index.css';
import './index.css';

const Layout = () => {
  return <Theme.Layout beforeNavTitle={<RsfamilyNavIcon />} />;
};

export default {
  ...Theme,
  Layout,
};

export * from 'rspress/theme';
