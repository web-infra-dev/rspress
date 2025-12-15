import {
  Badge as BasicBadge,
  Tag as BasicTag,
} from '@rspress/core/theme-original';

export const Tag = ({ tag }: { tag: string }) => {
  if (tag === 'ejectable') {
    return <BasicBadge text="ejectable" type="tip" />;
  }
  return <BasicTag tag={tag} />;
};
