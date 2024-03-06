import { Tag } from "../Tag";

export function SidebarSectionHeader({ sectionHeaderText, tag }: {
    sectionHeaderText: string;
    tag?: string;
}) {
    return (
      <h3 className="rspress-sidebar-section-header">
        <Tag tag={tag} />
        <span>{sectionHeaderText}</span>
      </h3>
    );
}
