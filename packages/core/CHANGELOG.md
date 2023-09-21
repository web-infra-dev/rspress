# @rspress/core

## 0.1.0

### Minor Changes

- 6132722: feat: integrate @rspress/mdx-rs

  feat: 集成 @rspress/mdx-rs

### Patch Changes

- 1b3c4a1: feat: support SearchPanel component export

  feat: 支持 SearchPanel 组件导出

- 05e1b13: fix: runtime type missed

  fix: runtime 目录类型丢失

- e076e31: chore: no need to print the server bundles size

  chore: 无须输出 server bundles 的体积

- f155ee3: fix: container syntax not work

  fix: 容器语法不生效

- db250f2: feat: support icon absolute path

  feat: 支持 icon 配置绝对路径

- Updated dependencies [6132722]
  - @rspress/plugin-auto-nav-sidebar@0.1.0
  - @rspress/plugin-container-syntax@0.1.0
  - @rspress/plugin-last-updated@0.1.0
  - @rspress/plugin-medium-zoom@0.1.0
  - @rspress/shared@0.1.0

## 0.0.13

### Patch Changes

- 80a49c1: feat: remove @headlessui/react dep

  feat: 移除 @headlessui/react 依赖

- 1d42f2a: feat: support PackageManagerTabs export

  feat: 支持 PackageManagerTabs 组件导出

- 038c371: fix: dispaly error log in ssg phase

  fix: ssg 阶段显示错误日志

  - @rspress/plugin-auto-nav-sidebar@0.0.13
  - @rspress/plugin-container-syntax@0.0.13
  - @rspress/plugin-last-updated@0.0.13
  - @rspress/plugin-medium-zoom@0.0.13
  - @rspress/shared@0.0.13

## 0.0.12

### Patch Changes

- Updated dependencies [370b348]
  - @rspress/plugin-auto-nav-sidebar@0.0.12
  - @rspress/plugin-container-syntax@0.0.12
  - @rspress/plugin-last-updated@0.0.12
  - @rspress/plugin-medium-zoom@0.0.12
  - @rspress/shared@0.0.12

## 0.0.11

### Patch Changes

- 47c2e53: fix: remove deprecated npm package

  fix: 移除废弃的 npm 包

- 0896e86: fix: hmr invalid for adding file case

  fix: 增加文件后，热更新失效

- 4e7ca8c: perf: enable deterministic chunkIds of Rspack

  perf: 开启 Rspack 的 deterministic chunkIds

- 5fcc813: fix(mdx-rs): avoid panic when parsing mdx ast
- 0943989: feat: support props for globalUIComponents config

  feat: 支持 `globalUIComponents` 的 props 配置

- Updated dependencies [0896e86]
- Updated dependencies [0943989]
  - @rspress/plugin-auto-nav-sidebar@0.0.11
  - @rspress/plugin-container-syntax@0.0.11
  - @rspress/plugin-last-updated@0.0.11
  - @rspress/plugin-medium-zoom@0.0.11
  - @rspress/shared@0.0.11

## 0.0.10

### Patch Changes

- 82d85e2: feat: integrate rspack-plugin-virtual-module

  feat: 集成 rspack-plugin-virtual-module

- 4ecf59c: chore: update tabs default theme style

  chore: 更新 tabs 默认主题样式

- 0a4dbc6: feat: optimize default theme layout

  feat: 优化默认主题布局

- 259c2e6: fix: avoid error when \_meta.json is not correct

  fix: 修复 \_meta.json 内容不正确时报错

- f6f9ddb: feat: specify limit version for create-rspress template

  feat: 为 create-rspress 模板指定限制 rspress 版本

- 51211bc: fix: asset prefix not work for search index url

  fix: asset prefix 配置在搜索索引中不生效

- 587d299: feat: support container syntax by plugin

  feat: 以插件的方式支持 container 语法

- f21526b: fix: avoid `@theme` resolve error in pure js project

  fix: 纯 js 项目中避免 `@theme` 解析错误

- Updated dependencies [82d85e2]
- Updated dependencies [0a4dbc6]
- Updated dependencies [259c2e6]
- Updated dependencies [f6f9ddb]
- Updated dependencies [51211bc]
- Updated dependencies [587d299]
- Updated dependencies [f21526b]
  - @rspress/plugin-auto-nav-sidebar@0.0.10
  - @rspress/plugin-container-syntax@0.0.10
  - @rspress/plugin-last-updated@0.0.10
  - @rspress/plugin-medium-zoom@0.0.10
  - @rspress/shared@0.0.10

## 0.0.9

### Patch Changes

- b46cdfd: fix: runtime exports problem

  fix: runtime 文件导出问题

- Updated dependencies [b46cdfd]
  - @rspress/plugin-auto-nav-sidebar@0.0.9
  - @rspress/plugin-last-updated@0.0.9
  - @rspress/plugin-medium-zoom@0.0.9
  - @rspress/remark-container@0.0.8
  - @rspress/shared@0.0.9

## 0.0.8

### Patch Changes

- 86677f1: fix: resolve error in pure js project

  fix: 修复纯 js 项目中的路径 resolve 报错

- Updated dependencies [86677f1]
  - @rspress/plugin-auto-nav-sidebar@0.0.8
  - @rspress/plugin-last-updated@0.0.8
  - @rspress/plugin-medium-zoom@0.0.8
  - @rspress/remark-container@0.0.7
  - @rspress/shared@0.0.8

## 0.0.7

### Patch Changes

- 24450c2: feat: export `Plugin` type in @rspress/shared

  feat: 在 @rspress/shared 中导出 `Plugin` 类型

- Updated dependencies [24450c2]
  - @rspress/shared@0.0.7
  - @rspress/plugin-auto-nav-sidebar@0.0.7
  - @rspress/plugin-last-updated@0.0.7
  - @rspress/plugin-medium-zoom@0.0.7
  - @rspress/remark-container@0.0.6

## 0.0.6

### Patch Changes

- beb23d6: fix: landing message in cli

  fix: 更新 cli 的开场信息

- Updated dependencies [beb23d6]
  - @rspress/plugin-auto-nav-sidebar@0.0.6
  - @rspress/plugin-last-updated@0.0.6
  - @rspress/plugin-medium-zoom@0.0.6
  - @rspress/remark-container@0.0.5
  - @rspress/shared@0.0.6

## 0.0.5

### Patch Changes

- 1171bc9: fix: logger params optional

  fix: logger 参数变为可选

- Updated dependencies [1171bc9]
  - @rspress/plugin-auto-nav-sidebar@0.0.5
  - @rspress/plugin-last-updated@0.0.5
  - @rspress/plugin-medium-zoom@0.0.5
  - @rspress/remark-container@0.0.4
  - @rspress/shared@0.0.5

## 0.0.4

### Patch Changes

- e097820: feat: bump mdx-rs version
- 0ab0f9f: feat: add @rspress/remark-container

  feat: 添加 @rspress/remark-container

- Updated dependencies [e097820]
- Updated dependencies [0ab0f9f]
  - @rspress/plugin-auto-nav-sidebar@0.0.4
  - @rspress/plugin-last-updated@0.0.4
  - @rspress/plugin-medium-zoom@0.0.4
  - @rspress/remark-container@0.0.3
  - @rspress/shared@0.0.4

## 0.0.3

### Patch Changes

- c9d37de: feat: replace prefix classname keyword to rspress

  feat: 将所有的类名前缀关键字替换为 rspress

- Updated dependencies [c9d37de]
  - @rspress/plugin-auto-nav-sidebar@0.0.3
  - @rspress/plugin-last-updated@0.0.3
  - @rspress/plugin-medium-zoom@0.0.3
  - @rspress/shared@0.0.3

## 0.0.2

### Patch Changes

- 269d0a9: chore: add docs package
- Updated dependencies [269d0a9]
  - @rspress/plugin-auto-nav-sidebar@0.0.2
  - @rspress/plugin-last-updated@0.0.2
  - @rspress/plugin-medium-zoom@0.0.2
  - @rspress/shared@0.0.2

## 0.0.1

### Patch Changes

- db2d3cd: feat: add plugins
- Updated dependencies [db2d3cd]
  - @rspress/plugin-auto-nav-sidebar@0.0.1
  - @rspress/plugin-last-updated@0.0.1
  - @rspress/plugin-medium-zoom@0.0.1
  - @rspress/shared@0.0.1
