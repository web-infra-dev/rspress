import { useEditLink } from '../EditLink/useEditLink';

export function EditLinkRow() {
  const editLinkObj = useEditLink();

  if (!editLinkObj) {
    return null;
  }

  const { text, link } = editLinkObj;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="rp-outline__action-row"
    >
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.442l-3.251.929a.75.75 0 0 1-.924-.924l.929-3.251a1.75 1.75 0 0 1 .443-.757l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L3.463 11.098a.25.25 0 0 0-.063.108l-.558 1.953 1.953-.558a.25.25 0 0 0 .108-.063l8.61-8.61a.25.25 0 0 0 0-.354l-1.086-1.086Z"
        />
      </svg>
      <span>{text}</span>
    </a>
  );
}
