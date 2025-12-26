import { useState } from 'react';

export default () => {
  const [count, setCount] = useState(0);
  return (
    <p>
      Это компонент из tsx{' '}
      <button onClick={() => setCount(count => count + 1)}>{count}</button>
    </p>
  );
};
