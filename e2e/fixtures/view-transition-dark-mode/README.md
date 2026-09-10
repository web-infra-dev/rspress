# View transition dark mode reproduction

Run the fixture from the repository root:

```bash
pnpm --filter @rspress-fixture/view-transition-dark-mode dev
```

Open the URL printed by Rspress. The root page exercises Rspress's current
appearance switch. `/native.html` is a framework-free control using percentage
coordinates relative to the View Transition snapshot.

Test both pages at the same viewport size, browser zoom, and device pixel ratio.
If only the Rspress page is offset, the issue is in Rspress or its page styles.
If both pages are offset by the same amount, it is likely a browser/environment
interaction.
