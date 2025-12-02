import { useSite } from '@rspress/core/runtime';
import { renderHtmlOrText } from '@theme';
import './index.scss';
import { PREFIX } from '../../constant';

export function HomeFooter() {
  const { site } = useSite();
  const { message } = site.themeConfig.footer || {};

  if (!message) {
    return null;
  }

  return (
    <footer className={`${PREFIX}home-footer`}>
      <div className={`${PREFIX}home-footer__container`}>
        <div
          className={`${PREFIX}home-footer__message`}
          {...renderHtmlOrText(message)}
        />
      </div>
    </footer>
  );
}
