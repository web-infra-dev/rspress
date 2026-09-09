import { useLang } from '@rspress/core/runtime';
import { Layout, type LayoutProps, Link } from '@rspress/core/theme-original';
import { createContext, useContext, useState } from 'react';
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
  const { enabled, toggle } = useContext(SlotPreviewContext);
  const isZh = useLang() === 'zh';

  return (
    <button
      type="button"
      className={styles.button}
      aria-pressed={enabled}
      onClick={toggle}
    >
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
      {enabled ? (
        <FloatingToolbar
          label={isZh ? '插槽预览' : 'Slot preview'}
          kind="slots"
          placement="bottom"
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
    </SlotPreviewContext.Provider>
  );
}
