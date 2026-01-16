import { useCssEntry } from './CssModificationContext';
import { LiveCodeEditor } from './LiveCodeEditor';

export interface CssLiveCodeEditorProps {
  styleId: string;
  defaultValue: string;
  disabled?: boolean;
}

export function CssLiveCodeEditor({
  styleId,
  defaultValue,
  disabled = false,
}: CssLiveCodeEditorProps) {
  const [value, setValue] = useCssEntry(styleId, defaultValue);

  return (
    <LiveCodeEditor
      lang="css"
      value={value}
      disabled={disabled}
      onChange={setValue}
    />
  );
}

export function CssLiveCodeEditorWithDefault({
  styleId,
  defaultValue,
}: {
  styleId: string;
  defaultValue: string;
}) {
  return <CssLiveCodeEditor styleId={styleId} defaultValue={defaultValue} />;
}
