import { isProduction } from '@rspress/runtime';
import FileSvg from '@theme-assets/file';
import JumpSvg from '@theme-assets/jump';
import HeaderSvg from '@theme-assets/header';
import TitleSvg from '@theme-assets/title';
import { useRef } from 'react';
import { getSlicedStrByByteLength, removeDomain } from './logic/util';
import styles from './index.module.scss';
import type { DefaultMatchResultItem, HightlightInfo } from './logic/types';
import { SvgWrapper } from '../SvgWrapper';

const ICON_MAP = {
  title: TitleSvg,
  header: HeaderSvg,
  content: FileSvg,
};

export function SuggestItem({
  suggestion,
  closeSearch,
  isCurrent,
  setCurrentSuggestionIndex,
  inCurrentDocIndex,
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
  const HitIcon = ICON_MAP[suggestion.type];
  const link =
    inCurrentDocIndex && !isProduction()
      ? removeDomain(suggestion.link)
      : suggestion.link;
  const selfRef = useRef(null);
  if (isCurrent) {
    scrollTo(selfRef?.current?.offsetTop, selfRef?.current?.offsetHeight);
  }

  const getHighlightedFragments = (
    rawText: string,
    highlights: HightlightInfo[],
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
        <span key={start} className={styles.mark}>
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
        <div className="font-medium">
          {getHighlightedFragments(header, highlightInfoList)}
        </div>
      );
    }

    return <div className="font-medium">{suggestion.header}</div>;
  };

  const renderStatementMatch = () => {
    if (suggestion.type !== 'content') {
      return <div></div>;
    }
    const { statement, highlightInfoList } = suggestion;
    return (
      <div className="text-sm text-gray-light w-full">
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
          <p className={styles.titleForContent}>{suggestion.title}</p>
        </>
      );
      break;
    default:
      break;
  }

  return (
    <li
      key={suggestion.link}
      className={`${styles.suggestItem} ${isCurrent ? styles.current : ''}`}
      onMouseEnter={setCurrentSuggestionIndex}
      onMouseMove={onMouseMove}
      ref={selfRef}
    >
      <a
        href={link}
        onClick={e => {
          closeSearch();
          e.stopPropagation();
        }}
        target={inCurrentDocIndex ? '_self' : '_blank'}
      >
        <div className={styles.suggestItemContainer}>
          <div className={styles.hitIcon}>
            <SvgWrapper icon={HitIcon} />
          </div>
          <div className={styles.contentWrapper}>
            <span>{hitContent}</span>
          </div>
          <div className={styles.actionIcon}>
            <SvgWrapper icon={JumpSvg} />
          </div>
        </div>
      </a>
    </li>
  );
}
