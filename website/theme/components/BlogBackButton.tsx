import { useI18n, useLang, useLocation } from '@rspress/core/runtime';
import { Link } from '@rspress/core/theme-original';

export function BlogBackButton() {
  const { pathname } = useLocation();
  const lang = useLang();
  const t = useI18n<typeof import('i18n')>();

  const blogPrefix = lang === 'en' ? '/blog' : `/${lang}/blog`;
  const isBlogSubpage =
    pathname.startsWith(`${blogPrefix}/`) && pathname !== `${blogPrefix}/`;

  if (!isBlogSubpage) {
    return null;
  }

  return (
    <div className="blog-back-button">
      <Link href={`${blogPrefix}/`}>{t('backToBlog')}</Link>
    </div>
  );
}
