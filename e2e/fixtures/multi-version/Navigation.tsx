import { useNavigate, usePageData } from '@rspress/core/runtime';

export default function Navigation() {
  const navigate = useNavigate();
  const { page } = usePageData();
  return (
    <div>
      <button type="button" onClick={() => navigate('/v2/missing')}>
        Missing versioned page
      </button>
      <button type="button" onClick={() => navigate('/v2/zh/missing')}>
        Missing localized page
      </button>
      <output data-testid="page-context">
        {page.version}|{page.lang}
      </output>
    </div>
  );
}
