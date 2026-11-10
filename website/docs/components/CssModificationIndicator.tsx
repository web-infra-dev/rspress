import { useLang } from '@rspress/core/runtime';
import { useCssModification } from './CssModificationContext';
import { FloatingToolbar } from './FloatingToolbar';
import styles from './FloatingToolbar.module.scss';

export function CssModificationIndicator() {
  const lang = useLang();
  const { hasModifications, resetAll } = useCssModification();

  if (!hasModifications) {
    return null;
  }

  return (
    <FloatingToolbar
      label={lang === 'en' ? 'CSS modified' : 'CSS 已修改'}
      kind="css"
    >
      <button type="button" onClick={resetAll} className={styles.action}>
        {lang === 'en' ? 'Reset' : '复原'}
      </button>
    </FloatingToolbar>
  );
}
