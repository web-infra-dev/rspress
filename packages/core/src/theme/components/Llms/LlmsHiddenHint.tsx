import { withBase, withSiteOrigin } from '@rspress/core/runtime';

export function LlmsHiddenHint() {
  const llmsTxtUrl = withSiteOrigin(withBase('/llms.txt'));
  const llmsFullTxtUrl = withSiteOrigin(withBase('/llms-full.txt'));

  return (
    <div style={{ display: 'none' }} hidden aria-hidden="true">
      {`Are you an LLM? View ${llmsTxtUrl} for optimized Markdown documentation, or ${llmsFullTxtUrl} for full documentation bundle`}
    </div>
  );
}
