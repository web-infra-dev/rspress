import {
  Badge as BasicBadge,
  Tag as BasicTag,
} from '@rspress/core/theme-original';

export const Tag = ({ tag }: { tag?: string }) => {
  if (!tag) {
    return null;
  }

  // Handle comma-separated tags
  const tags = tag.split(',').map(t => t.trim());

  return (
    <>
      {tags.map((t, index) => {
        if (t === 'non-ejectable') {
          return <BasicBadge key={index} text="non-ejectable" type="danger" />;
        }
        if (t === 'eject-only') {
          return <BasicBadge key={index} text="eject-only" type="warning" />;
        }
        if (t === 'ejectable') {
          return <BasicBadge key={index} text="ejectable" type="tip" />;
        }
        return <BasicTag key={index} tag={t} />;
      })}
    </>
  );
};
