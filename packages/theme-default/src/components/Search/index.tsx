import { NoSSR } from '@rspress/runtime';
import { SearchPanel } from '@theme';
import { SearchButton } from '@theme';
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
