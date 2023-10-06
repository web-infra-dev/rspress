import Theme from 'rspress/theme';
import { NoSSR } from 'rspress/runtime';
import { Documate } from '@documate/react';
import '@documate/react/dist/style.css';
import './index.css';

const Layout = () => (
  <Theme.Layout
    afterNavTitle={
      <NoSSR>
        <Documate endpoint={`${process.env.DOCUMATE_BACKEND_URL}/ask`} />
      </NoSSR>
    }
  />
);

export default {
  ...Theme,
  Layout,
};

export * from 'rspress/theme';
