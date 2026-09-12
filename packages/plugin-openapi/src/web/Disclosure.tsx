import { type ReactNode, useId, useState } from 'react';

interface DisclosureProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  embedded?: boolean;
}

/** Shared disclosure for API schemas and request controls. */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  embedded = false,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  if (import.meta.env.SSG_MD) {
    return (
      <div>
        <p>
          <strong>{title}</strong>
        </p>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`rp-openapi-disclosure${embedded ? ' rp-openapi-disclosure--embedded' : ''}`}
      data-open={open}
    >
      <button
        className="rp-openapi-disclosure__summary"
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen(value => !value)}
      >
        <span className="rp-openapi-disclosure__title">{title}</span>
        <svg
          className="rp-openapi-disclosure__chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 5 7 7-7 7" />
        </svg>
      </button>
      <div
        className="rp-openapi-disclosure__body"
        id={contentId}
        inert={!open}
        aria-hidden={!open}
      >
        <div className="rp-openapi-disclosure__inner">
          <div className="rp-openapi-disclosure__content">{children}</div>
        </div>
      </div>
    </div>
  );
}
