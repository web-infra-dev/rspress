import {
  registerWebMcpTool,
  useWebMcpTool,
} from '@rspress/plugin-webmcp/runtime';
import { useEffect, useRef, useState } from 'react';

export default function CounterTools() {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useWebMcpTool(
    {
      name: 'fixture_increment_counter',
      title: 'Increment fixture counter',
      description: 'Increment the visible fixture counter by one.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute() {
        countRef.current += 1;
        setCount(countRef.current);
        return { count: countRef.current };
      },
    },
    {},
    [count],
  );

  useEffect(() => {
    const registration = registerWebMcpTool({
      name: 'fixture_reset_counter',
      title: 'Reset fixture counter',
      description: 'Reset the visible fixture counter to zero.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute() {
        countRef.current = 0;
        setCount(0);
        return { count: 0 };
      },
    });
    void registration?.ready.catch(error => {
      console.error('Failed to register fixture_reset_counter', error);
    });
    return registration?.unregister;
  }, []);

  return <div data-testid="webmcp-counter">Counter: {count}</div>;
}
