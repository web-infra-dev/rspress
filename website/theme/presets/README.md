# Website theme preview protocol

A theme is a normal Rspress custom theme folder. Its `index.tsx` imports CSS/SCSS, wraps components from `@rspress/core/theme-original`, and reexports the built-in theme. `meta.ts` describes the card and source location. The folder has no imports from the website's preview runtime and can be copied to another project or maintained in another repository.

```text
minimal/
├── index.tsx
├── index.scss
├── components/   # optional, imported with relative paths
├── assets/       # optional, referenced with relative paths
└── meta.ts
```

## Theme entry

Use the same entry in the website preview and a normal custom theme:

```tsx
import './index.scss';
import {
  Layout as OriginalLayout,
  type LayoutProps,
} from '@rspress/core/theme-original';

export * from '@rspress/core/theme-original';
export { Outline } from './components/Outline';

export function Layout(props: LayoutProps) {
  return (
    <OriginalLayout
      {...props}
      beforeDocContent={
        <>
          {/* Your content */}
          {props.beforeDocContent}
        </>
      }
    />
  );
}
```

All Layout slots work normally. Forward incoming props when wrapping Layout so the website can retain its navigation integrations. Local components and assets use relative imports. Built-in components use `@rspress/core/theme-original`; no additional dependencies are part of this first protocol.

## Portable metadata

Export a plain object from `meta.ts`, without importing website types. The registry checks it against `ThemePresetMeta` when registering the theme. Metadata contains a stable `id`, `name`, localized `description`, `palette`, light/dark `preview` colors, and `source` with `repository`, `ref`, and `directory`. See `website/themes/minimal/meta.ts` for the complete example.

`meta.ts` does not contain a prompt. The single template in `generateThemePrompt.ts` uses the source location and loaded module's supported exports to produce implementation steps, entry examples, and verification instructions. Copy prompt does not include the theme's promotional description. Update `source` when moving the theme or changing its version.

## Register source at build time

1. Make the theme source folder available before the website build, by copying it or checking out its repository.
2. Import its metadata in `registry.ts` and add a literal source import:

```ts
import meta from '../../themes/minimal/meta';

const preset = {
  ...meta,
  load: () => import('../../themes/minimal/index?theme-preview'),
};
```

3. Register its `id` and absolute directory with `pluginThemePreview` in `website/rspress.config.ts`.

These are website integration changes. A normal project imports the theme entry without `?theme-preview` and does not install the preview plugin. Moving the entire folder requires changing the registration paths and metadata source location, not rewriting its components or styles. SCSS uses the website's existing `pluginSass()` configuration.

## Bounded component overrides

The website currently switches **Layout** and **Outline** only. Normal `export *` and local component reexports work; other exports continue to use the website's existing components. Algolia Search, Root, routing, and startup hooks are never replaced by a preview.

The extension point is deliberately marked in `types.ts` (`ThemePreviewModule` and `supportedPreviewExports`) and `PresetDocChrome.tsx`. To support `DocFooter`, for example, extend the module type/list, add a wrapper selecting the active module's `DocFooter` with a built-in fallback, export that wrapper from `website/theme/index.tsx`, and test switching/resetting it. Do not infer a component from whether the theme has CSS.

## Reversible styles and runtime

The website-only build transform follows local imports/reexports from an entry marked `?theme-preview`. It compiles normal side-effect CSS/SCSS imports through Rsbuild's `?inline` pipeline and registers the resulting CSS. Imported styles are collected without becoming active during loading. Shared Rspress styles are untouched.

The provider loads a source module once, then commits its components and collected CSS together. Switching away clears the preset CSS; returning to a cached theme reapplies it. The mounted Layout is keyed by theme ID. URL, runtime context, and preview controls remain outside that keyed subtree. A failed load leaves the previous theme active and allows retry. Reset restores the original website theme, and reload starts from it.

This initial source protocol supports local JS/TS components, regular global CSS/SCSS/Sass imports, relative assets, and SCSS imports inside stylesheets. It does not rewrite CSS Modules or theme-side dynamic component imports; use static local imports for the first supported themes. This is a website implementation limit, not a restriction on Rspress custom themes generally. There are no core changes or new user-facing configuration options.
