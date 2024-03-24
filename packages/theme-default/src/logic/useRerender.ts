import { useState } from 'react';

export function useRenderer() {
  const [, setState] = useState(0);

  return () => {
    setState(prevState => prevState + 1);
  };
}
