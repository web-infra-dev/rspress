import { Layout, Outline } from '@rspress/core/theme-original';
import type { ThemePresetMeta, ThemePreviewModule } from './types';
import { supportedPreviewExports } from './types';

/** One installation template, not theme-authored promotional copy. */
export function generateThemePrompt(
  meta: ThemePresetMeta,
  lang: string,
  module?: ThemePreviewModule,
): string {
  const guide = `https://rspress.rs/${lang === 'zh' ? 'zh/' : ''}guide/basic/custom-theme.md`;
  if (!meta.source) {
    return lang === 'zh'
      ? `请为当前 Rspress v2 项目恢复默认主题。先阅读 ${guide} 并检查配置和 theme/index.tsx。仅移除此前主题预设引入的样式和组件覆盖，保留其他自定义配置、文档、导航及插件。继续从 @rspress/core/theme-original 重导出内置主题。运行项目检查和文档构建，并验证桌面端、移动端、亮色和暗色效果。`
      : `Restore the default theme in this existing Rspress v2 project. Read ${guide} and inspect the config and theme/index.tsx. Remove only the previous preset's styles and component overrides; preserve other customizations, content, navigation, and plugins. Keep reexports from @rspress/core/theme-original. Run project checks and the docs build, then verify desktop/mobile and light/dark appearances.`;
  }
  const source = `${meta.source.repository}/tree/${meta.source.ref}/${meta.source.directory}`;
  const originals = { Layout, Outline };
  const exports =
    supportedPreviewExports
      .filter(name => module?.[name] && module[name] !== originals[name])
      .join(', ') || 'none';
  const example = `export * from './${meta.id}';`;
  return lang === 'zh'
    ? `请为当前 Rspress v2 项目应用 ${meta.name} 主题。\n\n1. 阅读 ${guide}，检查现有配置和 theme/index.tsx。\n2. 源码仓库：${meta.source.repository}；版本：${meta.source.ref}；目录：${meta.source.directory}。源码链接：${source}。将整个目录复制到 theme/${meta.id}/，保留 index.tsx、CSS/SCSS、组件和相对资源路径。meta.ts 仅用于官网主题展示，不是运行时依赖。\n3. index.tsx 正常导入样式、从 @rspress/core/theme-original 重导出并包装 Layout。当前预览支持的导出：${exports}。查看并保留源文件实际覆盖的组件与 Layout 插槽；未覆盖的组件使用内置主题；不需要任何官网预览配置或特殊导入查询。\n4. 若使用 SCSS，沿用 Rspress 的常规 pluginSass 构建配置。将主题入口合并到已有 theme/index.tsx，示例：\n\n${example}\n\n显式导出已有自定义组件时，避免它们意外覆盖本次主题的同名导出；保留其他定制、导航、文档、插件和现有搜索服务。\n5. 运行项目检查和文档构建，验证所有 Layout 插槽、侧边栏、目录、代码块、亮暗模式和移动端布局。`
    : `Apply the ${meta.name} theme to this existing Rspress v2 project.\n\n1. Read ${guide} and inspect the config and theme/index.tsx.\n2. Repository: ${meta.source.repository}; ref: ${meta.source.ref}; directory: ${meta.source.directory}. Source: ${source}. Copy the entire directory into theme/${meta.id}/, retaining index.tsx, CSS/SCSS, components, and relative asset paths. meta.ts is website metadata, not a runtime dependency.\n3. The normal index.tsx imports styles, reexports @rspress/core/theme-original, and wraps Layout. Current preview exports: ${exports}. Inspect and retain the source's actual component overrides and Layout slots; keep built-in components that the source does not override. No website preview configuration or special import query is needed in the target project.\n4. For SCSS, use the standard Rspress pluginSass build configuration. Merge the entry into the existing theme/index.tsx, for example:\n\n${example}\n\nCheck explicit existing exports so they do not accidentally shadow the new theme's matching exports. Preserve other customizations, navigation, content, plugins, and the current search service.\n5. Run project checks and the docs build. Verify Layout slots, sidebar, outline, code blocks, light/dark appearance, and mobile layout.`;
}
