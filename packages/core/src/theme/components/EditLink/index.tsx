import { IconEdit, Link, SvgWrapper } from '@theme';
import './index.scss';
import { useEditLink } from './useEditLink';

export function EditLink({ isOutline }: { isOutline?: boolean }) {
  const editLinkObj = useEditLink();

  if (!editLinkObj) {
    return null;
  }

  const { text, link } = editLinkObj;

  if (isOutline) {
    return (
      <Link href={link} className="rp-outline__action-row">
        <SvgWrapper icon={IconEdit} width="16" height="16" />
        <span>{text}</span>
      </Link>
    );
  }

  return (
    <Link href={link} className="rp-edit-link">
      {text}
    </Link>
  );
}
