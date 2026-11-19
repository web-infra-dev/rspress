import { useDark, useLang } from '@rspress/core/runtime';
import {
  copyToClipboard,
  IconCopy,
  IconSuccess,
  SvgWrapper,
} from '@rspress/core/theme';
import { type CSSProperties, useState } from 'react';
import { useThemePreset } from '../../theme/presets/ThemePresetProvider';
import { localizePresetText } from '../../theme/presets/types';
import { generateThemePrompt } from '../../theme/presets/generateThemePrompt';
import styles from './ThemePresetSwitcher.module.scss';

export function ThemePresetSwitcher() {
  if (import.meta.env.SSG_MD) {
    return null;
  }

  const lang = useLang();
  const isZh = lang === 'zh';
  const isDark = useDark();
  const { presets, activePreset, selectPreset, loadPreset, loadingId, error } =
    useThemePreset();
  const [copyResult, setCopyResult] = useState<{
    id: string;
    status: 'copied' | 'error';
  }>();
  const copyStatus =
    copyResult?.id === activePreset.id ? copyResult.status : 'idle';

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
              onClick={() => {
                setCopyResult(undefined);
                void selectPreset(preset.id);
              }}
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
                  {loadingId === preset.id
                    ? isZh
                      ? '加载中'
                      : 'Loading'
                    : selected
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
          data-copied={copyStatus === 'copied'}
          onClick={async () => {
            let copied = false;
            try {
              copied = await copyToClipboard(
                generateThemePrompt(
                  activePreset,
                  lang,
                  await loadPreset(activePreset),
                ),
              );
            } catch {
              /* Report a copy failure if the source module could not load. */
            }
            setCopyResult({
              id: activePreset.id,
              status: copied ? 'copied' : 'error',
            });
          }}
        >
          <SvgWrapper
            icon={copyStatus === 'copied' ? IconSuccess : IconCopy}
            className={styles.actionIcon}
            aria-hidden="true"
          />
          <span>
            {copyStatus === 'copied'
              ? isZh
                ? '已复制'
                : 'Copied'
              : isZh
                ? '复制提示词'
                : 'Copy prompt'}
          </span>
        </button>
      </div>
      {error ? (
        <p role="alert">
          {isZh
            ? '主题加载失败，请点击卡片重试。'
            : 'Theme loading failed. Click the card to retry.'}
        </p>
      ) : null}
      {copyStatus === 'error' ? (
        <p role="alert">
          {isZh ? '复制失败，请重试。' : 'Copy failed. Please try again.'}
        </p>
      ) : null}
    </div>
  );
}
