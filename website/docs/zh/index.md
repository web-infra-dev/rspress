---
pageType: home
title: Rspress
titleSuffix: '基于 Rsbuild 的静态站点生成器'

hero:
  name: Rspress
  text: |
    快如闪电的
    静态站点生成器
  tagline: 简单、高性能、易于扩展
  image:
    src: https://assets.rspack.rs/rspress/rspress-logo.svg
    alt: Rspress Logo
  actions:
    - theme: brand
      text: 介绍
      link: ./guide/start/introduction
    - theme: alt
      text: 快速开始
      link: ./guide/start/getting-started

features:
  - title: 极高的编译性能
    details: 核心编译模块基于 Rust 前端工具链完成，带来更加极致的开发体验。
    icon: /speed.svg
    link: ./guide/start/introduction
  - title: 支持 MDX
    details: MDX 是一种强大的内容编写方式，你可以在 Markdown 中使用 React 组件。
    icon: /mdx.svg
    link: ./guide/use-mdx/components
  - title: 内置全文搜索
    details: 构建时自动为你生成全文搜索索引，提供开箱即用的全文搜索能力。
    icon: /search.svg
    link: ./guide/advanced/custom-search
  - title: AI 友好
    details: 通过 SSG-MD 生成符合 llms.txt 规范的索引文件和 Markdown 文件，便于大语言模型理解和使用你的技术文档。
    icon: /ai.svg
    link: ./guide/basic/ssg-md
  - title: 静态站点生成
    details: 生产环境下，会自动构建为静态 HTML 文件，你可以轻松的部署到任何地方。
    icon: /static.svg
    link: ./guide/basic/ssg
  - title: 提供多种自定义能力
    details: 通过插件和自定义主题机制，你可以轻松的扩展主题 UI 和构建能力。
    icon: /custom.svg
    link: ./guide/basic/custom-theme
---
