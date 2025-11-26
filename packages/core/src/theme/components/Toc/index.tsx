import { useActiveAnchor, useDynamicToc } from '@theme';
import { TocItem } from './TocItem';

const baseHeaderLevel = 2;

export function Toc() {
  const headers = useDynamicToc();
  const { activeAnchorId } = useActiveAnchor(headers);

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
