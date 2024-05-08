import * as path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  globalStyles: path.join(__dirname, 'styles/index.css'),
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'dom',
        content:
          '<a href="/zh" class="flex items-center text-base font-semibold transition-opacity duration-300 hover:opacity-60" style="width: max-content"><img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rspress/rspress-navbar-logo-0904.png" alt="logo" id="logo" class="mr-4 rspress-logo dark:hidden" style=" height: 90px; width: 360px"><img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rspress/rspress-navbar-logo-dark-0904.png" alt="logo" id="logo" class="mr-4 rspress-logo hidden dark:block" style=" height: 45px; width: 180px"></a>',
      },
    ],
  },
});
