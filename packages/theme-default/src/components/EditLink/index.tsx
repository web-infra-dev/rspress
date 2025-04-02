import { useEditLink } from '../../logic';
import styles from './index.module.scss';

export function EditLink() {
  const editLinkObj = useEditLink();

  if (!editLinkObj) {
    return null;
  }

  const { text, link } = editLinkObj;

  // EditLink must be an external site, so we use <a> directly instead of Link
  return (
    <a href={link} target="_blank" className={styles.editLink}>
      {text}
    </a>
  );
}
