import { useLang } from '@rspress/core/runtime';
import {
  copyToClipboard,
  IconArrowRight,
  IconCopy,
  IconSuccess,
  Link,
  SvgWrapper,
} from '@rspress/core/theme-original';
import { useState } from 'react';
import heroImage from '../../assets/blackMythHero.jpg';
import chapterImage from '../../assets/blackMythChapters.jpg';

const copy = {
  zh: {
    title: ['落笔成章', '疾速成站'],
    subtitle: 'Rspress · 快如闪电的静态站点生成器',
    description: ['以 Markdown 为卷，以 React 为法。', '面向人，也面向 AI。'],
    start: '开始修行',
    intro: '了解 Rspress',
    explore: '向下探索',
    theme: '黑神话 · 文档之境',
    journal: '修行手札',
    pause: '静止画面',
    resume: '开启动效',
    motion: '背景动效',
    copy: '复制创建命令',
    copied: '已复制',
    failed: '复制失败，请手动选择命令',
    features: [
      ['极速构建', '基于 Rust 工具链，带来疾速构建与流畅的开发体验。'],
      ['自在书写', '用 Markdown 与 React，专注内容创作，让表达更自由。'],
      ['万象皆可扩展', '丰富的插件与主题生态，轻松打造属于你的文档站点。'],
    ],
    chaptersTitle: '一卷在手，万象皆通。',
    chaptersDescription: '从第一行文字，到完整的知识世界。',
    chapters: [
      ['起步 · 从此启程', '从零开始，创建你的第一个 Rspress 站点。'],
      ['书写 · 让内容生长', '使用 Markdown 与 React 编写高质量文档。'],
      ['神通 · 拓展你的站点', '通过插件，解锁内容与构建的更多可能。'],
      ['匠心 · 定制独有气韵', '深度定制主题，打造专属的阅读体验。'],
    ],
    closing: '执笔，启程。',
    create: '创建你的文档站点',
  },
  en: {
    title: ['Write your story.', 'Build at light speed.'],
    subtitle: 'Rspress · Lightning-fast static site generator',
    description: [
      'Markdown is your canvas. React is your craft.',
      'Made for humans. Understood by AI.',
    ],
    start: 'Begin your journey',
    intro: 'Discover Rspress',
    explore: 'Explore below',
    theme: 'BLACK MYTH · THE ART OF DOCS',
    journal: 'The field guide',
    pause: 'Pause motion',
    resume: 'Enable motion',
    motion: 'Background motion',
    copy: 'Copy create command',
    copied: 'Copied',
    failed: 'Copy failed. Select the command to copy it manually.',
    features: [
      [
        'Built for speed',
        'A Rust-powered toolchain for fast builds and a fluid development experience.',
      ],
      [
        'Freedom to create',
        'Write with Markdown and React. Stay focused on the story you want to tell.',
      ],
      [
        'Endless possibilities',
        'Make your documentation your own with flexible plugins and themes.',
      ],
    ],
    chaptersTitle: 'One page. A world of possibility.',
    chaptersDescription: 'From your first words to a whole world of knowledge.',
    chapters: [
      [
        'Begin · Take the first step',
        'Create your first Rspress site, from the ground up.',
      ],
      [
        'Write · Bring ideas to life',
        'Compose rich documentation with Markdown and React.',
      ],
      [
        'Extend · Go beyond',
        'Unlock new possibilities with the plugin ecosystem.',
      ],
      [
        'Craft · Make it your own',
        'Shape a distinctive reading experience with custom themes.',
      ],
    ],
    closing: 'Your next chapter awaits.',
    create: 'Create your documentation',
  },
};
const chapterPaths = [
  '/guide/start/getting-started',
  '/guide/use-mdx/components',
  '/plugin/system/introduction',
  '/guide/basic/custom-theme',
];
const featurePaths = [
  '/guide/start/introduction',
  '/guide/use-mdx/components',
  '/guide/basic/custom-theme',
];

function Arrow() {
  return <SvgWrapper icon={IconArrowRight} width={20} height={20} />;
}

export function MythNavTitle() {
  const zh = useLang() === 'zh';
  return (
    <Link
      href={zh ? '/zh/' : '/'}
      className="myth-brand"
      aria-label={zh ? 'Rspress 首页' : 'Rspress home'}
    >
      <span className="myth-seal" aria-hidden="true">
        文<br />道
      </span>
      <span>Rspress</span>
    </Link>
  );
}

export function MythSidebarTitle() {
  const zh = useLang() === 'zh';
  return (
    <div className="myth-journal">
      <span aria-hidden="true">卷</span>
      {zh ? copy.zh.journal : copy.en.journal}
    </div>
  );
}

function CreateCommand() {
  const zh = useLang() === 'zh';
  const t = zh ? copy.zh : copy.en;
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const command = 'npm create rspress@latest';
  return (
    <div className="myth-command-wrap">
      <div className="myth-command">
        <span aria-hidden="true">$</span>
        <code>{command}</code>
        <button
          type="button"
          aria-label={t.copy}
          title={t.copy}
          onClick={async () => {
            const success = await copyToClipboard(command);
            setStatus(success ? 'copied' : 'failed');
          }}
        >
          <SvgWrapper
            icon={status === 'copied' ? IconSuccess : IconCopy}
            width={18}
            height={18}
          />
        </button>
      </div>
      <span className="myth-copy-status" role="status">
        {status === 'copied' ? t.copied : status === 'failed' ? t.failed : ''}
      </span>
    </div>
  );
}

export function BlackMythHome() {
  const zh = useLang() === 'zh';
  const t = zh ? copy.zh : copy.en;
  const prefix = zh ? '/zh' : '';
  const [paused, setPaused] = useState(false);
  // SSG-MD gets semantic content without decorative imagery or motion controls.
  if (import.meta.env.SSG_MD) {
    return (
      <article>
        <h1>Rspress</h1>
        <p>{t.subtitle}</p>
        <p>{t.description.join(' ')}</p>
        <p>
          <Link href={`${prefix}${chapterPaths[0]}`}>{t.start}</Link>
        </p>
        <pre>
          <code>npm create rspress@latest</code>
        </pre>
        {t.features.map(([title, description], index) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
            <p>
              <Link href={`${prefix}${featurePaths[index]}`}>{title}</Link>
            </p>
          </section>
        ))}
        <h2>{t.chaptersTitle}</h2>
        <p>{t.chaptersDescription}</p>
        <ul>
          {t.chapters.map(([title, description], index) => (
            <li key={title}>
              <Link href={`${prefix}${chapterPaths[index]}`}>{title}</Link>:{' '}
              {description}
            </li>
          ))}
        </ul>
      </article>
    );
  }
  return (
    <main
      id="myth-home"
      className={`myth-home${zh ? ' myth-home--zh' : ''}`}
      data-motion={paused ? 'paused' : 'playing'}
    >
      <section className="myth-hero" aria-labelledby="myth-title">
        <img
          className="myth-hero__art"
          src={heroImage}
          alt=""
          width={1672}
          height={941}
          fetchPriority="high"
        />
        <div className="myth-embers" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="myth-hero__content">
          <h1 id="myth-title">
            {t.title.map(line => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className="myth-hero__subtitle">{t.subtitle}</p>
          <p className="myth-hero__description">
            {t.description.map(line => (
              <span key={line}>{line}</span>
            ))}
          </p>
          <div className="myth-actions">
            <Link
              className="myth-button myth-button--gold"
              href={`${prefix}${chapterPaths[0]}`}
            >
              {t.start}
              <Arrow />
            </Link>
            <Link
              className="myth-button"
              href={`${prefix}/guide/start/introduction`}
            >
              {t.intro}
            </Link>
          </div>
          <CreateCommand />
        </div>
        <span className="myth-hero__inscription" aria-hidden="true">
          {t.theme}
          <span className="myth-seal">
            文<br />道
          </span>
        </span>
        <a className="myth-explore" href="#myth-chapters">
          {t.explore}
          <span aria-hidden="true" />
          <SvgWrapper icon={IconArrowRight} width={16} height={16} />
        </a>
        <button
          className="myth-motion"
          type="button"
          aria-label={t.motion}
          aria-pressed={!paused}
          onClick={() => setPaused(value => !value)}
        >
          <span aria-hidden="true" className="myth-motion__mark">
            {paused ? '◇' : 'Ⅱ'}
          </span>
          {paused ? t.resume : t.pause}
        </button>
      </section>
      <section
        className="myth-features"
        aria-label={zh ? 'Rspress 特性' : 'Rspress features'}
      >
        {t.features.map(([title, description], index) => (
          <Link
            href={`${prefix}${featurePaths[index]}`}
            className="myth-feature"
            key={title}
          >
            <span className="myth-feature__number" aria-hidden="true">
              {['壹', '贰', '叁'][index]}
            </span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </Link>
        ))}
      </section>
      <section
        className="myth-chapters"
        id="myth-chapters"
        aria-labelledby="myth-chapters-title"
      >
        <img
          className="myth-chapters__art"
          src={chapterImage}
          alt=""
          width={1584}
          height={992}
          loading="lazy"
        />
        <div className="myth-chapters__content">
          <h2 id="myth-chapters-title">{t.chaptersTitle}</h2>
          <p>{t.chaptersDescription}</p>
          <div className="myth-chapters__links">
            {t.chapters.map(([title, description], index) => (
              <Link
                className="myth-chapter"
                href={`${prefix}${chapterPaths[index]}`}
                key={title}
              >
                <div>
                  <span className="myth-chapter__number">0{index + 1}</span>
                  <h3>{title}</h3>
                  <Arrow />
                </div>
                <p>{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="myth-closing" aria-label={t.create}>
        <h2>{t.closing}</h2>
        <Link className="myth-button" href={`${prefix}${chapterPaths[0]}`}>
          {t.create}
          <Arrow />
        </Link>
      </section>
      <footer className="myth-footer">
        <MythNavTitle />
        <span>© 2023-present ByteDance Inc.</span>
        <a href="https://github.com/web-infra-dev/rspress">GitHub</a>
      </footer>
    </main>
  );
}
