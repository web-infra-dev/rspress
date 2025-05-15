import { DocLayout } from './layout/DocLayout';
import { HomeLayout } from './layout/HomeLayout';
import { Layout } from './layout/Layout';
import { NotFoundLayout } from './layout/NotFountLayout';
import { useBindingAsideScroll, useSetup } from './logic';

export default {
  Layout,
  NotFoundLayout,
  HomeLayout,
  useBindingAsideScroll,
  useSetup,
};

export {
  getCustomMDXComponent,
  type CodeProps,
} from './layout/DocLayout/docComponents';

export * from './logic';

export { Layout, NotFoundLayout, HomeLayout, DocLayout };

export * from './components/Search/logic/types';

export * from './components';
