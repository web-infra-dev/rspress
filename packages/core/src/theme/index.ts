// components

export { useI18n } from '../runtime/hooks/useI18n';
export { Badge, type BadgeProps } from './components/Badge/index';
export { Banner, type BannerProps } from './components/Banner/index';
export { Button, type ButtonProps } from './components/Button/index';
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
export {
  LlmsContainer,
  type LlmsContainerProps,
  LlmsCopyButton,
  type LlmsCopyButtonProps,
  LlmsViewOptions,
  type LlmsViewOptionsProps,
  useMdUrl,
} from './components/Llms/index';
export { LlmsCopyRow } from './components/Llms/LlmsCopyRow';
export { LlmsOpenRow } from './components/Llms/LlmsOpenRow';
export { Nav, type NavProps } from './components/Nav/index';
export { NavHamburger } from './components/NavHamburger/index';
export { NavTitle } from './components/NavTitle/index';
export { Outline } from './components/Outline/index';
export { Overview } from './components/Overview/index';
export {
  type Group,
  type GroupItem,
  OverviewGroup,
} from './components/OverviewGroup';
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
export { Prompt, type PromptProps } from './components/Prompt/index';
export { ReadPercent } from './components/ReadPercent/index';
export { useReadPercent } from './components/ReadPercent/useReadPercent';
export { Root, type RootProps } from './components/Root/index';
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
export {
  SourceCode,
  type SourceCodeProps,
} from './components/SourceCode/index';
export { Steps } from './components/Steps/index';
export {
  SvgWrapper,
  type SvgWrapperProps,
} from './components/SvgWrapper/index';
export { SwitchAppearance } from './components/SwitchAppearance/index';
export {
  Tab,
  type TabProps,
  Tabs,
  type TabsProps,
} from './components/Tabs/index';
export { Tag } from './components/Tag/index';
export { Toc } from './components/Toc';
export { useActiveAnchor } from './hooks/useActiveAnchor';
export { useDynamicToc, useWatchToc } from './hooks/useDynamicToc';
// icons
export * from './icons';
// layout
export { DocLayout, type DocLayoutProps } from './layout/DocLayout';
export { HomeLayout, type HomeLayoutProps } from './layout/HomeLayout/index';
export { Layout, type LayoutProps } from './layout/Layout/index';
export { NotFoundLayout } from './layout/NotFountLayout/index';
export { copyToClipboard } from './logic/copyToClipboard';
export { getCopyableText } from './logic/getCopyableText';
// logic
export { mergeRefs } from './logic/mergeRefs';
export { useFullTextSearch } from './logic/useFullTextSearch';
export { usePrevNextPage } from './logic/usePrevNextPage';
export { useRedirect4FirstVisit } from './logic/useRedirect4FirstVisit';
export { useScrollAfterNav } from './logic/useScrollAfterNav';
export { useScrollReset } from './logic/useScrollReset';
export { useSetup } from './logic/useSetup';
export { useStorageValue } from './logic/useStorageValue';
export { useThemeState } from './logic/useThemeState';
export {
  parseInlineMarkdownText,
  renderHtmlOrText,
  renderInlineMarkdown,
} from './logic/utils';
