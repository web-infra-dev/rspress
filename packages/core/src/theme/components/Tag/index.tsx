import { isDataUrl, isExternalUrl } from '@rspress/core/runtime';
import { Badge, IconDeprecated, IconExperimental, SvgWrapper } from '@theme';
import { useMemo } from 'react';

const COMMON_TAGS = {
  tip: 'tip',
  info: 'info',
  warning: 'warning',
  danger: 'danger',
  new: 'info',
  experimental: 'warning',
  deprecated: 'danger',
} as const;

function parseCommonTagsArrayStr(tagStr: string): string[] | null {
  const tags = tagStr
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  if (tags.every(tag => Object.keys(COMMON_TAGS).includes(tag))) {
    return tags;
  }
  return null;
}

const getTagType = (tag: string) => {
  const normalizedTag = tag.trim();
  const isSvgTagString = normalizedTag.startsWith('<svg');
  const isPic = isExternalUrl(normalizedTag) || isDataUrl(normalizedTag);

  const commonTagsArray = parseCommonTagsArrayStr(normalizedTag);

  return {
    isSvgTagString,
    isPic,
    isCommonTagsArray: commonTagsArray !== null,
    commonTagsArray: commonTagsArray,
    normalizedTag: normalizedTag,
  };
};

/**
 * @param {string} [props.tag] - Supported 1.common tags 2. svg 3. dataUrl 4. externalUrl 4.  5. normal text
 */
export const Tag = ({ tag }: { tag?: string }) => {
  if (!tag) {
    return null;
  }

  const {
    isPic,
    isCommonTagsArray,
    isSvgTagString,
    normalizedTag,
    commonTagsArray,
  } = useMemo(() => {
    return getTagType(tag);
  }, [tag]);

  if (isCommonTagsArray) {
    return (
      <>
        {commonTagsArray?.map(tag => {
          if (tag === 'experimental') {
            return (
              <Badge type="warning">
                <SvgWrapper icon={IconExperimental} />
                <span>experimental</span>
              </Badge>
            );
          } else if (tag === 'deprecated') {
            return (
              <Badge type="danger">
                <SvgWrapper icon={IconDeprecated} />
                <span>deprecated</span>
              </Badge>
            );
          }
          const type = COMMON_TAGS[tag as keyof typeof COMMON_TAGS];
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

  return <Badge text={normalizedTag} type="info" />;
};
