---
'@rspress/core': patch
---

Avoid hanging SSG builds when the web compilation fails before emitting `index.html`, such as when template public assets like the favicon are missing.
