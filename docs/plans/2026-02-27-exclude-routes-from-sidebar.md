# Exclude Routes From Sidebar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `route.exclude` / `route.excludeConvention` patterns also exclude files from auto-generated sidebars, by reusing `RouteService.isExistRoute()`.

**Architecture:** The sidebar auto-generation (`normalize.ts`) scans directories with `fs.readdir()` independently of route discovery. We add an `isExistRoute` check in `metaFileItemToSidebarItem()` to skip files that have no corresponding route. This also catches dead links in `_meta.json`. Empty sidebar groups (dirs where all children were excluded) are pruned.

**Tech Stack:** TypeScript, `@rspress/core` internals, `@rstest/core` for tests.

---

### Task 1: Add test fixture for excluded routes

**Files:**

- Create: `packages/core/src/node/auto-nav-sidebar/fixtures/docs-no-meta/api/_components/Button.mdx`

This fixture simulates a file that would be excluded by `route.exclude` (e.g. `_components/**`). We put it inside the existing `docs-no-meta` fixture so the no-config sidebar scenario is tested.

**Step 1: Create the fixture file**

Create `packages/core/src/node/auto-nav-sidebar/fixtures/docs-no-meta/api/_components/Button.mdx`:

```mdx
# Button
```

**Step 2: Commit**

```bash
git add packages/core/src/node/auto-nav-sidebar/fixtures/docs-no-meta/api/_components/Button.mdx
git commit -m "test: add fixture for excluded routes in sidebar"
```

---

### Task 2: Write failing test — excluded file should not appear in sidebar

**Files:**

- Modify: `packages/core/src/node/auto-nav-sidebar/walk.test.ts`

**Step 1: Write the failing test**

Add a new test case at the end of the `describe('walk', ...)` block in `walk.test.ts`. The mock `RouteService.__instance__` needs an `isExistRoute` method that returns `false` for the excluded path:

```typescript
it('route.exclude should filter sidebar items', async () => {
  const docsDir = path.join(__dirname, './fixtures/docs-no-meta');
  const metaFileSet = new Set<string>();
  const mdFileSet = new Set<string>();

  // Mock isExistRoute to exclude _components paths
  RouteService.__instance__ = {
    normalizeRoutePath: mockNormalizeRoutePath,
    getRoutePathParts: mockGetRoutePathParts,
    isExistRoute: (link: string) => !link.includes('_components'),
  } as RouteService;

  const result = await walk(
    docsDir,
    docsDir,
    DEFAULT_PAGE_EXTENSIONS,
    metaFileSet,
    mdFileSet,
  );

  // _components/Button should NOT appear in sidebar
  const apiSidebar = result.sidebar['/'];
  const allLinks = JSON.stringify(apiSidebar);
  expect(allLinks).not.toContain('_components');
  expect(allLinks).not.toContain('Button');

  // Other items should still be present
  expect(allLinks).toContain('getting-started');

  // Restore mock
  RouteService.__instance__ = {
    normalizeRoutePath: mockNormalizeRoutePath,
    getRoutePathParts: mockGetRoutePathParts,
  } as RouteService;
});
```

**Step 2: Run the test to verify it fails**

Run: `pnpm rstest run packages/core/src/node/auto-nav-sidebar/walk.test.ts`
Expected: FAIL — the `_components/Button` file still appears in sidebar because `isExistRoute` is not checked yet.

**Step 3: Commit**

```bash
git add packages/core/src/node/auto-nav-sidebar/walk.test.ts
git commit -m "test: add failing test for route.exclude sidebar filtering"
```

---

### Task 3: Filter excluded files in `metaFileItemToSidebarItem`

**Files:**

- Modify: `packages/core/src/node/auto-nav-sidebar/normalize.ts:181-234`

This is the core change. After computing the `link` for a file sidebar item, check `RouteService.getInstance()?.isExistRoute(link)`. If the route doesn't exist, return `null` instead of a `SidebarItem`.

**Step 1: Import RouteService**

Add to imports at the top of `normalize.ts`:

```typescript
import { RouteService } from '../route/RouteService';
```

**Step 2: Change return type to `Promise<SidebarItem | null>`**

Change `metaFileItemToSidebarItem` signature from:

```typescript
async function metaFileItemToSidebarItem(
  ...
): Promise<SidebarItem> {
```

to:

```typescript
async function metaFileItemToSidebarItem(
  ...
): Promise<SidebarItem | null> {
```

**Step 3: Add `isExistRoute` check**

After line 220 (`const link = absolutePathToRoutePath(absolutePathWithExt, docsDir);`), add:

```typescript
const routeService = RouteService.getInstance();
if (routeService?.isExistRoute && !routeService.isExistRoute(link)) {
  return null;
}
```

The `routeService?.isExistRoute &&` guard handles the case where `RouteService.__instance__` is null or a partial mock without `isExistRoute`.

**Step 4: Commit**

```bash
git add packages/core/src/node/auto-nav-sidebar/normalize.ts
git commit -m "feat: filter excluded routes from sidebar file items"
```

---

### Task 4: Handle `null` returns in callers

**Files:**

- Modify: `packages/core/src/node/auto-nav-sidebar/normalize.ts` (multiple functions)

Now that `metaFileItemToSidebarItem` can return `null`, all callers must handle it.

**Step 1: Update `metaItemToSidebarItem` return type and handling**

Change the return type from:

```typescript
async function metaItemToSidebarItem(
  ...
): Promise<
  | (SidebarItem | SidebarGroup | SidebarDivider | SidebarSectionHeader)
  | (SidebarItem | SidebarGroup | SidebarDivider | SidebarSectionHeader)[]
> {
```

to:

```typescript
async function metaItemToSidebarItem(
  ...
): Promise<
  | (SidebarItem | SidebarGroup | SidebarDivider | SidebarSectionHeader)
  | (SidebarItem | SidebarGroup | SidebarDivider | SidebarSectionHeader)[]
  | null
> {
```

The two call sites for `metaFileItemToSidebarItem` inside `metaItemToSidebarItem` (lines 105-111 and 116-122) already just `return` the result, so they'll pass through `null`.

**Step 2: Update `getItems()` inside `metaDirItemToSidebarItem` (line 267-298)**

The `.flat()` call on line 297 doesn't filter nulls. Change:

```typescript
return items.flat();
```

to:

```typescript
return items.flat().filter(Boolean) as (
  | SidebarItem
  | SidebarGroup
  | SidebarDivider
  | SidebarSectionHeader
)[];
```

**Step 3: Handle `null` from `metaFileItemToSidebarItem` for same-name file (line 305)**

In `metaDirItemToSidebarItem`, line 305-311 calls `metaFileItemToSidebarItem` for the same-name convention. If the same-name file is excluded, it returns `null`. We should treat this like a file-not-found (fall into the catch branch). Change:

```typescript
const sameNameFile = await metaFileItemToSidebarItem(
  name,
  workDir,
  docsDir,
  extensions,
  mdFileSet,
);

const { link, text, _fileKey, context, overviewHeaders, tag } = sameNameFile;
```

to:

```typescript
const sameNameFile = await metaFileItemToSidebarItem(
  name,
  workDir,
  docsDir,
  extensions,
  mdFileSet,
);

if (!sameNameFile) {
  throw new Error('Excluded route');
}

const { link, text, _fileKey, context, overviewHeaders, tag } = sameNameFile;
```

This leverages the existing try/catch on line 326 which already handles the "no same-name file" case gracefully.

**Step 4: Handle `null` from index file (line 352)**

Similarly, line 352-358 calls `metaFileItemToSidebarItem` for `'index'`. If the index file is excluded, treat the dir as non-clickable. Change:

```typescript
      const indexFile = await metaFileItemToSidebarItem(
        'index',
        dirAbsolutePath,
        docsDir,
        extensions,
        mdFileSet,
      );

      const { link, text, _fileKey, context, overviewHeaders, tag } = indexFile;
      return {
```

to:

```typescript
      const indexFile = await metaFileItemToSidebarItem(
        'index',
        dirAbsolutePath,
        docsDir,
        extensions,
        mdFileSet,
      );

      if (!indexFile) {
        return {
          text: label || name,
          collapsible,
          collapsed,
          items: await getItems(),
          overviewHeaders: metaJsonOverviewHeaders,
          context: metaJsonContext,
          _fileKey: getFileKey(dirAbsolutePath, docsDir),
        } satisfies SidebarGroup;
      }

      const { link, text, _fileKey, context, overviewHeaders, tag } = indexFile;
      return {
```

**Step 5: Commit**

```bash
git add packages/core/src/node/auto-nav-sidebar/normalize.ts
git commit -m "feat: handle null sidebar items from excluded routes"
```

---

### Task 5: Prune empty sidebar groups

**Files:**

- Modify: `packages/core/src/node/auto-nav-sidebar/normalize.ts`

When all children of a directory are excluded, `metaDirItemToSidebarItem` returns a `SidebarGroup` with empty `items` and no `link`. We should return `null` for such groups.

**Step 1: Add empty group pruning**

At the end of `metaDirItemToSidebarItem`, before each `return { ... } satisfies SidebarGroup`, we don't need to change every return — instead, we wrap at the `metaItemToSidebarItem` level. After the `type === 'dir'` branch (line 125-135):

Change:

```typescript
if (type === 'dir') {
  return metaDirItemToSidebarItem(
    metaItem,
    workDir,
    docsDir,
    extensions,
    metaFileSet,
    mdFileSet,
    false,
  );
}
```

to:

```typescript
if (type === 'dir') {
  const group = await metaDirItemToSidebarItem(
    metaItem,
    workDir,
    docsDir,
    extensions,
    metaFileSet,
    mdFileSet,
    false,
  );
  if (group.items.length === 0 && !group.link) {
    return null;
  }
  return group;
}
```

Do the same for `type === 'dir-section-header'` — but that case returns an array from `metaDirSectionHeaderItemToSidebarItem`. Check the returned `dirSideGroup.items` there.

**Step 2: Run the tests**

Run: `pnpm rstest run packages/core/src/node/auto-nav-sidebar/walk.test.ts`
Expected: All tests pass, including the new `route.exclude should filter sidebar items` test.

**Step 3: Commit**

```bash
git add packages/core/src/node/auto-nav-sidebar/normalize.ts
git commit -m "feat: prune empty sidebar groups from excluded routes"
```

---

### Task 6: Write test for `_meta.json` with excluded file reference

**Files:**

- Create: `packages/core/src/node/auto-nav-sidebar/fixtures/docs-exclude-meta/` (test fixture with `_meta.json` referencing an excluded file)
- Modify: `packages/core/src/node/auto-nav-sidebar/walk.test.ts`

This tests the case where a `_meta.json` explicitly references a file that has no route (because of `route.exclude`). The file should be silently skipped from sidebar.

**Step 1: Create fixture**

Create directory `fixtures/docs-exclude-meta/` with:

`_nav.json`:

```json
[{ "text": "Guide", "link": "/guide/", "activeMatch": "^/guide/" }]
```

`guide/_meta.json`:

```json
["a", "b", "excluded-file"]
```

`guide/a.md`:

```markdown
---
title: Page a
---
```

`guide/b.mdx`:

```markdown
---
title: Page b
---
```

`guide/excluded-file.md`:

```markdown
---
title: Excluded
---
```

**Step 2: Write the test**

```typescript
it('_meta.json referencing excluded file should skip it', async () => {
  const docsDir = path.join(__dirname, './fixtures/docs-exclude-meta');
  const metaFileSet = new Set<string>();
  const mdFileSet = new Set<string>();

  RouteService.__instance__ = {
    normalizeRoutePath: mockNormalizeRoutePath,
    getRoutePathParts: mockGetRoutePathParts,
    isExistRoute: (link: string) => !link.includes('excluded-file'),
  } as RouteService;

  const result = await walk(
    docsDir,
    docsDir,
    DEFAULT_PAGE_EXTENSIONS,
    metaFileSet,
    mdFileSet,
  );

  const sidebar = result.sidebar['/guide'];
  const allLinks = JSON.stringify(sidebar);
  expect(allLinks).not.toContain('excluded-file');
  expect(allLinks).toContain('Page a');
  expect(allLinks).toContain('Page b');

  // Restore
  RouteService.__instance__ = {
    normalizeRoutePath: mockNormalizeRoutePath,
    getRoutePathParts: mockGetRoutePathParts,
  } as RouteService;
});
```

**Step 3: Run tests**

Run: `pnpm rstest run packages/core/src/node/auto-nav-sidebar/walk.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/core/src/node/auto-nav-sidebar/fixtures/docs-exclude-meta/
git add packages/core/src/node/auto-nav-sidebar/walk.test.ts
git commit -m "test: add test for _meta.json with excluded file reference"
```

---

### Task 7: Run full test suite and verify existing tests pass

**Step 1: Run all unit tests**

Run: `pnpm rstest run`
Expected: All tests pass. No regressions.

**Step 2: Check for snapshot updates needed**

The `docs-no-meta` test (line 143) has an inline snapshot. Since we added `_components/Button.mdx` to that fixture, the default mock (without `isExistRoute`) should still include it. If the snapshot changes, update it.

Note: In the existing tests, `RouteService.__instance__` has no `isExistRoute` method, so the guard `routeService?.isExistRoute &&` will be `false`, and no filtering will occur — existing behavior is preserved.

**Step 3: Commit if snapshots needed updating**

```bash
git add -u
git commit -m "test: update snapshots for new fixture file"
```
