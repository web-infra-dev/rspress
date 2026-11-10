import { useI18n, useSearchHooks } from '@rspress/core/runtime';
import { useState } from 'react';

export default function VirtualProbe() {
  const t = useI18n<{ virtualProbe: string }>();
  const searchHooks = useSearchHooks();
  const [count, setCount] = useState(0);
  return (
    <div data-testid="virtual-probe">
      <span>{t('virtualProbe')}</span>
      {searchHooks.render?.({}) ?? <span>No custom renderer</span>}
      <button type="button" onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
