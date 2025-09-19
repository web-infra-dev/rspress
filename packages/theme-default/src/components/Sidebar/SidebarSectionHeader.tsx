import { Tag } from '@theme';
import { renderInlineMarkdown } from '../../logic/utils';
import './SidebarSectionHeader.scss';

export function SidebarSectionHeader({
  sectionHeaderText,
  tag,
}: {
  sectionHeaderText: string;
  tag?: string;
}) {
  return (
    <div className="rp-sidebar-section-header">
      <span {...renderInlineMarkdown(sectionHeaderText)}></span>
      <Tag tag={tag} />
    </div>
  );
}
