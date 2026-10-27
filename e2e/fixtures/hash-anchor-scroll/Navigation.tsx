import { useNavigate } from '@rspress/core/runtime';
import { Link, useLinkNavigate } from '@rspress/core/theme';

export default function Navigation() {
  const navigate = useNavigate();
  const navigateLink = useLinkNavigate();

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100 }}>
      <button type="button" onClick={() => navigate('/source')}>
        Open source
      </button>
      <button type="button" onClick={() => navigate('/target')}>
        Open target
      </button>
      <button type="button" onClick={() => navigate('/target#target-heading')}>
        Open target section
      </button>
      <button
        type="button"
        onClick={() => navigate('/target', { preventScrollReset: true })}
      >
        Keep scroll on target
      </button>
      <button type="button" onClick={() => navigateLink('#target-heading')}>
        Navigate to target hash
      </button>
      <button
        type="button"
        onClick={() => navigateLink(`#${encodeURIComponent('编码标题')}`)}
      >
        Navigate to encoded hash
      </button>
      <Link href="#target-heading" onClick={event => event.preventDefault()}>
        Prevent hash navigation
      </Link>
      <Link href="#target-heading" target="_blank">
        Open hash in new tab
      </Link>
    </div>
  );
}
