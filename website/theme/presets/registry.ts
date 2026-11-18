import minimalCss from '../../docs/public/themes/minimal.css?raw';
import {
  Outline as MinimalOutline,
  MinimalBreadcrumb,
} from '../../docs/public/themes/minimal';
import type { ThemePreset } from './types';

// Theme-specific imports and installation prompts belong only in this registry.
export const themePresets: readonly ThemePreset[] = [
  {
    id: 'rspress',
    name: 'Rspress',
    prompt: {
      en: `Apply the default Rspress v2 theme to this project. Read https://rspress.rs/guide/basic/custom-theme.md and inspect the existing Rspress config and theme entry first. Remove only styles and component overrides introduced by a previous theme preset. Restore the built-in layout, sidebar, outline, and typography while preserving unrelated customizations, content, navigation, and plugins. Keep exports from @rspress/core/theme-original in any custom theme entry to avoid circular imports. Run the project's checks and docs build, then verify desktop/mobile and light/dark appearances.`,
      zh: `请为当前项目应用 Rspress v2 默认主题。先阅读 https://rspress.rs/zh/guide/basic/custom-theme.md，并检查现有的 Rspress 配置和主题入口。仅移除之前主题预设引入的样式及组件覆盖，恢复内置布局、侧边栏、目录和排版，保留其他自定义内容、文档、导航和插件。自定义主题入口继续从 @rspress/core/theme-original 导出，避免循环引用。完成后运行项目检查和文档构建，并验证桌面端、移动端以及亮色和暗色效果。`,
    },
    description: {
      en: 'Bright blue. The familiar default theme.',
      zh: '明亮的蓝色，熟悉的默认主题。',
    },
    palette: ['#0095ff', '#ffffff', '#f8f8f9', '#242424'],
    preview: {
      light: {
        accent: '#0095ff',
        tint: '#eaf4ff',
        background: '#fff',
        soft: '#fafafa',
        border: '#e4e4e7',
        line: '#d4d4d8',
        text: '#18181b',
      },
      dark: {
        accent: '#0095ff',
        tint: '#172554',
        background: '#121212',
        soft: '#191919',
        border: '#343a46',
        line: '#52525b',
        text: '#f4f4f5',
      },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    prompt: {
      en: `Apply the Minimal preset to this Rspress v2 project. First read https://rspress.rs/ui/themes.md and https://rspress.rs/guide/basic/custom-theme.md, then inspect the existing config and theme entry. Use the official preset stylesheet at https://rspress.rs/themes/minimal.css and accompanying React theme entry at https://rspress.rs/themes/minimal.tsx as the implementation source. Save them as theme/minimal.css and theme/minimal.tsx, import the CSS from theme/index.tsx, and export the preset's Layout and Outline. If a theme entry already exists, merge the preset into it while preserving unrelated overrides, content, navigation, and plugins. Import built-in theme components from @rspress/core/theme-original to avoid circular references. Keep both light and dark styles, the sidebar-derived breadcrumb, responsive navigation, and Back to top. Run the project's checks and docs build, then verify the sidebar, outline, typography, code blocks, and mobile layout.`,
      zh: `请为当前 Rspress v2 项目应用 Minimal 主题预设。先阅读 https://rspress.rs/zh/ui/themes.md 和 https://rspress.rs/zh/guide/basic/custom-theme.md，再检查现有配置和主题入口。以官方预设样式 https://rspress.rs/themes/minimal.css 和配套 React 主题入口 https://rspress.rs/themes/minimal.tsx 为实现来源，分别保存为 theme/minimal.css 和 theme/minimal.tsx，在 theme/index.tsx 中导入 CSS 并导出预设的 Layout 和 Outline。若已有主题入口，将预设合并进去，保留其他组件覆盖、文档、导航和插件。内置主题组件从 @rspress/core/theme-original 导入，避免循环引用。保留亮色和暗色样式、基于侧边栏的面包屑、响应式导航和返回顶部功能。完成后运行项目检查和文档构建，并验证侧边栏、右侧目录、正文排版、代码块和移动端布局。`,
    },
    description: {
      en: 'Neutral colors and soft corners. Inspired by Ruixen UI.',
      zh: '黑白灰、细边框与柔和圆角。灵感来自 Ruixen UI。',
    },
    palette: ['#18181b', '#ffffff', '#f4f4f5', '#71717a'],
    preview: {
      light: {
        accent: '#18181b',
        tint: '#f4f4f5',
        background: '#fff',
        soft: '#fafafa',
        border: '#e4e4e7',
        line: '#d4d4d8',
        text: '#18181b',
      },
      dark: {
        accent: '#fafafa',
        tint: '#27272a',
        background: '#09090b',
        soft: '#18181b',
        border: '#27272a',
        line: '#52525b',
        text: '#f4f4f5',
      },
      showDividers: false,
    },
    stylesheet: { content: minimalCss },
    components: { Breadcrumb: MinimalBreadcrumb, Outline: MinimalOutline },
  },
];

export const defaultThemePresetId = 'rspress';
