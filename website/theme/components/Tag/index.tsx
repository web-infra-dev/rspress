import {
  Badge as BasicBadge,
  Tag as BasicTag,
} from '@rspress/core/theme-original';

export const Tag = ({ tag }: { tag?: string }) => {
  if (!tag) {
    return null;
  }

  if (tag === 'eject-only') {
    return <BasicBadge text="eject-only" type="warning" />;
  }
  if (tag === 'non-ejectable') {
    return <BasicBadge text="non-ejectable" type="danger" />;
  }
  if (tag === 'updated') {
    return <BasicBadge text="updated" type="info" />;
  }

  return <BasicTag tag={tag} />;
};
