import { IconCopy, IconSuccess, SvgWrapper } from '@theme';
import copy from 'copy-to-clipboard';
import { useRef } from 'react';
import './CopyCodeButton.scss';
import { useI18n } from '@rspress/core/runtime';

const timeoutIdMap: Map<HTMLElement, NodeJS.Timeout> = new Map();
const COPIED_CLASS = 'rp-code-copy-button--copied';

function copyCode(
  codeBlockElement: HTMLElement | null,
  copyButtonElement: HTMLButtonElement | null,
) {
  let text = '';
  if (!codeBlockElement) {
    return;
  }
  const walk = document.createTreeWalker(
    codeBlockElement,
    NodeFilter.SHOW_TEXT,
    null,
  );
  let node = walk.nextNode();
  while (node) {
    if (
      !node.parentElement!.classList.contains('linenumber') &&
      !node.parentElement!.closest('.rp-copy-ignore')
    ) {
      text += node.nodeValue;
    }
    node = walk.nextNode();
  }

  const isCopied = copy(text);

  if (isCopied && copyButtonElement) {
    copyButtonElement.classList.add(COPIED_CLASS);
    clearTimeout(timeoutIdMap.get(copyButtonElement));
    const timeoutId = setTimeout(() => {
      copyButtonElement.classList.remove(COPIED_CLASS);
      copyButtonElement.blur();
      timeoutIdMap.delete(copyButtonElement);
    }, 2000);
    timeoutIdMap.set(copyButtonElement, timeoutId);
  }
}

export function CopyCodeButton({
  codeBlockRef,
}: {
  codeBlockRef: React.RefObject<HTMLElement | null>;
}) {
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const t = useI18n();

  return (
    <button
      className="rp-code-button-group__button rp-code-copy-button"
      onClick={() => copyCode(codeBlockRef.current, copyButtonRef.current!)}
      ref={copyButtonRef}
      title={t('codeButtonGroupCopyButtonText')}
    >
      <SvgWrapper
        icon={IconCopy}
        className="rp-code-button-group__icon rp-code-copy-button__icon rp-code-copy-button__icon--copy"
      />
      <SvgWrapper
        icon={IconSuccess}
        className="rp-code-button-group__icon rp-code-copy-button__icon rp-code-copy-button__icon--success"
      />
    </button>
  );
}
