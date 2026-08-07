---
'@rspress/core': patch
---

Strip the HTML from the toc item tooltip, so that a heading which renders a component, a badge for example, no longer
shows the markup of that component as raw text on hover.
