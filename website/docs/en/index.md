---
pageType: home
title: Rspress
titleSuffix: 'Rsbuild-based Static Site Generator'

hero:
  name: Rspress
  text: Lightning Fast Static Site Generator
  tagline: Simple, efficient and easy to extend
  actions:
    - theme: brand
      text: Introduction
      link: ./guide/start/introduction
    - theme: alt
      text: Quick Start
      link: ./guide/start/getting-started
  image:
    src: https://assets.rspack.rs/rspress/rspress-logo.svg
    alt: Rspress Logo
features:
  - title: Blazing fast build speed
    details: The core compilation module is based on the Rust front-end toolchain, providing a more ultimate development experience.
    icon: /speed.svg
    link: ./guide/start/introduction
  - title: Support for MDX
    details: MDX is a powerful way to write content, allowing you to use React components in Markdown.
    icon: /mdx.svg
    link: ./guide/use-mdx/components
  - title: Built-in full-text search
    details: Automatically generates a full-text search index for you during construction, providing out-of-the-box full-text search capabilities.
    icon: /search.svg
    link: ./guide/advanced/custom-search
  - title: AI-friendly
    details: Generate llms.txt and Markdown files compliant with the llms.txt specification through SSG-MD, making it easier for large language models to understand and use your documentation.
    icon: /ai.svg
    link: ./guide/basic/ssg-md
  - title: Static site generation
    details: In production, it automatically builds into static HTML files, which can be easily deployed anywhere.
    icon: /static.svg
    link: ./guide/basic/ssg
  - title: Providing multiple custom capabilities
    details: Through its extension mechanism, you can easily extend theme UI and build process.
    icon: /custom.svg
    link: ./guide/basic/custom-theme
---
