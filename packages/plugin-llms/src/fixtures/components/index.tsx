export function List({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
