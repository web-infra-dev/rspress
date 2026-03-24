import { useI18n, useSite } from '@rspress/core/runtime';
import {
  EditLink,
  LlmsCopyRow,
  LlmsOpenRow,
  ReadPercent,
  Toc,
  useDynamicToc,
} from '@rspress/core/theme';
import './index.scss';
import { ScrollToTop } from './ScrollToTop';

export function Outline() {
  const t = useI18n();

  const headers = useDynamicToc();
  const {
    site: {
      themeConfig: { enableScrollToTop = true, llmsUI },
    },
  } = useSite();

  if (headers.length === 0) {
    return <></>;
  }

  const placement =
    typeof llmsUI === 'object' ? (llmsUI?.placement ?? 'title') : 'title';

  return (
    <div className="rp-outline">
      <div className="rp-outline__title">
        {t('outlineTitle')}
        <ReadPercent size={14} strokeWidth={2} />
      </div>
      <nav className="rp-outline__toc rp-scrollbar">
        <Toc />
      </nav>
      <div className="rp-outline__divider" />
      <div className="rp-outline__bottom">
        <EditLink isOutline />
        {process.env.ENABLE_LLMS_UI && placement === 'outline' && (
          <>
            <LlmsCopyRow />
            <LlmsOpenRow />
          </>
        )}
        {enableScrollToTop && <ScrollToTop />}
      </div>
    </div>
  );
}
