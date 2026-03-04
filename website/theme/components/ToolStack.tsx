import { useLang } from '@rspress/core/runtime';
import { ToolStack as BaseToolStack } from '@rstack-dev/doc-ui/tool-stack';
import styles from './ToolStack.module.scss';

export function ToolStack() {
  const lang = useLang();
  const buttonLabel = lang === 'zh' ? '开始使用' : 'Get started';
  return (
    <div className={styles.root}>
      <BaseToolStack lang={lang === 'zh' ? 'zh' : 'en'} />
      <button type="button" className={styles.ctaButton}>
        {buttonLabel}
      </button>
    </div>
  );
}
