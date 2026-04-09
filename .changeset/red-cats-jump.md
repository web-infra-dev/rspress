---
'@rspress/core': patch
'@rspress/shared': patch
---

Bundle `github-slugger` via `@rspress/shared` so it no longer ships as a published runtime dependency in Rspress installs. This improves installation size and dependency hygiene.
