import {
  IconFile,
  IconHeader,
  IconJump,
  IconTitle,
  Link,
  SvgWrapper,
} from '@theme';
import { useRef } from 'react';
import './SuggestItem.scss';
import type { DefaultMatchResultItem, HighlightInfo } from './logic/types';
import { getSlicedStrByByteLength } from './logic/util';

export function SuggestItem({
  suggestion,
  closeSearch,
  isCurrent,
  setCurrentSuggestionIndex,
  scrollTo,
  onMouseMove,
}: {
  suggestion: DefaultMatchResultItem;
  closeSearch: () => void;
  isCurrent: boolean;
  setCurrentSuggestionIndex: (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
  ) => void;
  onMouseMove: (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
  inCurrentDocIndex: boolean;
  scrollTo: (top: number, height: number) => void;
}) {
  const ICON_MAP = {
    title: IconTitle,
    header: IconHeader,
    content: IconFile,
  };

  const HitIcon = ICON_MAP[suggestion.type];
  const selfRef = useRef<HTMLLIElement>(null);
  if (isCurrent && selfRef.current?.offsetTop) {
    scrollTo(selfRef.current?.offsetTop, selfRef.current?.offsetHeight);
  }

  const getHighlightedFragments = (
    rawText: string,
    highlights: HighlightInfo[],
  ) => {
    // Split raw text into several parts, and add styles.mark className to the parts that need to be highlighted.
    // highlightInfoList is an array of objects, each object contains the start index and the length of the part that needs to be highlighted.
    // For example, if the statement is "This is a statement", and the query is "is", then highlightInfoList is [{start: 2, length: 2}, {start: 5, length: 2}].
    const fragmentList = [];
    let lastIndex = 0;
    for (const highlightInfo of highlights) {
      const { start, length } = highlightInfo;
      const prefix = rawText.slice(lastIndex, start);
      const queryStr = getSlicedStrByByteLength(rawText, start, length);
      fragmentList.push(prefix);
      fragmentList.push(
        <span key={start} className="rp-suggest-item__mark">
          {queryStr}
        </span>,
      );
      lastIndex = start + queryStr.length;
    }

    if (lastIndex < rawText.length) {
      fragmentList.push(rawText.slice(lastIndex));
    }

    return fragmentList;
  };

  const renderHeaderMatch = () => {
    if (suggestion.type === 'header' || suggestion.type === 'title') {
      const { header, highlightInfoList } = suggestion;
      return (
        <div className="rp-suggest-item__header">
          {getHighlightedFragments(header, highlightInfoList)}
        </div>
      );
    }

    return <div className="rp-suggest-item__header">{suggestion.header}</div>;
  };

  const renderStatementMatch = () => {
    if (suggestion.type !== 'content') {
      return <div></div>;
    }
    const { statement, highlightInfoList } = suggestion;
    return (
      <div className="rp-suggest-item__statement">
        {getHighlightedFragments(statement, highlightInfoList)}
      </div>
    );
  };

  let hitContent = null;

  switch (suggestion.type) {
    case 'title':
    case 'header':
      hitContent = renderHeaderMatch();
      break;
    case 'content':
      hitContent = (
        <>
          {renderStatementMatch()}
          <p className="rp-suggest-item__title">{suggestion.title}</p>
        </>
      );
      break;
    default:
      break;
  }

  return (
    <li
      key={suggestion.link}
      className={`rp-suggest-item ${isCurrent ? 'rp-suggest-item--current' : ''}`}
      onMouseEnter={setCurrentSuggestionIndex}
      onMouseMove={onMouseMove}
      ref={selfRef}
    >
      <Link
        href={suggestion.link}
        className="rp-suggest-item__link"
        onClick={e => {
          closeSearch();
          e.stopPropagation();
        }}
      >
        <div className="rp-suggest-item__container">
          <div className="rp-suggest-item__icon">
            <SvgWrapper icon={HitIcon} />
          </div>
          <div className="rp-suggest-item__content">
            <span>{hitContent}</span>
          </div>
          <div className="rp-suggest-item__action-icon">
            <SvgWrapper icon={IconJump} />
          </div>
        </div>
      </Link>
    </li>
  );
}
