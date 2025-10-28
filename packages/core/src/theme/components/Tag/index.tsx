import { isDataUrl, isExternalUrl } from '@rspress/core/runtime';
import { Badge } from '../Badge';

export const Tag = ({ tag }: { tag?: string }) => {
  if (!tag) {
    return null;
  }
  const normalizeTag = tag.trim();
  const isSvgTagString = normalizeTag.startsWith('<svg');
  const isPic = isExternalUrl(normalizeTag) || isDataUrl(normalizeTag);

  if (isSvgTagString) {
    return (
      <div
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: tag }}
        style={{ width: 20, marginRight: 4 }}
      ></div>
    );
  }

  if (isPic) {
    return <img src={tag} />;
  }

  return <Badge text={normalizeTag} type="info" />;
};
