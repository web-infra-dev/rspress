# @rspress/theme-default

## 1.15.1

### Patch Changes

- 9139dc3: fix: add scroll padding top
- 1f2febd: fix: only scroll panel when item is unvisible
- ab88310: fix: sidebar text not update when navigate to other nav item (#770)
  - @rspress/runtime@1.15.1
  - @rspress/shared@1.15.1

## 1.15.0

### Minor Changes

- 2f6bda9: feat: support custom overview and sub overview

### Patch Changes

- 79a4142: fix sidebar begining top items was unchanged after page switch
- 3b6aafe: fix: plugin-shiki space style
- 3b64c40: fix: update nav when resize
- 52dc2e5: fix: support format pre code when children is array
- 915064f: fix(theme-deafult): use new Lark icon
- 22487ef: fix(theme-default): scroll search panel when current item is unvisible
  - @rspress/runtime@1.15.0
  - @rspress/shared@1.15.0

## 1.14.0

### Patch Changes

- 0953263: feat: support Badge component
- b620be0: fix: useFullTextSearch hook not work
- 806316c: chore: remove useless overflow-hidden style
- 7b6eea0: chore: optimize dark mode style
- 6e8a6a8: fix: adjust rspress doc max width
- f401506: feat: support section header
- cfc0842: feat: support inline markdown in sidebar
- dfe3bb2: fix: implement svg icon wrapper
- 0903f7e: correct style issue with lark svg icon
- Updated dependencies [f401506]
  - @rspress/shared@1.14.0
  - @rspress/runtime@1.14.0

## 1.13.2

### Patch Changes

- b13bcc4: fix(theme-default): make outline have a well width again
  - @rspress/runtime@1.13.2
  - @rspress/shared@1.13.2

## 1.13.1

### Patch Changes

- baa2236: fix(style): overview links margin not work
- a233e23: fix(theme-default): adjust sidebar menu z-index
- 9b02797: fix(theme-default): doc container with full width.
- ddb169b: perf: pre build svg in theme package
- 321c4c8: chore: replace omitted svg import statement
  - @rspress/runtime@1.13.1
  - @rspress/shared@1.13.1

## 1.13.0

### Minor Changes

- f426d2f: feat(internal-components): New Steps Component!
  patch(docs): Add documentation for Steps Component!
- 7e95dcd: feat: add support for custom theme assets

### Patch Changes

- facceac: fix: respect search flag on mobile devices
- 51d8ae9: fix: location is not defined in ssg
- 2bffb37: fix: update theme when change storage
- 8fcf385: fix: add explicit height to social link icons, which is needed on Safari
- Updated dependencies [4b8fcd2]
- Updated dependencies [4ae7bf1]
  - @rspress/shared@1.13.0
  - @rspress/runtime@1.13.0

## 1.12.3

### Patch Changes

- @rspress/runtime@1.12.3
- @rspress/shared@1.12.3

## 1.12.2

### Patch Changes

- 4725cba: fix: location is not defined in ssg
  - @rspress/runtime@1.12.2
  - @rspress/shared@1.12.2

## 1.12.1

### Patch Changes

- 5ea9055: fix(theme-default): Fix collapsed space between last updated text and time
  - @rspress/runtime@1.12.1
  - @rspress/shared@1.12.1

## 1.12.0

### Minor Changes

- d697778: feat(theme-default): Scroll to top button on docs | enableScrollToTop
  chore(docs): weixin -> wechat

### Patch Changes

- 1551705: fix(doc-components): change code children to string
- 760027b: fix: fix theme style issues.
- 88e7eae: feat: add afterDocFooter slot for custom theme
- e4508b5: fix: copyBtn Icons && updated wordWrapBtn animations for equality between both buttons
- 515d65c: fix(theme-default): fix incorrect css variable name
- 4a73062: feat: pass through HTMLAnchorElement props to Link component.
- 2e1550a: fix(theme-default): private import not work in production
- 51f5541: feat(presetIcons): new social platform for social links - X
  feat(SourceCode): support for gitlab platform for button
  add(assets): new gitlab vector
  feat(SocialLinkIcon): Added new social icon type - X
- 24c03fc: fix: update sidebar after h1 change
- 24c03fc: feat: trigger auto page reload after page meta changed
- 24c03fc: fix: doc fragments' headers disappeared in development
- c429464: fix(theme-default): ui switch query
- 6212c89: fix(tab-list):overflown tabs not showing on mobile fixed
- 0ec1c5d: feat(theme-default): add DocLayout export
- 42c78f4: feat(theme-default): set search index initing min time
- Updated dependencies [d697778]
- Updated dependencies [51f5541]
- Updated dependencies [24c03fc]
- Updated dependencies [24c03fc]
- Updated dependencies [24c03fc]
  - @rspress/shared@1.12.0
  - @rspress/runtime@1.12.0

## 1.11.2

### Patch Changes

- 2951d30: feat: expose radius css variable
- 8e4052b: fix: global theme vars not work
- 8160f63: feat: support custom search placeholder text
- Updated dependencies [b025510]
- Updated dependencies [8160f63]
- Updated dependencies [d969f14]
  - @rspress/shared@1.11.2
  - @rspress/runtime@1.11.2

## 1.11.1

### Patch Changes

- @rspress/runtime@1.11.1
- @rspress/shared@1.11.1

## 1.11.0

### Patch Changes

- 4bb6d61: feat: allow table scrolling to avoid breaking work
- 82a1e46: style: optimize code copy animation
- 85e9601: feat: support toc component in mobile device
- Updated dependencies [82a1e46]
  - @rspress/runtime@1.11.0
  - @rspress/shared@1.11.0

## 1.10.1

### Patch Changes

- @rspress/runtime@1.10.1
- @rspress/shared@1.10.1

## 1.10.0

### Minor Changes

- f25d897: fix avoid pushing to history when clicking on the current link
- bd4eff3: fix clear query text when search box opens again

### Patch Changes

- 6db690c: fix: table word break style
- Updated dependencies [cfee5d2]
- Updated dependencies [c55b967]
  - @rspress/shared@1.10.0
  - @rspress/runtime@1.10.0

## 1.9.3

### Patch Changes

- 1617bae: feat: add class name for nav menu item and search button
- Updated dependencies [ca9c0f6]
  - @rspress/runtime@1.9.3
  - @rspress/shared@1.9.3

## 1.9.2

### Patch Changes

- 6ac3d36: feat: support custom render type in onSearch hook
- e1619c7: fix: sidebar disappeared in cleanUrl mode
- d8f974b: fix: normalize text case for number
- Updated dependencies [e1619c7]
  - @rspress/shared@1.9.2
  - @rspress/runtime@1.9.2

## 1.9.1

### Patch Changes

- e97bbc6: feat: add after nav menu slot
- 77125d5: fix: failed to submit search when rendering with react@16
  - @rspress/runtime@1.9.1
  - @rspress/shared@1.9.1

## 1.9.0

### Minor Changes

- 0f97eb8: feat: support custom search source

### Patch Changes

- f78ec18: fix: class selector in code block
- Updated dependencies [0f97eb8]
- Updated dependencies [08b9305]
  - @rspress/shared@1.9.0
  - @rspress/runtime@1.9.0

## 1.8.4

### Patch Changes

- 6e8a07f: feat: close nav screen when route changed
- Updated dependencies [2b94aa1]
- Updated dependencies [392066f]
  - @rspress/shared@1.8.4
  - @rspress/runtime@1.8.4

## 1.8.3

### Patch Changes

- d4f89b3: feat: support SourceCode component
- bd4543d: style(Nav): fix styling issues for specific sizes
- 38a2c6e: perf: optimize dependencies size
- 62d9e74: feat(theme-default): should open new tab/window on clicking with modifier keys
- Updated dependencies [d4f89b3]
- Updated dependencies [bfe47e8]
- Updated dependencies [38a2c6e]
  - @rspress/shared@1.8.3
  - @rspress/runtime@1.8.3

## 1.8.2

### Patch Changes

- @rspress/runtime@1.8.2
- @rspress/shared@1.8.2

## 1.8.1

### Patch Changes

- a96e651: fix: remove unuse css that is not recognized by browsers.
- c8e655e: perf(deps): remove unused jsdom dependency
- df6e061: feat: support LastUpdated and PrevNextPage
- Updated dependencies [126f0aa]
- Updated dependencies [0a4b727]
- Updated dependencies [c038048]
  - @rspress/runtime@1.8.1
  - @rspress/shared@1.8.1

## 1.8.0

### Minor Changes

- 3756fab: feat: add sidebar slots

### Patch Changes

- b435c24: chore: optimize sidebar group title color
- Updated dependencies [482faf5]
  - @rspress/shared@1.8.0
  - @rspress/runtime@1.8.0

## 1.7.5

### Patch Changes

- Updated dependencies [2b8f4fe]
  - @rspress/shared@1.7.5
  - @rspress/runtime@1.7.5

## 1.7.4

### Patch Changes

- @rspress/runtime@1.7.4
- @rspress/shared@1.7.4

## 1.7.3

### Patch Changes

- 34c4ff7: fix: some external urls cannot jump
- Updated dependencies [510c996]
  - @rspress/shared@1.7.3
  - @rspress/runtime@1.7.3

## 1.7.2

### Patch Changes

- @rspress/runtime@1.7.2
- @rspress/shared@1.7.2

## 1.7.1

### Patch Changes

- 8f62669: fix: blank line in code block when open line numbers
  - @rspress/runtime@1.7.1
  - @rspress/shared@1.7.1

## 1.7.0

### Minor Changes

- c435b8f: feat: support shiki highlight

### Patch Changes

- 4b97045: fix: copy content invalid in shiki mode
- 7fd7d3e: fix: reset prevActiveLink when unbinding AsideScrol
- e32247b: fix: highlight and code title not work in shiki mode
- e3a07e8: fix: code highlight invalid
- 42e5173: 文档中链接在小屏的样式优化
- 532a693: fix: fix the wrong rendering when the yarn or bun field is invalid.
- ce83920: fix: sidebar weird behaviour
- Updated dependencies [3bddde2]
- Updated dependencies [c435b8f]
  - @rspress/shared@1.7.0
  - @rspress/runtime@1.7.0

## 1.6.2

### Patch Changes

- @rspress/runtime@1.6.2
- @rspress/shared@1.6.2

## 1.6.1

### Patch Changes

- 0f81799: feat: support render html in feature card details
- Updated dependencies [1fd3c30]
  - @rspress/shared@1.6.1
  - @rspress/runtime@1.6.1

## 1.6.0

### Minor Changes

- b43b0fa: feat: support nav and sidebar for multi version scene

### Patch Changes

- c92f9ed: fix: overview page links cannot click
- 00c293a: feat: support SidebarDivider
- ca2c5fb: fix: fix the activation status update error after clicking on the right navigation bar
- Updated dependencies [00c293a]
- Updated dependencies [b43b0fa]
  - @rspress/shared@1.6.0
  - @rspress/runtime@1.6.0

## 1.5.1

### Patch Changes

- 5b413ec: fix: HomeLayout cannot be customized
- fa91446: fix: fix right aside nav item doesn't highlight automatically while opening in a new tab
- 5b413ec: fix: sidebar disappear when the `link` of items doesn't start with the sidebar group key
- Updated dependencies [d616c0b]
  - @rspress/shared@1.5.1
  - @rspress/runtime@1.5.1

## 1.5.0

### Minor Changes

- 8043517: feat: add support for wrap code in markdown code block

### Patch Changes

- f9fbc46: fix: Homehero comp crashes when hero field value is undefined
- 29f3dbd: feat: support multiline hero text
- 5bcb36c: fix: compatible with scrollbar in firefox
- 1b6e6e3: fix: error wrapping in CodeBlock when set language to toml
- Updated dependencies [750ed07]
- Updated dependencies [8043517]
  - @rspress/shared@1.5.0
  - @rspress/runtime@1.5.0

## 1.4.1

### Patch Changes

- @rspress/runtime@1.4.1
- @rspress/shared@1.4.1

## 1.4.0

### Patch Changes

- @rspress/runtime@1.4.0
- @rspress/shared@1.4.0

## 1.3.2

### Patch Changes

- d3b08e7: fix: image link crash in dev
- Updated dependencies [d3b08e7]
  - @rspress/runtime@1.3.2
  - @rspress/shared@1.3.2

## 1.3.1

### Patch Changes

- @rspress/runtime@1.3.1
- @rspress/shared@1.3.1

## 1.3.0

### Patch Changes

- 0ff27fd: fix: prevent hero's some fields from not being strings
- c5b864f: fix: overpage style
- 500e5bf: fix: hero.actions does not handle empty array situations
- 9c8b9f9: feat: integrate Rsbuild to replace Modern.js Builder
- daaf70d: fix: handling the case where command is an invalid value
- bc17b81: fix: sidebar incorrect when existing custom-link in \_meta.json
- d3eaa8f: fix: preview plugin style
- 1e4827c: fix: add base path for img in md(x)
- Updated dependencies [d66037f]
- Updated dependencies [9c8b9f9]
- Updated dependencies [7dd0103]
  - @rspress/shared@1.3.0
  - @rspress/runtime@1.3.0
