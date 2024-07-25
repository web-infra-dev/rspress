import { useRef, type MutableRefObject } from 'react';
import copy from 'copy-to-clipboard';
import IconCopy from '@theme-assets/copy';
import IconSuccess from '@theme-assets/success';
import styles from './index.module.scss';
import { SvgWrapper } from '../../../../components/SvgWrapper';

const timeoutIdMap: Map<HTMLElement, NodeJS.Timeout> = new Map();

function copyCode(
  codeBlockElement: HTMLDivElement,
  copyButtonElement: HTMLButtonElement,
) {
  let text = '';
  const walk = document.createTreeWalker(
    codeBlockElement,
    NodeFilter.SHOW_TEXT,
    null,
  );
  let node = walk.nextNode();
  while (node) {
    if (!node.parentElement.classList.contains('linenumber')) {
      text += node.nodeValue;
    }
    node = walk.nextNode();
  }

  const isCopied = copy(text);

  if (isCopied && copyButtonElement) {
    copyButtonElement.classList.add(styles.codeCopied);
    clearTimeout(timeoutIdMap.get(copyButtonElement));
    const timeoutId = setTimeout(() => {
      copyButtonElement.classList.remove(styles.codeCopied);
      copyButtonElement.blur();
      timeoutIdMap.delete(copyButtonElement);
    }, 2000);
    timeoutIdMap.set(copyButtonElement, timeoutId);
  }
}

export function CopyCodeButton({
  codeBlockRef,
}: {
  codeBlockRef: MutableRefObject<HTMLDivElement>;
}) {
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      className={styles.codeCopyButton}
      onClick={() => copyCode(codeBlockRef.current, copyButtonRef.current)}
      ref={copyButtonRef}
      title="Copy code"
    >
      <SvgWrapper icon={IconCopy} className={styles.iconCopy} />
      <SvgWrapper icon={IconSuccess} className={styles.iconSuccess} />
    </button>
  );
}
