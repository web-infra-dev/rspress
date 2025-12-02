// components

export { Badge } from './components/Badge/index';
export { Banner, type BannerProps } from './components/Banner/index';
export { Button } from './components/Button/index';
export { Callout, type CalloutProps } from './components/Callout/index';
export { CodeBlock, type CodeBlockProps } from './components/CodeBlock/index';
export {
  CodeBlockRuntime,
  type CodeBlockRuntimeProps,
} from './components/CodeBlockRuntime/index';
export {
  CodeButtonGroup,
  type CodeButtonGroupProps,
  useCodeButtonGroup,
} from './components/CodeButtonGroup';
export { getCustomMDXComponent } from './components/DocContent/docComponents/index';
// layout
export type { ShikiPreProps } from './components/DocContent/docComponents/pre';
export { DocContent } from './components/DocContent/index';
export { DocFooter } from './components/DocFooter/index';
export { EditLink } from './components/EditLink/index';
export { useEditLink } from './components/EditLink/useEditLink';
export { FallbackHeading } from './components/FallbackHeading/index';
export { HomeBackground } from './components/HomeBackground/index';
export { HomeFeature } from './components/HomeFeature/index';
export { HomeFooter } from './components/HomeFooter/index';
export { HomeHero, type HomeHeroProps } from './components/HomeHero/index';
export { HoverGroup, type HoverGroupProps } from './components/HoverGroup';
export { useHoverGroup } from './components/HoverGroup/useHoverGroup';
export { LastUpdated } from './components/LastUpdated/index';
export { Link, type LinkProps } from './components/Link/index';
export { useLinkNavigate } from './components/Link/useLinkNavigate';
export { Nav, type NavProps } from './components/Nav/index';
export { NavHamburger } from './components/NavHamburger/index';
export { Outline } from './components/Outline/index';
export { Overview } from './components/Overview/index';
export {
  type Group,
  type GroupItem,
  OverviewGroup,
} from './components/Overview/OverviewGroup';
export {
  type PackageManagerTabProps,
  PackageManagerTabs,
} from './components/PackageManagerTabs/index';
export {
  PageTab,
  type PageTabProps,
  PageTabs,
  type PageTabsProps,
} from './components/PageTabs/index';
export { PrevNextPage } from './components/PrevNextPage/index';
export { ReadPercent } from './components/ReadPercent/index';
export { Search } from './components/Search/index';
export type {
  AfterSearch,
  BeforeSearch,
  CustomMatchResult,
  DefaultMatchResult,
  DefaultMatchResultItem,
  HighlightInfo,
  MatchResult,
  OnSearch,
  PageSearcherConfig,
  RenderSearchFunction,
  SearchOptions,
  UserMatchResultItem,
} from './components/Search/logic/types';
export { RenderType } from './components/Search/logic/types';
export {
  SearchButton,
  type SearchButtonProps,
} from './components/Search/SearchButton';
export {
  SearchPanel,
  type SearchPanelProps,
} from './components/Search/SearchPanel';
export { Sidebar, SidebarList } from './components/Sidebar/index';
export { SocialLinks } from './components/SocialLinks/index';
export { SourceCode } from './components/SourceCode/index';
export { Steps } from './components/Steps/index';
export { SvgWrapper } from './components/SvgWrapper/index';
export { SwitchAppearance } from './components/SwitchAppearance/index';
export { Tab, Tabs } from './components/Tabs/index';
export { Tag } from './components/Tag/index';
export { Toc } from './components/Toc';
export { useActiveAnchor } from './hooks/useActiveAnchor';
export { useDynamicToc, useWatchToc } from './hooks/useDynamicToc';
export { DocLayout, type DocLayoutProps } from './layout/DocLayout';
export { HomeLayout, type HomeLayoutProps } from './layout/HomeLayout/index';
export { Layout, type LayoutProps } from './layout/Layout/index';
export { NotFoundLayout } from './layout/NotFountLayout/index';
export { mergeRefs } from './logic/mergeRefs';
export { useThemeState } from './logic/useAppearance';
export { useFullTextSearch } from './logic/useFullTextSearch';
// logic
export { usePrevNextPage } from './logic/usePrevNextPage';
export { useRedirect4FirstVisit } from './logic/useRedirect4FirstVisit';
export { useSetup } from './logic/useSetup';
export { useStorageValue } from './logic/useStorageValue';
export {
  parseInlineMarkdownText,
  renderHtmlOrText,
  renderInlineMarkdown,
} from './logic/utils';
