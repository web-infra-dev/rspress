# View transition dark mode reproduction

Run the fixture from the repository root:

```bash
pnpm --filter @rspress-fixture/view-transition-dark-mode dev
```

Open the URL printed by Rspress. The root page exercises Rspress's current
appearance switch. `/native.html` is a framework-free control using percentage
coordinates relative to the View Transition snapshot.

The Rspress switch animates the snapshots with CSS keyframes. The native control
uses JavaScript `animate()` so the two approaches can be compared directly.

Rspress sets `will-change: contents` on the appearance snapshots to keep
Chromium's clip-path animation on the main thread. The native control retains
the browser's default compositing behavior.

For flicker checks, repeatedly switch in both directions in a visible Chrome
window. Check the handoff from the final animation frame to the live page;
headless tests alone did not reproduce the reported single-frame flash.

Test both pages at the same viewport size, browser zoom, and device pixel ratio.
If only the Rspress page is offset, the issue is in Rspress or its page styles.
If both pages are offset by the same amount, it is likely a browser/environment
interaction.
