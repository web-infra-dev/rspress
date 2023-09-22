import Theme from 'rspress/theme';
import { NoSSR } from 'rspress/runtime';
import { Documate } from '@documate/react';
import '@documate/react/dist/style.css';
import './index.css';

const Layout = () => (
  <Theme.Layout
    afterNavTitle={
      <NoSSR>
        <Documate endpoint="https://vhewg5xn8z.us.aircode.run/ask" />
      </NoSSR>
    }
  />
);

export default {
  ...Theme,
  Layout,
};

export * from 'rspress/theme';
