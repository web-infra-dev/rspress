import { useLang } from '@rspress/core/runtime';
import { Banner, Layout as BasicLayout } from '@rspress/core/theme-original';

const Layout = () => {
  const lang = useLang();
  return (
    <BasicLayout
      beforeNav={
        <Banner
          href="/"
          message={
            lang === 'en'
              ? '🚧 Rspress 2.0 document is under development'
              : '🚧 Rspress 2.0 文档还在开发中'
          }
        />
      }
    />
  );
};

export * from '@rspress/core/theme-original';
export { Layout };
