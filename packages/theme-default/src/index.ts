// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { NotFoundLayout } from './layout/NotFountLayout';
import { Layout } from './layout/Layout';
import { HomeLayout } from './layout/HomeLayout';
import { DocLayout } from './layout/DocLayout';
import { setup } from './logic';

export { Nav } from './components/Nav';
export { Search, SearchPanel } from './components/Search';
export { Tab, Tabs } from './components/Tabs';
export { Button } from './components/Button';
export { Badge } from './components/Badge';
export { Link } from './components/Link';
export { HomeFooter } from './components/HomeFooter';
export { Toc } from './components/Toc';
export { PackageManagerTabs } from './components/PackageManagerTabs';
export { LastUpdated } from './components/LastUpdated';
export { PrevNextPage } from './components/PrevNextPage';
export { SourceCode } from './components/SourceCode';
export { Steps } from './components/Steps';
export { Overview } from './components/Overview';

export default {
  Layout,
  NotFoundLayout,
  HomeLayout,
  setup,
};

export { getCustomMDXComponent } from './layout/DocLayout/docComponents';

export * from './logic';

export { Layout, NotFoundLayout, HomeLayout, DocLayout };

export * from './components/Search/logic/types';
