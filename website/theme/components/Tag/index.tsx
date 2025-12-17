import {
  Badge as BasicBadge,
  Tag as BasicTag,
} from '@rspress/core/theme-original';

export const Tag = ({ tag }: { tag?: string }) => {
  if (!tag) {
    return null;
  }

  // Handle comma-separated tags
  const tags = tag.includes(',') ? tag.split(',').map(t => t.trim()) : [tag];

  return (
    <>
      {tags.map(t => {
        if (t === 'non-ejectable') {
          return <BasicBadge key={t} text="non-ejectable" type="danger" />;
        }
        if (t === 'eject-only') {
          return <BasicBadge key={t} text="eject-only" type="warning" />;
        }
        if (t === 'ejectable') {
          return <BasicBadge key={t} text="ejectable" type="tip" />;
        }
        return <BasicTag key={t} tag={t} />;
      })}
    </>
  );
};
