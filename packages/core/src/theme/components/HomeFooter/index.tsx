import { useSite } from '@rspress/core/runtime';
import { renderHtmlOrText } from '@theme';
import './index.scss';

export function HomeFooter() {
  const { site } = useSite();
  const { message } = site.themeConfig.footer || {};

  if (!message) {
    return null;
  }

  return (
    <footer className="rp-home-footer">
      <div className="rp-home-footer__container">
        <div
          className="rp-home-footer__message"
          {...renderHtmlOrText(message)}
        />
      </div>
    </footer>
  );
}
