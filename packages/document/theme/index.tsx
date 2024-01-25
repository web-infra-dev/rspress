import Theme from 'rspress/theme';
// import { NoSSR, useLang } from 'rspress/runtime';
// import { Documate } from '@documate/react';
import { RsfamilyNavIcon } from 'rsfamily-nav-icon';
import 'rsfamily-nav-icon/dist/index.css';
import '@documate/react/dist/style.css';
import './index.css';

// const predefinedQuestions = {
//   zh: [
//     '什么是 Rspress？',
//     '在 Rspress 中如何自定义全局样式？',
//     '提供一个简单的 Rspress 插件示例。',
//     '如何在 Rspress 中自定义主题？',
//   ],
//   en: [
//     'What is Rspress?',
//     'How to customize global styles in Rspress?',
//     'Provide a simple Rspress plugin example。',
//     'How to customize themes in Rspress?',
//   ],
// };

const Layout = () => {
  // const lang = useLang();
  return (
    <Theme.Layout
      beforeNavTitle={<RsfamilyNavIcon />}
      // afterNavTitle={
      //   <NoSSR>
      //     <Documate
      //       endpoint={`${process.env.DOCUMATE_BACKEND_URL}/ask`}
      //       predefinedQuestions={predefinedQuestions[lang as 'zh' | 'en']}
      //     />
      //   </NoSSR>
      // }
    />
  );
};

export default {
  ...Theme,
  Layout,
};

export * from 'rspress/theme';
