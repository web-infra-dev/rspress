import { NavigationTools } from './NavigationTools';
import { PageTools } from './PageTools';
import { SearchTools } from './SearchTools';
import { SiteTools } from './SiteTools';

export default function WebMcpRuntime() {
  return (
    <>
      <SiteTools />
      <NavigationTools />
      {import.meta.env.WEBMCP_OPTIONS.markdown && <PageTools />}
      {import.meta.env.WEBMCP_OPTIONS.search && <SearchTools />}
    </>
  );
}
