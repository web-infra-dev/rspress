import { useLang } from '@rspress/core/runtime';
import { Layout, type LayoutProps, Link } from '@rspress/core/theme-original';
import { createContext, useContext, useState } from 'react';
import { CssModificationIndicator } from './CssModificationIndicator';
import { FloatingToolbar } from './FloatingToolbar';
import toolbarStyles from './FloatingToolbar.module.scss';
import styles from './SlotPreview.module.scss';

const slots = [
  'top',
  'bottom',
  'beforeNav',
  'afterNav',
  'beforeNavTitle',
  'navTitle',
  'afterNavTitle',
  'beforeNavMenu',
  'afterNavMenu',
  'beforeSidebar',
  'afterSidebar',
  'beforeOutline',
  'afterOutline',
  'beforeDoc',
  'afterDoc',
  'beforeDocContent',
  'afterDocContent',
  'beforeDocFooter',
  'afterDocFooter',
  'beforeHero',
  'afterHero',
  'beforeFeatures',
  'afterFeatures',
] as const satisfies readonly (keyof LayoutProps)[];

const SlotPreviewContext = createContext({
  enabled: false,
  toggle: () => {},
});

export function SlotPreviewToggle() {
  if (import.meta.env.SSG_MD) {
    return null;
  }

  const { enabled, toggle } = useContext(SlotPreviewContext);
  const isZh = useLang() === 'zh';

  return (
    <button
      type="button"
      className={styles.button}
      aria-pressed={enabled}
      onClick={toggle}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 9v12" />
      </svg>
      {enabled
        ? isZh
          ? '退出插槽预览'
          : 'Exit slot preview'
        : isZh
          ? '点击查看插槽所在位置'
          : 'Show slot locations'}
    </button>
  );
}

export function SlotPreviewLayout(props: LayoutProps) {
  const [enabled, setEnabled] = useState(false);
  const isZh = useLang() === 'zh';
  const previewProps = { ...props };

  if (enabled) {
    for (const slot of slots) {
      previewProps[slot] = (
        <>
          <span className={styles.marker} data-slot-preview={slot}>
            {slot}
          </span>
          {props[slot]}
        </>
      );
    }
  }

  return (
    <SlotPreviewContext.Provider
      value={{ enabled, toggle: () => setEnabled(value => !value) }}
    >
      <Layout {...previewProps} />
      <div className={toolbarStyles.stack}>
        {enabled ? (
          <FloatingToolbar
            label={isZh ? '插槽预览' : 'Slot preview'}
            kind="slots"
          >
            <Link className={toolbarStyles.link} href={isZh ? '/zh/' : '/'}>
              {isZh ? '首页插槽' : 'Homepage slots'}
              <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              className={toolbarStyles.action}
              aria-label={isZh ? '退出插槽预览' : 'Exit slot preview'}
              onClick={() => setEnabled(false)}
            >
              {isZh ? '退出' : 'Exit'}
            </button>
          </FloatingToolbar>
        ) : null}
        <CssModificationIndicator />
      </div>
    </SlotPreviewContext.Provider>
  );
}
