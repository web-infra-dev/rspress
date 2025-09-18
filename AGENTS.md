# AI agents and LLM integration

This document describes how AI agents and Large Language Models (LLMs) can effectively work with Rspress projects, and how developers can optimize their documentation for AI consumption.

## 🤖 Overview

Rspress provides excellent support for AI agents and LLMs through built-in features that make documentation more accessible and machine-readable. This enables AI agents to better understand, navigate, and utilize your documentation.

## 🔌 Built-in LLM support

### @rspress/plugin-llms

Rspress includes the official `@rspress/plugin-llms` plugin that automatically generates [llms.txt](https://llmstxt.org/) files to help large language models better understand your documentation site.

**Key Features:**

- Generates `llms.txt` and `llms-full.txt` files
- Creates machine-readable documentation structure
- Supports multiple languages and internationalization
- Provides UI components for AI interaction

**Installation:**

```bash
npm add @rspress/plugin-llms -D
# or
pnpm add @rspress/plugin-llms -D
# or
yarn add @rspress/plugin-llms -D
```

**Basic Usage:**

```ts
// rspress.config.ts
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';

export default defineConfig({
  plugins: [pluginLlms()],
});
```

For detailed configuration options, see the [plugin documentation](./website/docs/en/plugin/official-plugins/llms.mdx).

## 🎯 AI agent best practices

### For documentation authors

1. **Clear Structure**: Use consistent heading hierarchy and navigation
2. **Descriptive Titles**: Write clear, descriptive page titles and descriptions
3. **Frontmatter**: Include useful metadata in your MDX/Markdown frontmatter
4. **Code Examples**: Provide complete, runnable code examples
5. **Cross-references**: Link related concepts and pages appropriately

### For AI agent developers

1. **Use llms.txt**: Always check for and utilize the generated `llms.txt` files
2. **Follow Navigation**: Respect the site's navigation structure and hierarchy
3. **Parse Metadata**: Extract information from page frontmatter and metadata
4. **Handle MDX**: Be prepared to process both Markdown and MDX content
5. **Respect Internationalization**: Handle multi-language documentation appropriately

## 🛠️ Integration guides

### Reading Rspress documentation

AI agents can efficiently consume Rspress documentation by:

1. **Starting with llms.txt**: Check `{site}/llms.txt` for a structured overview
2. **Using the Full Version**: Access `{site}/llms-full.txt` for complete content
3. **Following Navigation**: Parse the navigation structure for logical flow
4. **Accessing Raw Markdown**: Use the generated `.md` files in the build output

### API integration

```javascript
// Example: Fetching and parsing llms.txt
async function parseLlmsTxt(siteUrl) {
  const response = await fetch(`${siteUrl}/llms.txt`);
  const content = await response.text();

  // Parse the structured content
  const sections = content.split('\n## ').filter(Boolean);
  return sections.map((section) => {
    const [title, ...links] = section.split('\n');
    return {
      title: title.replace('# ', '').replace('## ', ''),
      pages: links.filter((link) => link.trim().startsWith('-')),
    };
  });
}
```

### Custom processing

For advanced AI agent integration, you can customize the LLMs plugin:

```ts
import { pluginLlms } from '@rspress/plugin-llms';

export default defineConfig({
  plugins: [
    pluginLlms({
      llmsTxt: {
        name: 'llms.txt',
        onTitleGenerate: ({ title, description }) => {
          return `# ${title}\n\n> ${description}\n\nOptimized for AI agents and LLMs.`;
        },
        onLineGenerate: (page) => {
          // Custom formatting for each page entry
          return `- [${page.title}](${page.routePath}): ${page.frontmatter.description || 'No description'}`;
        },
      },
    }),
  ],
});
```

## 🌐 Multi-language Support

For internationalized sites, the plugin automatically generates language-specific files:

```
/llms.txt          # Default language
/zh/llms.txt       # Chinese
/es/llms.txt       # Spanish
```

AI agents should detect and use the appropriate language version based on user preferences or explicit language parameters.

## 📋 Common use cases

### Documentation QA bots

- Ingest llms.txt for quick site understanding
- Use navigation structure for context-aware responses
- Reference specific pages and sections accurately

### Code generation assistants

- Parse API documentation and examples
- Understand library usage patterns
- Generate code snippets based on documentation

### Content analysis tools

- Analyze documentation coverage and completeness
- Identify outdated or missing information
- Generate documentation metrics and reports

### Translation assistants

- Use structured content for consistent translations
- Maintain links and references across languages
- Preserve markdown formatting and metadata

## 🔗 Related resources

- [llms.txt Standard](https://llmstxt.org/) - The standard format for LLM-friendly documentation
- [Rspress Plugin System](./website/docs/en/plugin/system/introduction.mdx) - Learn about extending Rspress
- [MDX Documentation](https://mdxjs.com/) - Understanding MDX format used by Rspress
- [Rsbuild](https://rsbuild.rs/) - The underlying build tool powering Rspress

## 🤝 Contributing

If you're developing AI agents that work with Rspress or have suggestions for improving AI integration:

1. Check our [Contributing Guide](./CONTRIBUTING.md)
2. Open an issue to discuss AI-related features
3. Submit PRs for AI agent improvements
4. Share your AI integration use cases

## 📄 License

This documentation follows the same [MIT License](./LICENSE) as the Rspress project.
