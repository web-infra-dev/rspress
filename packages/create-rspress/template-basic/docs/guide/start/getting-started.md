# Getting started

## Project structure

After creating a project with `create-rspress`, you will get the following project structure:

- `docs/` — The documentation source directory, configured via `root` in `rspress.config.ts`.
- `docs/_nav.json` — The navigation bar configuration.
- `docs/guide/_meta.json` — The sidebar configuration for the guide section.
- `docs/public/` — Static assets directory.
- `rspress.config.ts` — The Rspress configuration file.

## Development

Start the local development server:

```bash
npm run dev
```

:::tip

You can specify the port number or host with `--port` or `--host`, such as `rspress dev --port 8080 --host 0.0.0.0`.

:::

## Production build

Build the site for production:

```bash
npm run build
```

By default, Rspress will output to `doc_build` directory.

## Preview

Preview the production build locally:

```bash
npm run preview
```

## Next steps

- Learn how to use [MDX & React Components](/guide/use-mdx/components) in your docs.
- Learn about [Code Blocks](/guide/use-mdx/code-blocks/) syntax highlighting and line highlighting.
- Learn about [Custom Containers](/guide/use-mdx/container) for tips, warnings, and more.
- Explore the full [Rspress documentation](https://rspress.rs/) for advanced features.
