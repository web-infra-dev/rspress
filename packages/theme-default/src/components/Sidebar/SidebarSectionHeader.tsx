import { Tag } from '@theme';
import { renderInlineMarkdown } from '../../logic';

export function SidebarSectionHeader({
  sectionHeaderText,
  tag,
}: {
  sectionHeaderText: string;
  tag?: string;
}) {
  return (
    <div className="rspress-sidebar-section-header">
      <Tag tag={tag} />
      <span>{renderInlineMarkdown(sectionHeaderText)}</span>
    </div>
  );
}
