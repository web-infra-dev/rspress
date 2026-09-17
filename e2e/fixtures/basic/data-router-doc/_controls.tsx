import {
  useLocation,
  useNavigate,
  useNavigation,
  usePageData,
} from '@rspress/core/runtime';
import { useLinkNavigate } from '@rspress/core/theme';
import { useState, useTransition } from 'react';

export default function Controls() {
  const navigate = useNavigate();
  const linkNavigate = useLinkNavigate();
  const [isPending, startTransition] = useTransition();
  const transitionNavigate = useLinkNavigate({ startTransition });
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const { page } = usePageData();
  const [completion, setCompletion] = useState('idle');
  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const pending = navigate('/slow');
          setCompletion(
            pending instanceof Promise ? 'pending' : 'missing-promise',
          );
          await pending;
          setCompletion('complete');
        }}
      >
        Native slow
      </button>
      <button type="button" onClick={() => navigate('/fast')}>
        Native fast
      </button>
      <button
        type="button"
        onClick={async () => {
          setCompletion('pending');
          await linkNavigate('/slow');
          setCompletion('complete');
        }}
      >
        Theme slow
      </button>
      <button type="button" onClick={() => navigate('/missing')}>
        Native missing
      </button>
      <button
        type="button"
        onClick={async () => {
          setCompletion('pending');
          await transitionNavigate('/slow');
          setCompletion('complete');
        }}
      >
        Transition slow
      </button>
      <button type="button" onClick={() => navigate('/slow#slow-heading')}>
        Native anchor
      </button>
      <output data-testid="navigation-state">{navigation.state}</output>
      <output data-testid="transition-state">{String(isPending)}</output>
      <output data-testid="navigation-completion">{completion}</output>
      <output data-testid="page-state">
        {pathname}|{page.title}
      </output>
    </div>
  );
}
