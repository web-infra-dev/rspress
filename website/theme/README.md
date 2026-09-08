<!-- cspell:words Wukong Zheng cliffside -->

# Black myth website theme

The website applies a Black Myth: Wukong inspired theme through `index.tsx`. It uses a custom bilingual `HomeLayout`, navigation/sidebar slots, CSS variables, and the default theme's public BEM classes. Documentation content, search, language switching, MDX components, and the CSS playground retain their existing behavior.

## Customization

- `components/BlackMyth/index.tsx` contains the homepage copy, documentation routes, command-copy feedback, and background-motion control.
- `blackMyth.css` contains the ink/gold and parchment palettes, typography, component overrides, responsive layouts, and motion rules.
- The default is dark mode. The existing appearance switch offers a parchment light mode for reading. The homepage artwork remains dark in both modes.
- Ambient animation uses a 28-second, 2.5% background zoom and six faint embers. The on-page motion button pauses both loops. `prefers-reduced-motion: reduce` disables all homepage animations and hover movement. Article content does not animate.
- Theme imports must use `@rspress/core/theme-original` to avoid circular imports.

## Artwork and typography

The two local JPEG backgrounds were generated with the built-in ImageGen tool for this theme. They are original illustrations, not extracted game screenshots. UI text, navigation, controls, and layout are HTML/CSS. Together the backgrounds are approximately 764 KB; the chapter background is lazy-loaded. No runtime image or font service is required.

Art direction references:

- [Black Myth: Wukong official website](https://gamesci.cn/wukong/)
- [Equipment menu screenshots](https://www.rpgsite.net/guide/16172-black-myth-wukong-armor-guide-all-craftable-sets-their-effects-materials-needed-to-make-them)
- [Mountain and temple environment reference](https://store.playstation.com/en-au/product/HP6545-PPSA23226_00-GAMEDELUXE000000)

Generation briefs:

- `assets/blackMythHero.jpg`: cinematic Chinese mountain valley; dark negative space on the left; monumental weathered guardian carving, cliffside temple, twisted pines, stone steps and a distant pilgrim on the right; subdued stone colors, warm gold light; no lettering or UI.
- `assets/blackMythChapters.jpg`: misty peaks, guardian carving, hanging stone bridges and lantern-lit temples on the right; the left fades into ink black; muted gray-green stone and old gold light; no lettering or UI.

The local `assets/maShanZheng.ttf` font is a Google Fonts subset of [Ma Shan Zheng](https://github.com/google/fonts/tree/main/ofl/mashanzheng), used for the eight Chinese hero characters and three feature numerals. Its SIL Open Font License is included in `assets/OFL.txt`. Other headings use system serif fonts, with system sans-serif for body text and monospace for code.

## Verification

Run `pnpm build`, `pnpm check`, and `pnpm build:website`. Start the website with `pnpm --filter @rspress/docs dev` and check both `/` and `/zh/`, the getting-started guide, component examples, search, and mobile navigation. Keep build output and browser screenshots out of the repository.
