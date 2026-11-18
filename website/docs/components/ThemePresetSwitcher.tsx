import { useDark, useLang } from '@rspress/core/runtime';
import { copyToClipboard } from '@rspress/core/theme';
import { type CSSProperties, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useThemePreset } from '../../theme/presets/ThemePresetProvider';
import { localizePresetText } from '../../theme/presets/types';
import styles from './ThemePresetSwitcher.module.scss';

export function ThemePresetSwitcher() {
  if (import.meta.env.SSG_MD) {
    return null;
  }

  const lang = useLang();
  const isZh = lang === 'zh';
  const isDark = useDark();
  const { presets, activePreset, selectPreset } = useThemePreset();
  const [copyResult, setCopyResult] = useState<{
    id: string;
    status: 'copied' | 'error';
  }>();
  const copyStatus =
    copyResult?.id === activePreset.id ? copyResult.status : 'idle';
  const transitioning = useRef(false);

  function previewPreset(id: string) {
    if (id === activePreset.id || transitioning.current) return;

    const update = () => {
      flushSync(() => {
        selectPreset(id);
        setCopyResult(undefined);
      });
    };
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reducedMotion || !document.startViewTransition) {
      update();
      if (!reducedMotion) {
        document.documentElement.animate([{ opacity: 0.7 }, { opacity: 1 }], {
          duration: 240,
          easing: 'ease-out',
        });
      }
      return;
    }

    transitioning.current = true;
    const root = document.documentElement;
    root.classList.add('rp-preset-transition');
    const cleanup = () => {
      root.classList.remove('rp-preset-transition');
      transitioning.current = false;
    };
    let updated = false;
    try {
      const transition = document.startViewTransition(() => {
        updated = true;
        update();
      });
      transition.ready.catch(() => transition.skipTransition());
      transition.finished.then(cleanup, cleanup);
    } catch {
      cleanup();
      if (!updated) update();
    }
  }

  return (
    <div className={styles.switcher}>
      <div
        className={styles.grid}
        role="group"
        aria-label={isZh ? '主题预设' : 'Theme presets'}
      >
        {presets.map(preset => {
          const selected = activePreset.id === preset.id;
          const colors = preset.preview[isDark ? 'dark' : 'light'];
          const previewStyle = Object.fromEntries(
            Object.entries(colors).map(([key, value]) => [
              `--preview-${key === 'background' ? 'bg' : key}`,
              value,
            ]),
          ) as CSSProperties;
          return (
            <button
              key={preset.id}
              type="button"
              className={styles.card}
              aria-pressed={selected}
              onClick={() => previewPreset(preset.id)}
            >
              <span
                className={styles.preview}
                style={previewStyle}
                data-dividers={preset.preview.showDividers !== false}
                aria-hidden="true"
              >
                <span className={styles.previewNav}>
                  <span className={styles.previewLogo} />
                  <span className={styles.previewSearch} />
                  <span className={styles.previewDot} />
                </span>
                <span className={styles.previewBody}>
                  <span className={styles.previewSidebar}>
                    <span />
                    <span className={styles.previewActive} />
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className={styles.previewContent}>
                    <span className={styles.previewTitle} />
                    <span className={styles.previewLine} />
                    <span className={styles.previewBlock}>
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className={styles.previewLine} />
                  </span>
                  <span className={styles.previewOutline}>
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
              </span>
              <span className={styles.cardHeading}>
                <span className={styles.name}>{preset.name}</span>
                <span className={styles.badge}>
                  {selected
                    ? isZh
                      ? '使用中'
                      : 'Active'
                    : isZh
                      ? '点击预览'
                      : 'Try theme'}
                </span>
              </span>
              <span className={styles.description}>
                {localizePresetText(preset.description, lang)}
              </span>
              <span className={styles.palette} aria-hidden="true">
                {preset.palette.map(color => (
                  <span key={color} style={{ backgroundColor: color }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className={styles.actions}>
        <span className={styles.status} role="status">
          {isZh
            ? `当前预览：${activePreset.name}`
            : `Previewing ${activePreset.name}`}
        </span>
        <button
          type="button"
          className={styles.action}
          onClick={async () => {
            const copied = await copyToClipboard(
              localizePresetText(activePreset.prompt, lang),
            );
            setCopyResult({
              id: activePreset.id,
              status: copied ? 'copied' : 'error',
            });
          }}
        >
          {copyStatus === 'copied'
            ? isZh
              ? '已复制'
              : 'Copied'
            : isZh
              ? '复制提示词'
              : 'Copy prompt'}
        </button>
      </div>
      {copyStatus === 'error' ? (
        <p role="alert">
          {isZh ? '复制失败，请重试。' : 'Copy failed. Please try again.'}
        </p>
      ) : null}
    </div>
  );
}
