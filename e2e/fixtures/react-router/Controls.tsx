import {
  useLocation,
  useNavigate,
  useNavigation,
  usePageData,
} from '@rspress/core/runtime';
import { useLinkNavigate } from '@rspress/core/theme';
import { useState, useTransition } from 'react';
import './controls.css';

export default function Controls() {
  const navigate = useNavigate();
  const linkNavigate = useLinkNavigate();
  const [isPending, startTransition] = useTransition();
  const transitionNavigate = useLinkNavigate({ startTransition });
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const { page } = usePageData();
  const [completion, setCompletion] = useState('idle');
  const [renderError, setRenderError] = useState(false);
  if (renderError) {
    throw new Error('Error page render fixture');
  }
  return (
    <section
      className="router-controls"
      aria-labelledby="router-controls-title"
    >
      <header className="router-controls__header">
        <h2 id="router-controls-title">React Router</h2>
        <p>Test navigation, loading states, and error recovery.</p>
      </header>
      <div className="router-controls__actions">
        <fieldset>
          <legend>Native navigation</legend>
          <div className="router-controls__buttons">
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
            <button type="button" onClick={() => navigate('/missing')}>
              Native missing
            </button>
            <button
              type="button"
              onClick={() => navigate('/slow#slow-heading')}
            >
              Native anchor
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend>Theme navigation</legend>
          <div className="router-controls__buttons">
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
          </div>
        </fieldset>
        <fieldset>
          <legend>Error recovery</legend>
          <div className="router-controls__buttons">
            <button type="button" onClick={() => setRenderError(true)}>
              Trigger render error
            </button>
          </div>
        </fieldset>
      </div>
      <dl className="router-controls__status">
        <div>
          <dt>Navigation</dt>
          <dd>
            <output data-testid="navigation-state">{navigation.state}</output>
          </dd>
        </div>
        <div>
          <dt>Transition pending</dt>
          <dd>
            <output data-testid="transition-state">{String(isPending)}</output>
          </dd>
        </div>
        <div>
          <dt>Navigation promise</dt>
          <dd>
            <output data-testid="navigation-completion">{completion}</output>
          </dd>
        </div>
        <div className="router-controls__page">
          <dt>Current path / page title</dt>
          <dd>
            <output data-testid="page-state">
              {pathname}|{page.title}
            </output>
          </dd>
        </div>
      </dl>
    </section>
  );
}
