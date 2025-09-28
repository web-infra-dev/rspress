import { TocItem } from './TocItem';
import { useActiveAnchor } from './useActiveAnchor';
import { useDynamicToc } from './useDynamicToc';

const baseHeaderLevel = 2;

export function Toc({ isBottom = false }: { isBottom?: boolean }) {
  const headers = useDynamicToc();
  const activeAnchorId = useActiveAnchor(headers, isBottom);

  return (
    <>
      {headers.map((header, index) => (
        <TocItem
          key={`${header.depth}_${header.text}_${header.id}_${index}`}
          baseHeaderLevel={baseHeaderLevel}
          header={header}
          active={activeAnchorId === header.id}
        />
      ))}
    </>
  );
}
