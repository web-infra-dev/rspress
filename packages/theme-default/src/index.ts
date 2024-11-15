// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { DocLayout } from './layout/DocLayout';
import { HomeLayout } from './layout/HomeLayout';
import { Layout } from './layout/Layout';
import { NotFoundLayout } from './layout/NotFountLayout';
import { setup } from './logic';

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

export * from './components';
