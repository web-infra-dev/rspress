---
'@rspress/plugin-preview': patch
---

Align `@rspress/plugin-preview`'s `react-router-dom` peer dependency with `@rspress/core` so package managers do not install an incompatible router version that breaks `rspress build`.
