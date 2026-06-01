# create-rspress

Create a new Rspress project.

Using `npm create`:

```bash
npm create rspress@latest
```

Using CLI flags:

```bash
npx create-rspress --dir my-project

# Using abbreviations
npx create-rspress -d my-project

# Scaffold with the basic theme template
npx create-rspress --dir my-project --template basic-theme

# Scaffold with the multilingual template
npx create-rspress --dir my-project --template i18n

# Scaffold with the multilingual theme template
npx create-rspress --dir my-project --template i18n-theme
```

Available templates:

| Template      | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| `basic`       | Creates a minimal Rspress documentation site with the default theme.        |
| `basic-theme` | Creates a single-language site with a `theme` folder for customization.     |
| `i18n`        | Creates a multilingual documentation site with English and Chinese content. |
| `i18n-theme`  | Creates a multilingual site with a `theme` folder for customization.        |

## Documentation

https://rspress.rs/

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/rspress/blob/main/CONTRIBUTING.md).

## License

Rspress is [MIT licensed](https://github.com/web-infra-dev/rspress/blob/main/LICENSE).
