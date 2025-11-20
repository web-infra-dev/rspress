# @rspress/plugin-og-image

A plugin for Rspress to dynamically generate Open Graph (OG) images for each page.

## Installation

```bash
npm install @rspress/plugin-og-image
# or
pnpm add @rspress/plugin-og-image
# or
yarn add @rspress/plugin-og-image
```

## Usage

Add the plugin to your `rspress.config.ts`:

```ts
import { defineConfig } from '@rspress/core';
import { pluginOgImage } from '@rspress/plugin-og-image';

export default defineConfig({
  plugins: [
    pluginOgImage({
      siteUrl: 'https://your-site.com',
    }),
  ],
});
```

## Options

### `siteUrl`

- Type: `string`
- Required: `true`

The base URL of your site. Used to generate absolute URLs for OG images.

### `ogImage`

- Type: `OgImageOptions`
- Required: `false`

Options for OG image generation.

#### `ogImage.width`

- Type: `number`
- Default: `1200`

Width of the generated OG image in pixels.

#### `ogImage.height`

- Type: `number`
- Default: `630`

Height of the generated OG image in pixels (630px is the recommended size for OG images).

#### `ogImage.template`

- Type: `(data: OgImageTemplateData) => string | Promise<string>`
- Required: `false`

Custom template function to generate the image. Receives page data and should return a React-like JSX structure compatible with [Satori](https://github.com/vercel/satori).

#### `ogImage.filter`

- Type: `(pageData: PageIndexInfo) => boolean`
- Default: `() => true`

Filter function to determine which pages should have OG images generated. By default, all pages get OG images.

## Frontmatter Options

You can customize OG images per page using frontmatter:

```md
---
title: My Page
description: A description of my page
ogBackgroundColor: '#1a1a1a'
ogTextColor: '#ffffff'
siteName: My Site
---
```

## Generated URLs

OG images are generated with URLs matching your page routes:

- Page: `https://your-site.com/guide/getting-started`
- OG Image: `https://your-site.com/og/guide/getting-started.png`

## How It Works

1. During the build process, the plugin generates OG images for each page
2. Images are created using [Satori](https://github.com/vercel/satori) (SVG generation) and [Sharp](https://sharp.pixelplumbing.com/) (PNG conversion)
3. OG image meta tags are automatically added to each page's frontmatter
4. Images are saved to the output directory in the `/og` folder

## License

MIT
