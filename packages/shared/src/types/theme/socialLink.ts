export type SocialLinkIcon =
  | 'lark'
  | 'discord'
  | 'facebook'
  | 'github'
  | 'instagram'
  | 'linkedin'
  | 'slack'
  | 'x'
  | 'youtube'
  | 'wechat'
  | 'qq'
  | 'juejin'
  | 'zhihu'
  | 'bilibili'
  | 'weibo'
  | 'gitlab'
  | 'X'
  | 'bluesky'
  | 'npm'
  | { svg: string };

export interface SocialLink {
  icon: SocialLinkIcon;
  mode: 'link' | 'text' | 'img' | 'dom' | 'github-stars';
  /**
   * For most modes, the URL, text, image path, or raw HTML to render.
   *
   * For `github-stars` mode, the GitHub repository URL
   * (e.g. `https://github.com/web-infra-dev/rspress`). The repository's star
   * count is fetched from the GitHub API and rendered next to the icon.
   */
  content: string;
}
