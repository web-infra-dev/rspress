export * from '@rspress/core/theme-original';
import {
  Search as DefaultSearch,
  LlmsHint as DefaultLlmsHint,
} from '@rspress/core/theme-original';
import { useState } from 'react';

export function Search() {
  const [visible, setVisible] = useState(true);
  return (
    <>
      <button onClick={() => setVisible(!visible)}>
        Toggle search component
      </button>
      {visible && <DefaultSearch />}
    </>
  );
}

export function LlmsHint() {
  const [visible, setVisible] = useState(true);
  return (
    <>
      <button onClick={() => setVisible(!visible)}>
        Toggle Markdown component
      </button>
      {visible && <DefaultLlmsHint />}
    </>
  );
}
