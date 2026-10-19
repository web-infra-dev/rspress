import { expect, test } from '@rstest/core';
import { renderToString } from 'react-dom/server';
import { useWebMcp } from './useWebMcp';

test('useWebMcp renders during SSR without browser APIs', () => {
  function Tool() {
    const state = useWebMcp({
      name: 'test',
      description: 'Test',
      execute: () => 'result',
    });
    return <span>{JSON.stringify(state)}</span>;
  }
  expect(renderToString(<Tool />)).toContain(
    '&quot;supported&quot;:false,&quot;registered&quot;:false,&quot;error&quot;:null',
  );
});
