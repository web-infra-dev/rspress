import { isDataUrl, isExternalUrl } from '@rspress/core/runtime';
import { useMemo } from 'react';
import { Badge } from '../Badge';

const SPECIAL_TAGS = {
  tip: 'tip',
  info: 'info',
  warning: 'warning',
  danger: 'danger',
  new: 'info',
  experimental: 'warning',
  deprecated: 'danger',
} as const;

function parseSpecialTagsArrayStr(tagStr: string): string[] | null {
  const tags = tagStr
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  if (tags.every(tag => Object.keys(SPECIAL_TAGS).includes(tag))) {
    return tags;
  }
  return null;
}

const getTagType = (tag: string) => {
  const normalizeTag = tag.trim();
  const isSvgTagString = normalizeTag.startsWith('<svg');
  const isPic = isExternalUrl(normalizeTag) || isDataUrl(normalizeTag);

  const specialTagsArray = parseSpecialTagsArrayStr(normalizeTag);

  return {
    isSvgTagString,
    isPic,
    isSpecialTagsArray: specialTagsArray !== null,
    specialTagsArray,
    normalizeTag,
  };
};

/**
 * @param {string} [props.tag] - Supported 1.special tags 2. svg 3. dataUrl 4. externalUrl 4.  5. normal text
 */
export const Tag = ({ tag }: { tag?: string }) => {
  if (!tag) {
    return null;
  }

  const {
    isPic,
    isSpecialTagsArray,
    isSvgTagString,
    normalizeTag,
    specialTagsArray,
  } = useMemo(() => {
    return getTagType(tag);
  }, [tag]);

  if (isSpecialTagsArray) {
    return (
      <>
        {specialTagsArray?.map(tag => {
          const type = SPECIAL_TAGS[tag as keyof typeof SPECIAL_TAGS];
          return <Badge key={tag} text={tag} type={type} />;
        })}
      </>
    );
  }

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
