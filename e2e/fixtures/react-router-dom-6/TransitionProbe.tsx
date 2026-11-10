import { useLocation } from '@rspress/core/runtime';
import { useLinkNavigate } from '@rspress/core/theme';

let ready = false;
let pending: Promise<void> | undefined;

export default function TransitionProbe() {
  const { pathname } = useLocation();
  const navigate = useLinkNavigate();
  if (typeof window !== 'undefined' && pathname === '/slow' && !ready) {
    pending ||= fetch('/transition-gate').then(() => {
      ready = true;
    });
    throw pending;
  }
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100 }}>
      <button
        type="button"
        onClick={() => {
          navigate('/slow.html');
        }}
      >
        Open suspended page
      </button>
      <button type="button" onClick={() => navigate('/scroll.html')}>
        Open scroll page
      </button>
    </div>
  );
}
