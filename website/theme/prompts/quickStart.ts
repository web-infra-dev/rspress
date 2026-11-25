export const quickStartPrompts = {
  en: `Set up a Rspress documentation site.

Read the current quick start guide at https://rspress.rs/guide/start/getting-started.md before running commands. Setup can change between versions, so use the latest CLI and linked docs instead of writing the setup from memory. Add .md to a docs page URL to read it as Markdown.

## New site

Create the site in a new folder, or as a workspace package in an existing monorepo:

npx -y create-rspress@latest my-docs --template basic-theme --skill rspress-docs-generator,rspress-best-practices,rspress-custom-theme

- Replace my-docs with the requested path. In a monorepo, follow its workspace layout and package manager.
- Use basic-theme for a single-language site. Use i18n-theme when the user requests multiple languages; it starts with English and Chinese content.
- These templates include a theme/ folder for customization. The --skill option installs local guidance for the tasks below.
- Explicitly pass the path and template to avoid interactive prompts. Check npx -y create-rspress@latest --help for current options.
- Use an empty target folder. If a Rspress site already exists, inspect and update it instead of scaffolding over it.

## Theme and colors

Read https://rspress.rs/guide/basic/custom-theme.md and https://rspress.rs/ui/vars.md, then use the installed rspress-custom-theme skill.

Choose colors from the user's preferences or existing project branding. If neither is provided, choose a palette that suits the project's content. Apply the colors through CSS variables in theme/index.css for both light and dark appearances, including links and the homepage background. Keep the theme/index.tsx re-export from @rspress/core/theme-original.

## Finish the setup

Install dependencies with the project's package manager, start the dev server, and open the local URL printed by the server. Verify that the homepage loads. Report the project path, chosen template and colors, and the local URL. If any step fails, fix it before reporting completion.

For follow-up tasks, read the relevant docs first:
- Writing pages: https://rspress.rs/guide/use-mdx/frontmatter.md
- Organizing navigation: https://rspress.rs/guide/basic/auto-nav-sidebar.md
- Configuring languages: https://rspress.rs/guide/basic/i18n.md
- Other tasks: https://rspress.rs/llms.txt`,
  zh: `搭建一个 Rspress 文档站点。

执行命令前，先阅读最新的快速开始指南 https://rspress.rs/zh/guide/start/getting-started.md。初始化方式可能随版本变化，请使用最新 CLI 和链接中的文档，不要凭记忆编写配置。在文档页面 URL 后添加 .md，即可读取 Markdown 内容。

## 创建新站点

在新目录中创建站点，或将其作为已有 monorepo 的一个 workspace 包：

npx -y create-rspress@latest my-docs --template basic-theme --skill rspress-docs-generator,rspress-best-practices,rspress-custom-theme

- 将 my-docs 替换为用户指定的路径。在 monorepo 中，遵循已有的 workspace 目录结构和包管理器。
- 单语言站点使用 basic-theme。用户需要多语言时使用 i18n-theme，该模板包含英文和中文示例内容。
- 这两个模板都包含用于自定义主题的 theme/ 目录。--skill 会安装供后续任务使用的本地指引。
- 显式传入路径和模板，避免交互提示。运行 npx -y create-rspress@latest --help 查看当前支持的选项。
- 使用空目录作为目标。如果已有 Rspress 站点，先检查并更新现有项目，不要重新初始化并覆盖它。

## 主题与配色

阅读 https://rspress.rs/zh/guide/basic/custom-theme.md 和 https://rspress.rs/zh/ui/vars.md，然后使用已安装的 rspress-custom-theme skill。

根据用户偏好或项目已有品牌选择配色。如果都未提供，主动选择适合项目内容的配色。通过 theme/index.css 中的 CSS 变量应用配色，同时覆盖浅色和深色模式，包括链接和首页背景。保留 theme/index.tsx 中从 @rspress/core/theme-original 导出的代码。

## 完成初始化

使用项目的包管理器安装依赖，启动开发服务器，并打开服务器输出的本地地址。确认首页可以正常加载，随后报告项目路径、所选模板和配色，以及本地访问地址。如果任何步骤失败，先修复，再报告完成。

后续任务请先阅读对应文档：
- 编写页面：https://rspress.rs/zh/guide/use-mdx/frontmatter.md
- 组织导航：https://rspress.rs/zh/guide/basic/auto-nav-sidebar.md
- 配置多语言：https://rspress.rs/zh/guide/basic/i18n.md
- 其他任务：https://rspress.rs/llms.txt`,
};
