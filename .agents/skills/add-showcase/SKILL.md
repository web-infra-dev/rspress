---
name: add-showcase
description: Add a website to the Rspress Showcase or refresh existing entries, screenshots, and community submissions.
metadata:
  internal: true
---

# Add showcase

## Locate and scope

- Read `AGENTS.md`, inspect local changes, and fetch `origin/main`. Preserve unrelated edits; start new PRs from the latest base.
- Find the Showcase pages with `rg`, then follow their imports to the shared data, rendering, and navigation. Use the current structure and schema rather than assuming file paths.
- Add the project's production website to Rspress Showcase; do not add a Showcase feature to the project's own repository.
- Keep the existing layout and navigation unless the user requests design changes.

## Verify the site

- Resolve the official website from the repository or README and verify the live page after redirects.
- Check live generator metadata for Rspress and its version. Use source dependencies as fallback, clearly distinguishing them from the deployed version.
- Search the gallery and [Showcase discussion #607](https://github.com/web-infra-dev/rspress/discussions/607), including paginated comments and replies, for the project and canonical URL. Reuse existing submissions.
- Prefer verified V2 sites near the top while preserving unrelated entries' order. Distinguish stable and prerelease versions.
- Compare stored screenshots with the current site even if it already used V2 when submitted. Refresh redesigns too; do not limit updates to V1-to-V2 migrations.
- A single timeout is inconclusive. Confirm redirects, availability, and current Rspress usage before removing entries within an authorized cleanup.

## Update the image and entry

- Prefer a suitable user-supplied image; otherwise use a current official image or capture the live page. Check that content is loaded, unobstructed, and recognizable.
- Read the original image's pixel dimensions, not the resized chat preview. Keep those dimensions in the gallery data to avoid layout shifts.
- Use a public GitHub attachment URL or an official repository image pinned to a commit. Do not commit image binaries, local paths, or temporary signed URLs.
- Check CLI attachment support before using it. Supported PR commands accept `--attach`; use the browser's upload control for discussion attachments when needed. Read back the public image URL.
- Within the user's requested scope, add or update the discussion submission with the title, short description, website, public source repository, and image. Preserve unrelated text and reconcile uncertain writes before retrying.
- Update the shared gallery data using its existing schema, including the discussion permalink. Keep the discussion and gallery images consistent when both updates are authorized.
- Add spelling exceptions only as needed. Do not change a list-wide verification date after checking only one entry.

## Validate and deliver

- Verify the image is accessible without authentication and the final diff contains only intended changes, with no duplicate entries.
- Use the repository's declared Node.js and pnpm versions. Run its checks, changed-text spelling checks, and website build; reuse package outputs only when they match the current source.
- Preview all supported Showcase locales and a narrow viewport. Check image loading, dimensions, destination links, and masonry layout.
- For a requested PR, use `pr-creator`, a `docs` title, and the requested draft state. Check whether an earlier PR is already merged before deciding which branch to update.
- Attach meaningful before/after screenshots for visual changes. Verify the PR's base, head, draft state, and diff, plus the changed discussion content.
- Report the PR and submission links, current version evidence, image source, validation, and unresolved uncertainty.
- For skill-only edits, check formatting, spelling, and instruction consistency; website builds and screenshots are unnecessary.
