import { EditLink, LastUpdated, PrevNextPage } from '@theme';
import './index.scss';

export function DocFooter() {
  return (
    <footer className="rp-doc-footer">
      <div className="rp-doc-footer__edit">
        <EditLink />
        <LastUpdated />
      </div>
      <div className="rp-doc-footer__divider" />
      <PrevNextPage />
    </footer>
  );
}
