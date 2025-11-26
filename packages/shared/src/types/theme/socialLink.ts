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
  mode: 'link' | 'text' | 'img' | 'dom';
  content: string;
}
