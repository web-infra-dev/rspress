export type ThemeValue = 'dark' | 'light';

export const applyThemeToDOM = (theme: ThemeValue) => {
  const root = document?.documentElement;
  if (!root) return;
  const isDark = theme === 'dark';
  // Suppress transitions only when the theme actually flips — the call after
  // hydration matches the DOM already set by the inline theme script, and the
  // suppression toggle forces two whole-document style recalculations.
  const changed = root.classList.contains('dark') !== isDark;
  root.classList.toggle('dark', isDark);
  root.classList.toggle('rp-dark', isDark);
  root.style.colorScheme = theme;
  if (changed) {
    // The `.rp-theme-switching` rule in SwitchAppearance/global.scss disables
    // transitions so every themed surface switches in sync.
    root.classList.add('rp-theme-switching');
    // Force a style flush so the suppression applies before it is removed.
    void window.getComputedStyle(root).opacity;
    requestAnimationFrame(() => {
      root.classList.remove('rp-theme-switching');
    });
  }
};
