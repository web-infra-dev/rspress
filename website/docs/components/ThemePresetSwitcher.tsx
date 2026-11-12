import { useLang, withBase } from '@rspress/core/runtime';
import { CodeBlockRuntime, copyToClipboard } from '@rspress/core/theme';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import ruixenCss from '../public/themes/ruixen.css?raw';
import { useCssEntry } from './CssModificationContext';
import styles from './ThemePresetSwitcher.module.scss';

export function ThemePresetSwitcher() {
  if (import.meta.env.SSG_MD) {
    return null;
  }

  const isZh = useLang() === 'zh';
  const [css, setCss] = useCssEntry('rspress-theme-preset', '');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  );
  const transitioning = useRef(false);
  const isRuixen = css === ruixenCss;

  function selectPreset(nextCss: string) {
    if (nextCss === css || transitioning.current) return;

    const update = () => {
      flushSync(() => {
        setCss(nextCss);
        setCopyStatus('idle');
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
  const presets = [
    {
      name: 'Rspress',
      css: '',
      description: isZh
        ? '明亮的蓝色，熟悉的默认主题。'
        : 'Bright blue. The familiar default theme.',
      palette: ['#0095ff', '#ffffff', '#f8f8f9', '#242424'],
    },
    {
      name: 'Ruixen',
      css: ruixenCss,
      description: isZh
        ? '黑白灰、细边框与柔和圆角。'
        : 'Neutral colors, fine borders, and soft corners.',
      palette: ['#18181b', '#ffffff', '#f4f4f5', '#71717a'],
    },
  ];

  return (
    <div className={styles.switcher}>
      <div
        className={styles.grid}
        role="group"
        aria-label={isZh ? '主题预设' : 'Theme presets'}
      >
        {presets.map(preset => {
          const selected = css === preset.css;
          return (
            <button
              key={preset.name}
              type="button"
              className={styles.card}
              aria-pressed={selected}
              onClick={() => selectPreset(preset.css)}
            >
              <span
                className={`${styles.preview} ${preset.name === 'Ruixen' ? styles.neutral : ''}`}
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
              <span className={styles.description}>{preset.description}</span>
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
            ? `当前预览：${isRuixen ? 'Ruixen' : 'Rspress'}`
            : `Previewing ${isRuixen ? 'Ruixen' : 'Rspress'}`}
        </span>
        <button
          type="button"
          className={styles.action}
          onClick={async () => {
            const copied = await copyToClipboard(ruixenCss);
            setCopyStatus(copied ? 'copied' : 'error');
          }}
        >
          {copyStatus === 'copied'
            ? isZh
              ? '已复制'
              : 'Copied'
            : isZh
              ? '复制 Ruixen CSS'
              : 'Copy Ruixen CSS'}
        </button>
        <a
          className={styles.action}
          href={withBase('/themes/ruixen.css')}
          download="ruixen.css"
        >
          {isZh ? '下载 CSS' : 'Download CSS'}
        </a>
        <a
          className={styles.action}
          href={withBase('/themes/ruixen.tsx')}
          download="ruixen.tsx"
        >
          {isZh ? '下载主题入口' : 'Download theme entry'}
        </a>
      </div>
      {copyStatus === 'error' ? (
        <p role="alert">
          {isZh
            ? '复制失败，请下载 CSS 或从下方代码中复制。'
            : 'Copy failed. Download the CSS or copy the code below.'}
        </p>
      ) : null}
      <details className={styles.source}>
        <summary>
          {isZh ? '查看 Ruixen preset CSS' : 'View Ruixen preset CSS'}
        </summary>
        <CodeBlockRuntime
          lang="css"
          code={ruixenCss}
          title="theme/ruixen.css"
        />
      </details>
    </div>
  );
}
