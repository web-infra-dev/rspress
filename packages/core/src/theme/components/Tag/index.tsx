import { isDataUrl, isExternalUrl } from '@rspress/core/runtime';
import {
  Badge,
  IconDeprecated,
  IconExperimental,
  SvgWrapper,
  Tag as WrappedTag,
} from '@theme';
import { useMemo } from 'react';

const BADGE_TAGS = {
  tip: 'tip',
  info: 'info',
  warning: 'warning',
  danger: 'danger',
} as const;

function parseCommonTagsArrayStr(tagStr: string): string[] | null {
  const tags = tagStr
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  return tags;
}

const getTagType = (tag: string) => {
  const normalizedTag = tag.trim();
  const isSvgTagString = normalizedTag.startsWith('<svg');
  const isPic = isExternalUrl(normalizedTag) || isDataUrl(normalizedTag);

  const tagsArray = parseCommonTagsArrayStr(normalizedTag);

  return {
    isSvgTagString,
    isPic,
    isTagsArray: tagsArray && tagsArray?.length > 1,
    tagsArray,
    normalizedTag,
  };
};

/**
 * @param {string} [props.tag] - Supported 1.common tags 2. svg 3. dataUrl 4. externalUrl 4.  5. normal text
 */
export const Tag = ({ tag }: { tag?: string }) => {
  if (!tag) {
    return null;
  }

  const { isPic, isTagsArray, isSvgTagString, normalizedTag, tagsArray } =
    useMemo(() => {
      return getTagType(tag);
    }, [tag]);

  if (isTagsArray) {
    return (
      <>
        {tagsArray?.map((tag, index) => {
          return <WrappedTag tag={tag} key={`${tag}-${index}`} />;
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

  if (normalizedTag === 'experimental') {
    return (
      <Badge type="warning">
        <SvgWrapper icon={IconExperimental} />
        <span>experimental</span>
      </Badge>
    );
  } else if (normalizedTag === 'deprecated') {
    return (
      <Badge type="danger">
        <SvgWrapper icon={IconDeprecated} />
        <span>deprecated</span>
      </Badge>
    );
  }

  if (BADGE_TAGS[normalizedTag as keyof typeof BADGE_TAGS]) {
    return (
      <Badge
        text={normalizedTag}
        type={BADGE_TAGS[normalizedTag as keyof typeof BADGE_TAGS]}
      />
    );
  }

  return <Badge text={normalizedTag} type="info" />;
};
