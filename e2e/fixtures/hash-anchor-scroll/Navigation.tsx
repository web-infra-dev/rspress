import { useNavigate } from '@rspress/core/runtime';

export default function Navigation() {
  const navigate = useNavigate();

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
    </div>
  );
}
