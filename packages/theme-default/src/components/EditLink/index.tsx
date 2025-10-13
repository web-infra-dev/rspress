import './index.scss';
import { useEditLink } from './useEditLink';

export function EditLink() {
  const editLinkObj = useEditLink();

  if (!editLinkObj) {
    return null;
  }

  const { text, link } = editLinkObj;

  // EditLink must be an external site, so we use <a> directly instead of Link
  return (
    <a href={link} target="_blank" className="rp-edit-link">
      {text}
    </a>
  );
}
