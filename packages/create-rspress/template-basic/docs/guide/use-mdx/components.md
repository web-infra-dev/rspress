# MDX & React Components

Rspress supports not only Markdown but also [MDX](https://mdxjs.com/), a powerful way to develop content.

## Markdown

MDX is a superset of Markdown, which means you can write Markdown files as usual. For example:

```md
# Hello world
```

## Use component

When you want to use React components in Markdown files, you should name your files with `.mdx` extension. For example:

```mdx
// docs/index.mdx
import { CustomComponent } from './custom';

# Hello world

<CustomComponent />
```

## Front matter

You can add Front Matter at the beginning of your Markdown file, which is a YAML-formatted object that defines some metadata. For example:

```yaml
---
title: Hello world
---
```

> Note: By default, Rspress uses h1 headings as html headings.

You can also access properties defined in Front Matter in the body, for example:

```markdown
---
title: Hello world
---

# {frontmatter.title}
```

The previously defined properties will be passed to the component as `frontmatter` properties. So the final output will be:

```html
<h1>Hello world</h1>
```
