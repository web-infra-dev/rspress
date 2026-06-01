---
description: 了解 Rspress 项目结构、本地开发、生产构建、本地预览和后续学习路径。
---

# 快速开始

## 项目结构

使用 `create-rspress` 创建项目后，你会得到以下项目结构：

- `docs/`：文档源码目录，通过 `rspress.config.ts` 中的 `root` 配置。
- `docs/_nav.json`：导航栏配置。
- `docs/guide/_meta.json`：指南区域的侧边栏配置。
- `docs/public/`：静态资源目录。
- `theme/`：可选的自定义主题目录，在选择自定义主题模板时生成。
- `rspress.config.ts`：Rspress 配置文件。

## 本地开发

启动本地开发服务器：

```bash
npm run dev
```

:::tip

你可以使用 `--port` 或 `--host` 指定端口号或主机，例如 `rspress dev --port 8080 --host 0.0.0.0`。

:::

## 生产构建

构建生产站点：

```bash
npm run build
```

默认情况下，Rspress 会输出到 `doc_build` 目录。

## 预览

本地预览生产构建结果：

```bash
npm run preview
```

## 下一步

- 学习如何在文档中使用 [MDX 与 React 组件](/guide/use-mdx/components)。
- 了解 [代码块](/guide/use-mdx/code-blocks/) 的语法高亮和行高亮。
- 学习用于提示、警告等内容的 [自定义容器](/guide/use-mdx/container)。
- 浏览完整的 [Rspress 文档](https://rspress.rs/zh/) 了解高级能力。
