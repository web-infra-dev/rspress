---
'@rspress/plugin-og-image': minor
---

feat: add plugin-og-image for dynamic Open Graph image generation

This plugin automatically generates OG images for each page during build. It uses Satori for SVG rendering and Sharp for PNG conversion. Images are placed at `/og/{route-path}.png` and og:image meta tags are automatically injected into the HTML.
