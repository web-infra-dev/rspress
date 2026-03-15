import type { ComponentProps, ComponentType, ReactNode } from 'react';
import clsx from 'clsx';
import { slug } from 'github-slugger';
import { isDataUrl, isExternalUrl } from '@rspress/shared';
import siteData from 'virtual-site-data';
import { normalizeImagePath } from '../utils';
import { Badge } from '../../theme/components/Badge/index';
import { Callout } from '../../theme/components/Callout/index';
import { Steps } from '../../theme/components/Steps/index';
import {
  parseInlineMarkdownText,
  renderHtmlOrText,
  renderInlineMarkdown,
} from '../../theme/logic/utils';

export { Badge, Callout, Steps, renderHtmlOrText, renderInlineMarkdown, parseInlineMarkdownText };

export type LinkProps = ComponentProps<'a'> & {
  href?: string;
};

export function Link({
  href = '/',
  className,
  children,
  ...rest
}: LinkProps) {
  const normalizedHref = normalizeRscHref(href);

  return (
    <a {...rest} className={clsx('rp-link', className)} href={normalizedHref}>
      {children}
    </a>
  );
}

export interface ButtonProps {
  type?: string;
  size?: 'medium' | 'big';
  theme?: 'brand' | 'alt';
  href?: string;
  className?: string;
  children?: ReactNode;
  dangerouslySetInnerHTML?: {
    __html: string;
  };
}

export function Button({
  type,
  theme = 'brand',
  size = 'big',
  href = '/',
  className,
  children,
  dangerouslySetInnerHTML,
}: ButtonProps) {
  const buttonClassName = clsx(
    'rp-button',
    `rp-button--${theme}`,
    `rp-button--${size}`,
    className,
  );

  if (type === 'button') {
    return (
      <button className={buttonClassName} type="button" {...dangerouslySetInnerHTML}>
        {children}
      </button>
    );
  }

  return (
    <Link
      className={buttonClassName}
      href={href}
      {...dangerouslySetInnerHTML}
    >
      {children}
    </Link>
  );
}

export type CodeBlockProps = {
  title?: string;
  lang?: string;
  wrapCode?: boolean;
  lineNumbers?: boolean;
  containerElementClassName?: string;
  children?: ReactNode;
};

export function CodeBlock({
  title,
  lang = 'txt',
  lineNumbers = false,
  containerElementClassName,
  children,
}: CodeBlockProps) {
  return (
    <div
      className={clsx(
        'rp-codeblock',
        `language-${lang}`,
        containerElementClassName,
      )}
    >
      {title ? <div className="rp-codeblock__title">{title}</div> : null}
      <div
        className={clsx(
          'rp-codeblock__content',
          lineNumbers && 'rp-codeblock__content--line-numbers',
        )}
      >
        <div className="rp-codeblock__content__scroll-container rp-scrollbar rp-scrollbar--always">
          {children}
        </div>
      </div>
    </div>
  );
}

export const CodeBlockRuntime = CodeBlock;

export function getCustomMDXComponent() {
  return {
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    h5: createHeading(5),
    h6: createHeading(6),
    a: Link,
    img: Img,
    pre: ShikiPre,
  };
}

export function FallbackHeading({
  level,
  title,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
}) {
  const titleSlug = title.trim() ? slug(title.trim()) : '';
  const Element = `h${level}` as const;

  if (!titleSlug) {
    return null;
  }

  return (
    <Element className="rp-toc-include" id={titleSlug}>
      <span {...renderInlineMarkdown(title)} />
      <Link aria-hidden className="rp-header-anchor" href={`#${titleSlug}`}>
        #
      </Link>
    </Element>
  );
}

export function Tag({ tag }: { tag?: string }) {
  if (!tag) {
    return null;
  }

  if (isExternalUrl(tag) || isDataUrl(tag)) {
    return <img alt="" src={tag} />;
  }

  return <Badge text={tag} type="info" />;
}

export function SvgWrapper({
  icon: Icon,
  className,
}: {
  icon: ComponentType<ComponentProps<'svg'>>;
  className?: string;
}) {
  return <Icon className={className} />;
}

export function Tabs({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}

export function Tab({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}

export const PageTabs = Tabs;
export const PageTab = Tab;
export const PackageManagerTabs = Tabs;

export function Search() {
  return null;
}

export const SearchButton = Search;
export const SearchPanel = Search;
export const SwitchAppearance = Search;
export const Banner = Search;
export const HomeBackground = Search;
export const HomeFeature = Search;
export const HomeFooter = Search;
export const HomeHero = Search;
export const HoverGroup = Search;
export const LastUpdated = Search;
export const LlmsContainer = FragmentLike;
export const LlmsCopyButton = Search;
export const LlmsViewOptions = Search;
export const LlmsCopyRow = Search;
export const LlmsOpenRow = Search;
export const Nav = Search;
export const NavHamburger = Search;
export const NavTitle = Search;
export const Outline = Search;
export const Overview = Search;
export const OverviewGroup = Search;
export const PrevNextPage = Search;
export const ReadPercent = Search;
export const Root = FragmentLike;
export const Sidebar = Search;
export const SidebarList = Search;
export const SocialLinks = Search;
export const SourceCode = Search;
export const Toc = Search;
export const DocContent = FragmentLike;
export const DocFooter = Search;
export const EditLink = Search;
export const Layout = FragmentLike;
export const DocLayout = FragmentLike;
export const HomeLayout = FragmentLike;
export const NotFoundLayout = Search;

export function mergeRefs() {}
export function useEditLink() {
  return null;
}
export function useHoverGroup() {
  return null;
}
export function useLinkNavigate() {
  return () => {};
}
export function useMdUrl() {
  return '';
}
export function useActiveAnchor() {
  return '';
}
export function useDynamicToc() {
  return [];
}
export function useWatchToc() {}
export function useFullTextSearch() {
  return null;
}
export function usePrevNextPage() {
  return [];
}
export function useRedirect4FirstVisit() {}
export function useScrollAfterNav() {}
export function useScrollReset() {}
export function useSetup() {}
export function useStorageValue<T>(_: string, defaultValue: T) {
  return [defaultValue, () => {}] as const;
}
export function useThemeState() {
  return {
    theme: 'light',
    setTheme: () => {},
  };
}
export function useReadPercent() {
  return 0;
}

function FragmentLike({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function Img(props: ComponentProps<'img'>) {
  const src = props.src ? normalizeImagePath(props.src) : props.src;
  return <img {...props} src={src} />;
}

function ShikiPre({
  title,
  lang,
  lineNumbers,
  containerElementClassName,
  children,
  ...rest
}: CodeBlockProps & ComponentProps<'pre'>) {
  return (
    <CodeBlock
      containerElementClassName={containerElementClassName}
      lang={lang}
      lineNumbers={lineNumbers}
      title={title}
    >
      <pre {...rest} data-lang={lang} data-title={title}>
        {children}
      </pre>
    </CodeBlock>
  );
}

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const Element = `h${level}` as const;

  return function Heading({
    className,
    children,
    ...rest
  }: ComponentProps<typeof Element>) {
    return (
      <Element className={clsx('rp-toc-include', className)} {...rest}>
        {children}
      </Element>
    );
  };
}

function normalizeRscHref(href: string) {
  if (
    href.startsWith('#') ||
    href.startsWith('./') ||
    href.startsWith('../') ||
    isExternalUrl(href) ||
    isDataUrl(href)
  ) {
    return href;
  }

  const normalizedBase = siteData.base.endsWith('/')
    ? siteData.base.slice(0, -1)
    : siteData.base;
  const normalizedHref = href.startsWith('/') ? href : `/${href}`;

  if (
    normalizedBase &&
    normalizedBase !== '/' &&
    normalizedHref.startsWith(`${normalizedBase}/`)
  ) {
    return normalizedHref;
  }

  return `${normalizedBase}${normalizedHref}`;
}
