# Website theme presets

`ThemePreset` in `types.ts` is the website integration contract. The theme CSS and React components can live in this repository or an external package. Keep their imports, download locations, and metadata in `registry.ts`; the switcher and document shell do not depend on a particular theme.

## Add a theme

1. Import the theme's CSS as a string and its optional React components in `registry.ts`.
2. Append a `ThemePreset` entry to `themePresets`. Use a unique, stable `id`.
3. Provide light/dark preview colors and installation assets. No switcher changes are needed.

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
  stylesheet: {
    content: oceanCss,
    download: {
      href: 'https://example.com/themes/ocean/v1/style.css',
      fileName: 'ocean.css',
      label: { en: 'Download CSS', zh: '下载 CSS' },
    },
  },
  downloads: [
    {
      href: 'https://example.com/themes/ocean/v1/index.tsx',
      fileName: 'ocean.tsx',
      label: { en: 'Download theme entry', zh: '下载主题入口' },
    },
  ],
  components: { Breadcrumb, Outline },
} satisfies ThemePreset;

// Append ocean to the registry's themePresets array.
```

`description` and asset `label` accept a string or `{ en, zh }`. Preview colors drive the card's CSS variables. Set `preview.showDividers` to `false` for a shell without sidebar/navigation dividers.

`stylesheet.content` is the CSS used for both preview and copying. Bundle it with a raw import, so previewing does not depend on a runtime request. The default preset omits `stylesheet`; every other preset supplies non-empty CSS. IDs must be unique, even when two themes share the same CSS.

Download assets accept public paths or absolute URLs. Public paths receive the configured Rspress base. Cross-origin assets follow the browser's download rules; serve them with an attachment response header if they should download rather than open. Asset links should use the same version as the bundled theme implementation.

`components` is optional: a CSS-only theme retains the original outline and adds no breadcrumb. Theme components must import built-ins from `@rspress/core/theme-original` to avoid a circular import through the website theme.

## State and rendering

`ThemePresetProvider` receives the registry and `defaultPresetId`. It belongs inside `CssModificationProvider`, above the website layout. `useThemePreset()` exposes the registry, active preset, and `selectPreset(id)`.

The selected ID determines the active card and component overrides. CSS stays in the existing modification store so navigation preserves the preview and the floating toolbar's Reset restores both CSS and layout. Reload starts from the default theme. Theme-switch animations remain in the generic switcher; reduced-motion users switch immediately.

## Move themes to another repository

Publish the CSS and React components from the new repository, then replace their local imports in `registry.ts` with package imports and update the versioned installation URLs. The provider, switcher, document shell, and metadata interface stay the same. The public Themes pages' Ruixen installation examples should also be updated if its distribution path changes.
