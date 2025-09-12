import { CodeBlockRuntime, type CodeBlockRuntimeProps } from '@theme';
import { useRef } from 'react';
import styles from './LiveCodeEditor.module.scss';

export interface LiveCodeEditorProps
  extends Omit<CodeBlockRuntimeProps, 'code' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function LiveCodeEditor({
  value,
  onChange,
  disabled,
  ...rest
}: LiveCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className={styles.editorContainer}>
      <div className={`${styles.codeBlockWrapper} rp-force-wrap`}>
        <CodeBlockRuntime {...rest} code={value} />
        {!disabled && (
          <textarea
            name="live-code-editor"
            ref={textareaRef}
            className={styles.codeInput}
            value={value}
            onChange={e => onChange(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="Live code editor"
          />
        )}
      </div>
    </div>
  );
}
