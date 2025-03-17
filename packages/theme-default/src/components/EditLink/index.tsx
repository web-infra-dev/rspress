import { useEditLink } from '../../logic/useEditLink';
import * as styles from './index.module.scss';

export function EditLink() {
  const editLinkObj = useEditLink();

  if (!editLinkObj) {
    return null;
  }

  const { text, link } = editLinkObj;

  return (
    <a href={link} target="_blank" className={styles.editLink}>
      {text}
    </a>
  );
}
