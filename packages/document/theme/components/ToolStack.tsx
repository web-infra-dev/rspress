import { ToolStack as BaseToolStack } from '@rstack-dev/doc-ui/tool-stack';
import { useLang } from 'rspress/runtime';
import styles from './ToolStack.module.scss';

export function ToolStack() {
  const lang = useLang();
  return (
    <div className={styles.root}>
      <BaseToolStack lang={lang === 'zh' ? 'zh' : 'en'} />
    </div>
  );
}
