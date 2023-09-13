import * as path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: <%= siteTitle %>,
  description: <%= siteDesc %>,
  icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/uhbfnupenuhf/rspress/rspress-logo.png',
  logo: {
    light: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rspress/rspress-navbar-logo-0904.png',
    dark: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rspress/rspress-navbar-logo-dark-0904.png',
  },
  themeConfig: {
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/web-infra-dev/rspress' },
    ],
  },
});
