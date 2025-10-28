import { NoSSR } from '@rspress/core/runtime';
import { SearchButton, SearchPanel } from '@theme';
import { useState } from 'react';

export function Search() {
  const [focused, setFocused] = useState(false);
  return (
    <>
      <SearchButton setFocused={setFocused} />
      <NoSSR>
        <SearchPanel focused={focused} setFocused={setFocused} />
      </NoSSR>
    </>
  );
}
