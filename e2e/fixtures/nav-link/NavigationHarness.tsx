import { useAwaitedLinkNavigate, useLinkNavigate } from '@rspress/core/theme';
import { useEffect, useState, useTransition } from 'react';

function Navigator() {
  const [hold, setHold] = useState(false);
  const navigate = useAwaitedLinkNavigate(hold ? '/held' : undefined);
  const [pending, startTransition] = useTransition();
  const linkNavigate = useLinkNavigate({ startTransition });

  useEffect(() => {
    Object.assign(window, { awaitedNavigate: navigate, linkNavigate, setHold });
  }, [navigate, linkNavigate]);

  return (
    <output data-testid="pending" data-held={hold}>
      {String(pending)}
    </output>
  );
}

export default function NavigationHarness() {
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    Object.assign(window, { setNavigatorMounted: setMounted });
  }, []);
  return mounted ? <Navigator /> : null;
}
