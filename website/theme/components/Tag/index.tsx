import {
  Badge as BasicBadge,
  Tag as BasicTag,
} from '@rspress/core/theme-original';

export const Tag = ({ tag }: { tag?: string }) => {
  if (tag === 'non-ejectable') {
    return <BasicBadge text="non-ejectable" type="danger" />;
  }
  if (tag === 'eject-only') {
    return <BasicBadge text="eject-only" type="warning" />;
  }
  if (tag === 'ejectable') {
    return <BasicBadge text="ejectable" type="tip" />;
  }
  return <BasicTag tag={tag} />;
};
