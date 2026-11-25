---
name: add-showcase
description: Add a website to the Rspress community Showcase or refresh an existing entry. Use when given a project URL, repository, or screenshot to include in Showcase, or when asked to audit site versions, availability, or outdated screenshots.
metadata:
  internal: true
---

# Add showcase

Maintain the community submissions and the website gallery together. Follow the user's requested scope: preparing a skill, researching a candidate, or editing a local entry does not by itself authorize posting to GitHub.

## Repository locations

| Purpose                     | Location                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Community submissions       | <https://github.com/web-infra-dev/rspress/discussions/607>                                  |
| Shared site data            | `website/docs/components/Showcase/sites.ts`                                                 |
| Gallery and image rendering | `website/docs/components/Showcase/index.tsx`                                                |
| Layout and masonry          | `website/docs/components/Showcase/index.module.scss`, `useMasonry.ts` in the same directory |
| English and Chinese pages   | `website/docs/en/showcase.mdx`, `website/docs/zh/showcase.mdx`                              |
| Navigation                  | `website/docs/en/_nav.json`, `website/docs/zh/_nav.json`                                    |

Read the current files before editing. Both languages use the same site data, so a normal addition needs only one data change. Keep the existing gallery layout, content width, paragraph-and-link contribution prompt, and Showcase entry inside the Version menu unless the user requests a design change.

## 1. Establish the base and scope

- Read `AGENTS.md`, inspect the branch and working tree, and fetch `origin/main`.
- Preserve unrelated edits. For a new PR, start an isolated branch or checkout from the latest `origin/main`. For an existing PR, check its live state before updating it; a merged PR needs a new branch for further changes.
- Check whether the requested changes are already on the base branch. Do not recreate an existing entry or manufacture changes for an empty PR.
- A project repository is a starting point for finding its production website. This skill adds that website to the Rspress Showcase, not a Showcase feature to the project's own repository.

## 2. Verify the candidate

1. Resolve the official production URL from the repository's homepage, README, or deployment configuration. Confirm the live page belongs to the project and renders successfully after redirects.
2. Verify that the live site uses Rspress. Prefer its generator metadata; if absent, inspect the site's published assets or the documentation package's dependencies. Record the evidence source and date. Repository dependencies alone do not prove which version is deployed.
3. Read the existing gallery and all relevant comments and replies in discussion #607, following pagination. Search by project name, repository, and canonical URL. A mention in another issue or PR is not a Showcase submission.
4. Reuse an existing submission's permalink. Add a new submission only when absent and posting is within the user's request. Use a short factual title and description, the production URL, and the source repository when public.

Distinguish stable, beta, RC, and V1 versions. Prefer verified V2 sites near the top of the gallery while preserving the relative order of unrelated entries.

## 3. Select and host the image

- Prefer a suitable image supplied by the user. Otherwise use an up-to-date official screenshot or capture the live page with the available browser tools.
- For captures, show recognizable content and the surrounding site navigation. Dismiss obstructing cookie prompts, wait for images and fonts, and capture animated headings with complete text. Do not fabricate page content or label a modified mockup as a live screenshot.
- Inspect the actual image and record its pixel dimensions. Use the original file dimensions, not the resized chat preview or a discussion's display width.
- Store the image at a public GitHub URL. Reuse an existing attachment when suitable, or upload the local image through an authorized discussion or PR. An official repository image can use a `raw.githubusercontent.com` URL pinned to a commit.
- Check the installed CLI's help before relying on attachment support. Where supported, `gh pr edit` or `gh pr comment` accepts `--attach '<absolute-path>#<alt text>'`; a body file can reference the local image and the CLI rewrites that reference to the uploaded URL. Read the resulting body back to obtain the URL. For discussion uploads without CLI support, use the browser's attachment control.
- Use the public `github.com/user-attachments/assets/...` URL, not a temporary signed redirect from `private-user-images.githubusercontent.com`. Do not commit image binaries or local paths to the gallery.
- Verify that the URL returns an image without authentication and loads in the gallery. Report current accessibility without promising permanent availability.

If a PR is used to host the image, finish the entry with the returned URL and validate the final commit before marking the work complete.

## 4. Update the submission and gallery

For a new submission, follow the discussion's format:

```markdown
- **Site title**: <project name>
- **Site description**: <short factual description>
- **Site URL**: <production URL>
- **Site source code URL**: <public repository, if available>

![<project name> screenshot](<public GitHub image URL>)
```

When adding to or refreshing the discussion is authorized, prefer the GitHub connector or CLI, using the browser for missing capabilities. Supply multiline bodies through structured arguments or `--body-file`. Preserve unrelated content in existing comments and read back the changed body to confirm the exact image URL. Do not duplicate a submission after an uncertain write; reconcile its current state first.

Add or update the matching object in `showcaseSites`:

```ts
{
  title: '<project name>',
  url: '<production URL>',
  image: '<public GitHub image URL>',
  width: 1265,
  height: 712,
  source: '<discussion comment permalink>',
},
```

Replace the example dimensions with those of the actual image. Add a project name to the local spelling allowlist only if needed. Avoid changing a list-wide verification date when only one entry was checked; record that entry's verification in the PR instead.

## 5. Refresh or audit existing entries

- Compare each relevant stored screenshot with the live page. Refresh outdated visuals even when the original submission already used V2 alpha or beta. A redesign within V2 also needs a new screenshot.
- Use historical dependencies or a migration PR to support a V1-to-V2 claim. A current V2 generator alone establishes only the current version. Keep confirmed migrations separate from other visual refreshes.
- Keep the discussion image and gallery image consistent when both updates are authorized. Preserve submission text unrelated to the image; update image dimensions when present.
- Follow redirects and distinguish a moved site from a removed project. A single timeout or access challenge is inconclusive. Retry or inspect the official repository before proposing removal.
- Remove a site only when the user requests it or the requested audit includes cleanup and evidence confirms it is unavailable or no longer uses Rspress. Do not remove entries solely for using V1.

## 6. Validate and deliver

For a gallery change:

1. Review the diff for duplicate URLs, correct links, image dimensions, and changes outside the requested scope.
2. Use the repository's declared Node.js and pnpm versions. Run `pnpm check`, a spelling check for changed text, and `pnpm build:website`. If package outputs already match the current source, `pnpm --filter @rspress/docs run build` can validate the website without rebuilding them.
3. Preview both `/showcase` and `/zh/showcase`. Verify the new image loads, its link opens the intended site, and the card fits the existing masonry. Check a narrow viewport for overflow. Confirm actual image dimensions match the data.
4. Keep meaningful before/after screenshots for a visual PR and attach them to its description. Summarize checks honestly; distinguish local validation from CI.
5. Use `pr-creator` when a PR is requested. Website data changes use a `docs` title such as `docs(website): add <project> to showcase`, not `feat(docs)`. Honor a requested draft state and target `main` from the refreshed base. Commit only intended files and verify the created PR's title, base, head, draft state, and diff.
6. Report the discussion permalink, PR link, current version evidence, image source, and validation result. State any unresolved version or availability uncertainty.

For changes only to this skill, check Markdown formatting, spelling, repository paths, and the documented workflow. A website build and browser screenshots are unnecessary when no website behavior changes.
