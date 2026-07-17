import { withBase, withSiteOrigin } from '@rspress/core/runtime';
import { useMdUrl } from './useMdUrl';

export function LlmsHiddenHint() {
  const { pathname } = useMdUrl();
  const llmsTxtUrl = withSiteOrigin(withBase('/llms.txt'));
  const llmsFullTxtUrl = withSiteOrigin(withBase('/llms-full.txt'));
  const pageMdUrl = withSiteOrigin(pathname);

  return (
    <div style={{ display: 'none' }} hidden aria-hidden="true">
      {`Are you an LLM? View ${llmsTxtUrl} for optimized Markdown documentation, or ${llmsFullTxtUrl} for full documentation bundle. This page is also available as Markdown at ${pageMdUrl}`}
    </div>
  );
}
