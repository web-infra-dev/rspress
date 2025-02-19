import { BrowserRouter, DataContext, ThemeContext } from '@rspress/runtime';
import { isProduction } from '@rspress/shared';
import { useMemo, useState } from 'react';
import siteData from 'virtual-site-data';
import { App, initPageData } from './App';

const enableSSG = siteData.ssg;

// eslint-disable-next-line import/no-commonjs
const { default: Theme, useThemeState } = require('@theme');

export async function renderInBrowser() {
  const container = document.getElementById('root')!;

  const enhancedApp = async () => {
    const initialPageData = await initPageData(window.location.pathname);

    return function RootApp() {
      const [data, setData] = useState(initialPageData);
      const [theme, setTheme] = useThemeState();
      return (
        <ThemeContext.Provider
          value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
        >
          <DataContext.Provider
            value={useMemo(() => ({ data, setData }), [data, setData])}
          >
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </DataContext.Provider>
        </ThemeContext.Provider>
      );
    };
  };
  const RootApp = await enhancedApp();
  if (process.env.__REACT_GTE_18__) {
    const { createRoot, hydrateRoot } = require('react-dom/client');
    if (isProduction() && enableSSG) {
      hydrateRoot(container, <RootApp />);
    } else {
      createRoot(container).render(<RootApp />);
    }
  } else {
    const ReactDOM = require('react-dom');
    if (isProduction()) {
      ReactDOM.hydrate(<RootApp />, container);
    } else {
      ReactDOM.render(<RootApp />, container);
    }
  }
}

renderInBrowser().then(() => {
  Theme.setup();
});
