import { useI18n, useLang } from '@rspress/core/runtime';
import {
  copyToClipboard,
  IconArrowRight,
  IconCopy,
  IconSuccess,
  Link,
} from '@rspress/core/theme-original';
import {
  type CSSProperties,
  type KeyboardEvent,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  MaterialFileIcon,
  MaterialHtmlIcon,
  MaterialJsonIcon,
  MaterialMarkdownIcon,
} from './MaterialIcons';
import styles from './index.module.scss';

/* ---------- syntax token helpers (same vars as HeroInteractive) ---------- */

const S = ({ children }: PropsWithChildren) => (
  <span className={styles.string}>{children}</span>
);
const P = ({ children }: PropsWithChildren) => (
  <span className={styles.punctuation}>{children}</span>
);
const C = ({ children }: PropsWithChildren) => (
  <span className={styles.constant}>{children}</span>
);
const Line = ({ children }: PropsWithChildren) => (
  <div className="line">{children}</div>
);

const IconFolder = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="m6.922 3.768-.644-.536A1 1 0 0 0 5.638 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7.562a1 1 0 0 1-.64-.232"
      fill="#90a4ae"
    />
  </svg>
);

function getMaterialFileIcon(name: string) {
  if (name.endsWith('.md')) {
    return <MaterialMarkdownIcon />;
  }
  if (name.endsWith('.json')) {
    return <MaterialJsonIcon />;
  }
  if (name.endsWith('.html')) {
    return <MaterialHtmlIcon />;
  }
  return <MaterialFileIcon />;
}

/* ---------- section shell ---------- */

function Section(props: {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  linkText: string;
  linkHref: string;
  secondaryLink?: { text: string; href: string };
  reverse?: boolean;
  compact?: boolean;
  visual: ReactNode;
}) {
  return (
    <section
      className={`${styles.section} ${props.reverse ? styles.reverse : ''} ${props.compact ? styles.sectionCompact : ''}`}
    >
      <div className={styles.text}>
        <span className={styles.eyebrow}>{props.eyebrow}</span>
        <h2 className={styles.title}>{props.title}</h2>
        <p className={styles.description}>{props.description}</p>
        <ul className={styles.points}>
          {props.points.map(point => (
            <li key={point}>
              <IconSuccess />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <div className={styles.links}>
          <Link className={styles.link} href={props.linkHref}>
            {props.linkText}
            <IconArrowRight />
          </Link>
          {props.secondaryLink ? (
            <Link className={styles.link} href={props.secondaryLink.href}>
              {props.secondaryLink.text}
              <IconArrowRight />
            </Link>
          ) : null}
        </div>
      </div>
      <div className={styles.visual}>{props.visual}</div>
    </section>
  );
}

/* ---------- visual 1: SSG-MD output tree + tabbed preview ---------- */

function TreeRow(props: {
  depth: number;
  type: 'folder' | 'file';
  name: string;
  index?: number;
  slot?: number;
  x?: number;
  width?: number;
  routeX?: number;
  accent?: boolean;
  current?: boolean;
  tag?: string;
  route?: string;
  guide?: boolean;
  visible?: boolean;
  stagger?: boolean;
}) {
  return (
    <div
      className={`${styles.treeRow} ${props.stagger === false ? '' : styles.staggerRise} ${props.accent ? styles.treeRowAccent : ''} ${props.current ? styles.treeRowCurrent : ''} ${props.guide ? styles.treeRowGuide : ''}`}
      data-visible={props.visible ?? true}
      aria-hidden={props.visible === false ? true : undefined}
      style={
        {
          paddingLeft: props.depth * 20 + 12,
          ...(props.width === undefined ? {} : { width: `${props.width}%` }),
          '--i': props.index ?? 0,
          '--slot': props.slot ?? 0,
          '--depth': props.depth,
          '--x': `${props.x ?? 0}%`,
          '--route-x': `${props.routeX ?? 0}%`,
        } as CSSProperties
      }
    >
      {props.type === 'folder' ? (
        <IconFolder />
      ) : (
        getMaterialFileIcon(props.name)
      )}
      <span>{props.name}</span>
      {props.tag ? <em className={styles.treeTag}>{props.tag}</em> : null}
      {props.route ? (
        <span className={styles.treeRoute}>
          <IconArrowRight />
          <code>{props.route}</code>
        </span>
      ) : null}
    </div>
  );
}

type SsgMdTab = 'html' | 'md' | 'llms';

const SSG_MD_TABS = [
  { key: 'html', label: 'introduction.html' },
  { key: 'md', label: 'introduction.md' },
  { key: 'llms', label: 'llms.txt' },
] as const;

const INTRODUCTION_MARKDOWN = `# Introduction

Rspress is a lightning fast static site generator based on Rsbuild.

\`\`\`ts title="index.ts"
console.log('Hello Rspress');
\`\`\``;

function SsgMdVisual(props: { copyText: string; copiedText: string }) {
  const [tab, setTab] = useState<SsgMdTab>('md');
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  const tabRefs = useRef<Record<SsgMdTab, HTMLButtonElement | null>>({
    html: null,
    md: null,
    llms: null,
  });

  useEffect(
    () => () => {
      if (copyTimer.current) {
        window.clearTimeout(copyTimer.current);
      }
    },
    [],
  );

  const handleCopy = async () => {
    if (!(await copyToClipboard(INTRODUCTION_MARKDOWN))) {
      return;
    }

    setCopied(true);
    if (copyTimer.current) {
      window.clearTimeout(copyTimer.current);
    }
    copyTimer.current = window.setTimeout(() => {
      setCopied(false);
      copyTimer.current = null;
    }, 1000);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: SsgMdTab,
  ) => {
    const currentIndex = SSG_MD_TABS.findIndex(item => item.key === currentTab);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % SSG_MD_TABS.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + SSG_MD_TABS.length) % SSG_MD_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = SSG_MD_TABS.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    const nextTab = SSG_MD_TABS[nextIndex].key;
    setTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  return (
    <div className={styles.ssgMdVisual}>
      <div className={`${styles.card} ${styles.treeCard}`}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <IconFolder />
            <span>doc_build</span>
          </div>
          <div className={styles.treeLegend}>
            <span>
              <i className={styles.legendDotSsg} />
              SSG
            </span>
            <span>
              <i className={styles.legendDotSsgMd} />
              SSG-MD
            </span>
          </div>
        </div>
        <div className={styles.tree}>
          <TreeRow index={0} depth={0} type="folder" name="guide" />
          <TreeRow index={1} depth={1} type="folder" name="start" />
          <TreeRow
            index={2}
            depth={2}
            type="file"
            name="introduction.html"
            current={tab === 'html'}
          />
          <TreeRow
            index={3}
            depth={2}
            type="file"
            name="introduction.md"
            accent
            current={tab === 'md'}
          />
          <TreeRow
            index={4}
            depth={0}
            type="file"
            name="llms.txt"
            accent
            current={tab === 'llms'}
            tag="index"
          />
          <TreeRow
            index={5}
            depth={0}
            type="file"
            name="llms-full.txt"
            accent
            tag="full"
          />
        </div>
      </div>
      <div className={`${styles.card} ${styles.llmsCard}`}>
        <div className={styles.tabHeader} role="tablist">
          {SSG_MD_TABS.map(({ key, label }) => (
            <button
              key={key}
              ref={element => {
                tabRefs.current[key] = element;
              }}
              type="button"
              id={`home-ssg-md-tab-${key}`}
              role="tab"
              aria-controls={`home-ssg-md-panel-${key}`}
              aria-selected={tab === key}
              tabIndex={tab === key ? 0 : -1}
              className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
              onClick={() => setTab(key)}
              onKeyDown={event => handleTabKeyDown(event, key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.tabPanels}>
          <div
            id="home-ssg-md-panel-html"
            role="tabpanel"
            aria-labelledby="home-ssg-md-tab-html"
            aria-hidden={tab !== 'html'}
            className={`${styles.tabPanel} ${tab === 'html' ? styles.tabPanelVisible : styles.tabPanelHidden}`}
          >
            <div className={styles.pagePreview}>
              <div className={styles.pageHead}>
                <div className={styles.pageTitle}>Introduction</div>
                <button
                  type="button"
                  className={styles.copyMdButton}
                  onClick={() => void handleCopy()}
                >
                  {copied ? <IconSuccess /> : <IconCopy />}
                  <span aria-live="polite">
                    {copied ? props.copiedText : props.copyText}
                  </span>
                </button>
              </div>
              <div className={styles.pageText} style={{ width: '94%' }} />
              <div className={styles.pageText} style={{ width: '80%' }} />
              <div className={styles.pageCode}>
                <div className={styles.pageCodeTitle}>index.ts</div>
                <div className={styles.pageCodeBody}>
                  <span>console.log('Hello Rspress');</span>
                </div>
              </div>
            </div>
          </div>
          <div
            id="home-ssg-md-panel-md"
            role="tabpanel"
            aria-labelledby="home-ssg-md-tab-md"
            aria-hidden={tab !== 'md'}
            className={`${styles.tabPanel} ${tab === 'md' ? styles.tabPanelVisible : styles.tabPanelHidden}`}
          >
            <div className={styles.llmsContent}>
              <div className={styles.llmsTitle}># Introduction</div>
              <div className={styles.mdText}>
                Rspress is a lightning fast static site
              </div>
              <div className={styles.mdText}>generator based on Rsbuild.</div>
              <div className={styles.mdFence}>{'```'}ts title="index.ts"</div>
              <div className={styles.mdText}>console.log('Hello Rspress');</div>
              <div className={styles.mdFence}>{'```'}</div>
            </div>
          </div>
          <div
            id="home-ssg-md-panel-llms"
            role="tabpanel"
            aria-labelledby="home-ssg-md-tab-llms"
            aria-hidden={tab !== 'llms'}
            className={`${styles.tabPanel} ${tab === 'llms' ? styles.tabPanelVisible : styles.tabPanelHidden}`}
          >
            <div className={styles.llmsContent}>
              <div className={styles.llmsTitle}># Rspress</div>
              <div className={styles.llmsQuote}>
                Lightning fast static site generator
              </div>
              <div className={styles.llmsH2}>## Docs</div>
              <div className={styles.llmsItem}>
                - <span>[Introduction](/guide/start/introduction.md)</span>
              </div>
              <div className={styles.llmsItem}>
                - <span>[Quick Start](/guide/start/getting-started.md)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- visual 2: _meta.json -> sidebar (hover wiring) ---------- */

function AutoNavVisual() {
  const [wiring, setWiring] = useState<string | null>(null);
  const wireHandlers = (id: string) => ({
    onMouseEnter: () => setWiring(id),
    onMouseLeave: () => setWiring(null),
    onFocus: () => setWiring(id),
    onBlur: () => setWiring(null),
    tabIndex: 0,
  });
  // Hovering or focusing either side frames the source and its counterpart.
  const ringFor = (id: string) => (wiring === id ? true : undefined);
  const targetClass = (id: string, base: string) =>
    `${base} ${ringFor(id) ? styles.wireTarget : ''}`;

  return (
    <div className={`${styles.card} ${styles.autoNavCard}`}>
      <div className={styles.autoNavCode}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <MaterialJsonIcon />
            <span>docs/guide/_meta.json</span>
          </div>
        </div>
        <pre className={styles.codeContent}>
          <code>
            <Line>
              <P>[</P>
            </Line>
            <div
              className={styles.codeGroup}
              data-active={ringFor('header')}
              {...wireHandlers('header')}
            >
              <Line>
                {'  '}
                <P>{'{'}</P>
              </Line>
              <Line>
                {'    '}
                <C>"type"</C>
                <P>:</P> <S>"section-header"</S>
                <P>,</P>
              </Line>
              <Line>
                {'    '}
                <C>"label"</C>
                <P>:</P> <S>"Guide"</S>
              </Line>
              <Line>
                {'  '}
                <P>{'},'}</P>
              </Line>
            </div>
            <div
              className={styles.codeGroup}
              data-active={ringFor('introduction')}
              {...wireHandlers('introduction')}
            >
              <Line>
                {'  '}
                <S>"introduction"</S>
                <P>,</P>
              </Line>
            </div>
            <div
              className={styles.codeGroup}
              data-active={ringFor('quick-start')}
              {...wireHandlers('quick-start')}
            >
              <Line>
                {'  '}
                <S>"quick-start"</S>
                <P>,</P>
              </Line>
            </div>
            <div
              className={styles.codeGroup}
              data-active={ringFor('advanced')}
              {...wireHandlers('advanced')}
            >
              <Line>
                {'  '}
                <P>{'{'}</P>
              </Line>
              <Line>
                {'    '}
                <C>"type"</C>
                <P>:</P> <S>"dir"</S>
                <P>,</P>
              </Line>
              <Line>
                {'    '}
                <C>"name"</C>
                <P>:</P> <S>"advanced"</S>
              </Line>
              <Line>
                {'  '}
                <P>{'}'}</P>
              </Line>
            </div>
            <Line>
              <P>]</P>
            </Line>
          </code>
        </pre>
      </div>
      <div className={styles.autoNavSidebar}>
        <div
          className={targetClass('header', styles.sidebarSectionHeader)}
          {...wireHandlers('header')}
        >
          Guide
        </div>
        <div
          className={targetClass(
            'introduction',
            `${styles.sidebarItem} ${styles.sidebarItemActive}`,
          )}
          {...wireHandlers('introduction')}
        >
          Introduction
        </div>
        <div
          className={targetClass('quick-start', styles.sidebarItem)}
          {...wireHandlers('quick-start')}
        >
          Quick Start
        </div>
        <div
          className={targetClass('advanced', styles.sidebarDir)}
          {...wireHandlers('advanced')}
        >
          Advanced
          <IconArrowRight />
        </div>
      </div>
    </div>
  );
}

/* ---------- visual 3: languages and versions as directories ---------- */

type I18nStage = 0 | 1 | 2;

type I18nRowState = {
  depth: number;
  slot: number;
  route?: string;
};

type I18nRow = {
  id: string;
  type: 'folder' | 'file';
  name: string;
  tag?: string;
  accent?: boolean;
  guide?: boolean;
  states: Partial<Record<I18nStage, I18nRowState>>;
};

const I18N_ROW_HEIGHT = 24;
const I18N_COLUMN_ROWS = 5;
const I18N_STACK_ROWS = 10;
const I18N_ROWS: I18nRow[] = [
  {
    id: 'v1',
    type: 'folder',
    name: 'v1',
    accent: true,
    states: { 2: { depth: 0, slot: 0 } },
  },
  {
    id: 'en',
    type: 'folder',
    name: 'en',
    tag: 'English',
    accent: true,
    guide: true,
    states: {
      0: { depth: 0, slot: 0 },
      1: { depth: 0, slot: 0 },
      2: { depth: 1, slot: 1 },
    },
  },
  {
    id: 'en-index',
    type: 'file',
    name: 'index.md',
    states: {
      0: { depth: 1, slot: 1, route: '/' },
      1: { depth: 1, slot: 1, route: '/' },
      2: { depth: 2, slot: 2, route: '/' },
    },
  },
  {
    id: 'zh',
    type: 'folder',
    name: 'zh',
    tag: '简体中文',
    accent: true,
    guide: true,
    states: {
      1: { depth: 0, slot: 2 },
      2: { depth: 1, slot: 3 },
    },
  },
  {
    id: 'zh-index',
    type: 'file',
    name: 'index.md',
    states: {
      1: { depth: 1, slot: 3, route: '/zh/' },
      2: { depth: 2, slot: 4, route: '/zh/' },
    },
  },
  {
    id: 'v2',
    type: 'folder',
    name: 'v2',
    accent: true,
    states: { 2: { depth: 0, slot: 5 } },
  },
  {
    id: 'v2-en',
    type: 'folder',
    name: 'en',
    tag: 'English',
    accent: true,
    guide: true,
    states: { 2: { depth: 1, slot: 6 } },
  },
  {
    id: 'v2-en-index',
    type: 'file',
    name: 'index.md',
    states: { 2: { depth: 2, slot: 7, route: '/v2/' } },
  },
  {
    id: 'v2-zh',
    type: 'folder',
    name: 'zh',
    tag: '简体中文',
    accent: true,
    guide: true,
    states: { 2: { depth: 1, slot: 8 } },
  },
  {
    id: 'v2-zh-index',
    type: 'file',
    name: 'index.md',
    states: { 2: { depth: 2, slot: 9, route: '/v2/zh/' } },
  },
];

function getI18nRowState(row: I18nRow, stage: I18nStage) {
  for (let current = stage; current >= 0; current -= 1) {
    const state = row.states[current as I18nStage];
    if (state) {
      return state;
    }
  }
  return Object.values(row.states)[0]!;
}

function I18nVisual() {
  const t = useI18n<typeof import('i18n')>();
  const rootRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<I18nStage>(0);
  const visibleRowCount = I18N_ROWS.filter(row => row.states[stage]).length;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage(2);
      return;
    }

    let timer: number | undefined;
    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };
    const start = () => {
      if (timer === undefined) {
        timer = window.setInterval(() => {
          setStage(current => ((current + 1) % 3) as I18nStage);
        }, 2400);
      }
    };
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          start();
        } else {
          stop();
        }
      },
      { threshold: 0.35 },
    );

    if (rootRef.current) {
      observer.observe(rootRef.current);
    }

    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  const renderTree = (columns: boolean) => {
    const rowCount = columns ? I18N_COLUMN_ROWS : I18N_STACK_ROWS;
    const occupiedRowCount =
      columns && stage === 2 ? I18N_COLUMN_ROWS : visibleRowCount;
    const treeOffset = ((rowCount - occupiedRowCount) * I18N_ROW_HEIGHT) / 2;
    const layout = columns ? 'columns' : 'stack';

    return (
      <div
        className={`${styles.i18nTreeViewport} ${columns ? styles.i18nTreeColumns : styles.i18nTreeStack}`}
        role="group"
        aria-label={t('homeI18nRoutes')}
        style={{ height: rowCount * I18N_ROW_HEIGHT }}
      >
        <div
          className={styles.i18nTree}
          style={
            {
              transform: `translateY(${treeOffset}px)`,
              '--row-height': `${I18N_ROW_HEIGHT}px`,
            } as CSSProperties
          }
        >
          {I18N_ROWS.map(row => {
            const baseState = getI18nRowState(row, stage);
            const isSecondVersion = row.id.startsWith('v2');
            const state = columns
              ? {
                  ...baseState,
                  slot:
                    stage === 2
                      ? baseState.slot % I18N_COLUMN_ROWS
                      : baseState.slot,
                  x: isSecondVersion && stage === 2 ? 100 : 0,
                  width: 50,
                  routeX: stage === 2 ? 0 : 100,
                }
              : { ...baseState, x: 0, width: 100, routeX: 0 };

            return (
              <TreeRow
                key={`${layout}-${row.id}`}
                depth={state.depth}
                slot={state.slot}
                x={state.x}
                width={state.width}
                routeX={state.routeX}
                type={row.type}
                name={row.name}
                tag={row.tag}
                accent={row.accent}
                guide={row.guide}
                route={state.route}
                visible={row.states[stage] !== undefined}
                stagger={false}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={rootRef} className={styles.card}>
      <div className={`${styles.cardHeader} ${styles.i18nCardHeader}`}>
        <div className={styles.cardHeaderTitle}>
          <IconFolder />
          <span>docs</span>
        </div>
      </div>
      {renderTree(true)}
      {renderTree(false)}
    </div>
  );
}

/* ---------- visual 4: plugin ecosystem + layout slots ---------- */

const stroke = (paths: ReactNode) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {paths}
  </svg>
);

const IconGrid = () =>
  stroke(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>,
  );
const IconMagnifier = () =>
  stroke(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>,
  );
const IconCode = () =>
  stroke(
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>,
  );
const IconNodes = () =>
  stroke(
    <>
      <rect x="9" y="2" width="6" height="5" rx="1" />
      <rect x="2" y="17" width="6" height="5" rx="1" />
      <rect x="16" y="17" width="6" height="5" rx="1" />
      <path d="M12 7v3m0 0H5v7m7-7h7v7" />
    </>,
  );
const IconBook = () =>
  stroke(
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>,
  );
const IconEye = () =>
  stroke(
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>,
  );
const IconPlay = () =>
  stroke(
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </>,
  );
const IconRss = () =>
  stroke(
    <>
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none" />
    </>,
  );
const IconPlus = () =>
  stroke(
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>,
  );
const IconLayout = () =>
  stroke(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </>,
  );

const PLUGINS = [
  {
    name: 'Preview',
    icon: <IconEye />,
    link: '/plugin/official-plugins/preview',
  },
  {
    name: 'Playground',
    icon: <IconPlay />,
    link: '/plugin/official-plugins/playground',
  },
  {
    name: 'Algolia',
    icon: <IconMagnifier />,
    link: '/plugin/official-plugins/algolia',
  },
  {
    name: 'Twoslash',
    icon: <IconCode />,
    link: '/plugin/official-plugins/twoslash',
  },
  {
    name: 'Typedoc',
    icon: <IconBook />,
    link: '/plugin/official-plugins/typedoc',
  },
  {
    name: 'Sitemap',
    icon: <IconNodes />,
    link: '/plugin/official-plugins/sitemap',
  },
  { name: 'RSS', icon: <IconRss />, link: '/plugin/official-plugins/rss' },
];

function ExtendVisual(props: { langPrefix?: string; yourPluginText: string }) {
  const { langPrefix = '', yourPluginText } = props;
  return (
    <div className={styles.extendVisual}>
      <div className={`${styles.card} ${styles.pluginsCard}`}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <IconGrid />
            <span>@rspress/plugin-*</span>
          </div>
        </div>
        <div className={styles.pluginGrid}>
          {PLUGINS.map((plugin, index) => (
            <Link
              key={plugin.name}
              className={`${styles.pluginTile} ${styles.staggerFade}`}
              style={{ '--i': index } as CSSProperties}
              href={`${langPrefix}${plugin.link}`}
            >
              {plugin.icon}
              <span>{plugin.name}</span>
            </Link>
          ))}
          <Link
            className={`${styles.pluginTile} ${styles.pluginTileDashed} ${styles.staggerFade}`}
            style={{ '--i': PLUGINS.length } as CSSProperties}
            href={`${langPrefix}/plugin/system/write-a-plugin`}
          >
            <IconPlus />
            <span>{yourPluginText}</span>
          </Link>
        </div>
      </div>
      <div className={`${styles.card} ${styles.slotsCard}`}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <IconLayout />
            <span>theme/index.tsx · slots</span>
          </div>
        </div>
        <div className={styles.wire}>
          <div className={styles.wireNav}>
            <div className={styles.wireLogo} />
            <span className={styles.slotChip}>beforeNavTitle</span>
          </div>
          <div className={styles.wireBody}>
            <div className={styles.wireSidebar}>
              <span className={styles.slotChip}>beforeSidebar</span>
              <div className={styles.wireLine} style={{ width: '80%' }} />
              <div className={styles.wireLine} style={{ width: '60%' }} />
              <div className={styles.wireLine} style={{ width: '70%' }} />
            </div>
            <div className={styles.wireContent}>
              <div className={styles.wireDocTitle} />
              <span className={styles.slotChip}>beforeDocContent</span>
              <div className={styles.wireLine} style={{ width: '95%' }} />
              <div className={styles.wireLine} style={{ width: '80%' }} />
              <div className={styles.wireLine} style={{ width: '85%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- entry ---------- */

export function HomeSections() {
  const t = useI18n<typeof import('i18n')>();
  const lang = useLang();
  const prefix = lang === 'zh' ? '/zh' : '';

  return (
    <div className={styles.root}>
      <Section
        eyebrow={t('homeSsgMdEyebrow')}
        title={t('homeSsgMdTitle')}
        description={t('homeSsgMdDesc')}
        points={[
          t('homeSsgMdPoint1'),
          t('homeSsgMdPoint2'),
          t('homeSsgMdPoint3'),
        ]}
        linkText={t('homeSsgMdLink')}
        linkHref={`${prefix}/guide/basic/ssg-md`}
        visual={
          <SsgMdVisual
            copyText={t('copyMarkdownText')}
            copiedText={t('promptCopiedText')}
          />
        }
      />
      <Section
        eyebrow={t('homeNavEyebrow')}
        title={t('homeNavTitle')}
        description={t('homeNavDesc')}
        points={[t('homeNavPoint1'), t('homeNavPoint2'), t('homeNavPoint3')]}
        linkText={t('homeNavLink')}
        linkHref={`${prefix}/guide/basic/auto-nav-sidebar`}
        reverse
        visual={<AutoNavVisual />}
      />
      <Section
        eyebrow={t('homeI18nEyebrow')}
        title={t('homeI18nTitle')}
        description={t('homeI18nDesc')}
        points={[t('homeI18nPoint1'), t('homeI18nPoint2'), t('homeI18nPoint3')]}
        linkText={t('homeI18nLink')}
        linkHref={`${prefix}/guide/basic/i18n`}
        secondaryLink={{
          text: t('homeI18nVersionLink'),
          href: `${prefix}/guide/basic/multi-version`,
        }}
        compact
        visual={<I18nVisual />}
      />
      <Section
        eyebrow={t('homeExtendEyebrow')}
        title={t('homeExtendTitle')}
        description={t('homeExtendDesc')}
        points={[
          t('homeExtendPoint1'),
          t('homeExtendPoint2'),
          t('homeExtendPoint3'),
        ]}
        linkText={t('homeExtendLink')}
        linkHref={`${prefix}/guide/basic/custom-theme`}
        reverse
        visual={
          <ExtendVisual
            langPrefix={prefix}
            yourPluginText={t('homeYourPlugin')}
          />
        }
      />
    </div>
  );
}
