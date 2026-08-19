import { useI18n, useLang } from '@rspress/core/runtime';
import {
  IconArrowRight,
  IconCopy,
  IconFile,
  IconSuccess,
  Link,
} from '@rspress/core/theme-original';
import {
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
  useState,
} from 'react';
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
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 5a2 2 0 0 1 2-2h4.2a2 2 0 0 1 1.6.8L12.2 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" />
  </svg>
);

/* ---------- section shell ---------- */

function Section(props: {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  linkText: string;
  linkHref: string;
  reverse?: boolean;
  visual: ReactNode;
}) {
  return (
    <section
      className={`${styles.section} ${props.reverse ? styles.reverse : ''}`}
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
        <Link className={styles.link} href={props.linkHref}>
          {props.linkText}
          <IconArrowRight />
        </Link>
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
  accent?: boolean;
  current?: boolean;
  tag?: string;
}) {
  return (
    <div
      className={`${styles.treeRow} ${styles.staggerRise} ${props.accent ? styles.treeRowAccent : ''} ${props.current ? styles.treeRowCurrent : ''}`}
      style={
        {
          paddingLeft: props.depth * 20 + 12,
          '--i': props.index ?? 0,
        } as CSSProperties
      }
    >
      {props.type === 'folder' ? <IconFolder /> : <IconFile />}
      <span>{props.name}</span>
      {props.tag ? <em className={styles.treeTag}>{props.tag}</em> : null}
    </div>
  );
}

type SsgMdTab = 'html' | 'md' | 'llms';

const SSG_MD_TABS = [
  { key: 'html', label: 'introduction.html' },
  { key: 'md', label: 'introduction.md' },
  { key: 'llms', label: 'llms.txt' },
] as const;

function SsgMdVisual() {
  const [tab, setTab] = useState<SsgMdTab>('md');

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
            current={tab === 'llms'}
            tag="full"
          />
        </div>
      </div>
      <div className={`${styles.card} ${styles.llmsCard}`}>
        <div className={styles.tabHeader}>
          {SSG_MD_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.tabPanels}>
          <div
            className={`${styles.tabPanel} ${tab === 'html' ? styles.tabPanelVisible : styles.tabPanelHidden}`}
          >
            <div className={styles.pagePreview}>
              <div className={styles.pageHead}>
                <div className={styles.pageTitle}>Introduction</div>
                <div className={styles.copyMdButton}>
                  <IconCopy />
                  <span>Copy Markdown</span>
                </div>
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
            className={`${styles.tabPanel} ${tab === 'llms' ? styles.tabPanelVisible : styles.tabPanelHidden}`}
          >
            <div className={styles.llmsContent}>
              <div className={styles.llmsTitle}># Rspress</div>
              <div className={styles.llmsQuote}>
                Lightning fast static site generator
              </div>
              <div className={styles.llmsH2}>## Docs</div>
              <div className={styles.llmsItem}>
                - <span>[Introduction](/guide/introduction.md)</span>
              </div>
              <div className={styles.llmsItem}>
                - <span>[Quick Start](/guide/getting-started.md)</span>
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
  });
  // bijective: hovering either side frames both the source and its counterpart
  const ringFor = (id: string) => (wiring === id ? true : undefined);
  const targetClass = (id: string, base: string) =>
    `${base} ${ringFor(id) ? styles.wireTarget : ''}`;

  return (
    <div className={`${styles.card} ${styles.autoNavCard}`}>
      <div className={styles.autoNavCode}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderTitle}>
            <IconFile />
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

/* ---------- visual 3: plugin ecosystem + layout slots ---------- */

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

function ExtendVisual({ langPrefix = '' }: { langPrefix?: string }) {
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
            <span>Your plugin</span>
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
        visual={<SsgMdVisual />}
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
        eyebrow={t('homeExtendEyebrow')}
        title={t('homeExtendTitle')}
        description={t('homeExtendDesc')}
        points={[t('homeExtendPoint1'), t('homeExtendPoint2')]}
        linkText={t('homeExtendLink')}
        linkHref={`${prefix}/guide/basic/custom-theme`}
        visual={<ExtendVisual langPrefix={prefix} />}
      />
    </div>
  );
}
