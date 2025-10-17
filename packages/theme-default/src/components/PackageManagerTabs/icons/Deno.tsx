import type { ComponentProps } from 'react';

export function Deno(props: ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 256 256"
      {...props}
    >
      <circle cx="128" cy="128" r="128" fill="#000" />
      <path
        fill="#FFF"
        d="M71.5 49.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm67 0a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm-36 6a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm25 10a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm-50 4a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm-16 13a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm80-6a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm16 13a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm-15 20a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm-94-7a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm44-16a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z"
      />
      <path
        fill="#FFF"
        d="M128 144c-46.4 0-84 37.6-84 84v28h168v-28c0-46.4-37.6-84-84-84Z"
      />
    </svg>
  );
}
