# Website theme presets

`ThemePreset` in `types.ts` is the website integration contract. The theme CSS and React components can live in this repository or an external package. Keep their imports, localized prompts, and metadata in `registry.ts`; the switcher and document shell do not depend on a particular theme.

## Add a theme

1. Import the theme's CSS as a string and its optional React components in `registry.ts`.
2. Append a `ThemePreset` entry to `themePresets`. Use a unique, stable `id`.
3. Provide light/dark preview colors and an installation prompt. No switcher changes are needed.

For example, after publishing a theme package with CSS and component exports:

```tsx
import oceanCss from '@your-org/rspress-theme-ocean/style.css?raw';
import { Breadcrumb, Outline } from '@your-org/rspress-theme-ocean';
import type { ThemePreset } from './types';

const ocean = {
  id: 'ocean',
  name: 'Ocean',
  description: { en: 'A blue documentation theme.', zh: '蓝色文档主题。' },
  palette: ['#2563eb', '#ffffff', '#eff6ff', '#1e293b'],
  preview: {
    light: {
      accent: '#2563eb',
      tint: '#eff6ff',
      background: '#fff',
      soft: '#f8fafc',
      border: '#e2e8f0',
      line: '#cbd5e1',
      text: '#1e293b',
    },
    dark: {
      accent: '#93c5fd',
      tint: '#172554',
      background: '#0f172a',
      soft: '#1e293b',
      border: '#334155',
      line: '#64748b',
      text: '#f8fafc',
    },
  },
  stylesheet: { content: oceanCss },
  prompt: {
    en: 'Apply @your-org/rspress-theme-ocean to this Rspress v2 project. Follow the package installation guide, preserve existing customizations, and verify the docs build and responsive layout.',
    zh: '请为当前 Rspress v2 项目应用 @your-org/rspress-theme-ocean。参考包的安装指南，保留已有自定义配置，并验证文档构建和响应式布局。',
  },
  components: { Breadcrumb, Outline },
} satisfies ThemePreset;

// Append ocean to the registry's themePresets array.
```

`description` and `prompt` accept a string or `{ en, zh }`. Preview colors drive the card's CSS variables. Set `preview.showDividers` to `false` for a shell without sidebar/navigation dividers.

`stylesheet.content` is the CSS used for preview. Bundle it with a raw import, so previewing does not depend on a runtime request. The default preset omits `stylesheet`; every other preset supplies non-empty CSS. IDs must be unique, even when two themes share the same CSS.

`prompt` contains the agent instructions copied by the single **Copy prompt** button. Describe how to apply the theme, preserve existing customizations, and verify the result. Include versioned package names or implementation source URLs in the prompt as needed. The website does not expose CSS copy or download actions.

`components` is optional: a CSS-only theme retains the original outline and adds no breadcrumb. Theme components must import built-ins from `@rspress/core/theme-original` to avoid a circular import through the website theme.

## State and rendering

`ThemePresetProvider` receives the registry and `defaultPresetId`. It belongs inside `CssModificationProvider`, above the website layout. `useThemePreset()` exposes the registry, active preset, and `selectPreset(id)`.

The selected ID determines the active card and component overrides. CSS stays in the existing modification store so navigation preserves the preview and the floating toolbar's Reset restores both CSS and layout. Reload starts from the default theme. Theme-switch animations remain in the generic switcher; reduced-motion users switch immediately.

## Move themes to another repository

Publish the CSS and React components from the new repository, then replace their local imports in `registry.ts` with package imports and update the installation instructions and versioned source URLs in each prompt. The provider, switcher, document shell, and metadata interface stay the same. The public Themes pages describe the prompt workflow and do not contain theme file download links.
