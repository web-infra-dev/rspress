---
description: Rspress 入门模板首页，包含指南、MDX、搜索、AI、SSG 和主题定制入口。
pageType: home

hero:
  name: 我的站点
  text: 一个很酷的网站！
  tagline: 这是网站的副标题
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/start/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/web-infra-dev/rspress
  image:
    src: /rspress-icon.png
    alt: Logo
features:
  - title: 极速构建
    details: 核心编译模块基于 Rust 前端工具链，提供更极致的开发体验。
    icon: 🏃🏻‍♀️
    link: /zh/guide/start/introduction
  - title: 支持 MDX 内容编写
    details: MDX 是一种强大的内容编写方式，可以在 Markdown 中使用 React 组件。
    icon: 📦
    link: /zh/guide/use-mdx/components
  - title: 内置全文搜索
    details: 构建时自动生成全文搜索索引，提供开箱即用的全文搜索能力。
    icon: 🎨
    link: https://rspress.rs/zh/guide/advanced/custom-search
  - title: AI 友好
    details: 通过 SSG-MD 生成符合 llms.txt 规范的 llms.txt 和 Markdown 文件，让大语言模型更容易理解和使用你的文档。
    icon: 🤖
    link: https://rspress.rs/zh/guide/basic/ssg-md
  - title: 静态站点生成
    details: 在生产环境中自动构建为静态 HTML 文件，可以轻松部署到任意位置。
    icon: 🌈
    link: https://rspress.rs/zh/guide/basic/ssg
  - title: 提供多种自定义能力
    details: 通过扩展机制，你可以轻松扩展主题 UI 和构建流程。
    icon: 🔥
    link: https://rspress.rs/zh/guide/basic/custom-theme
---
