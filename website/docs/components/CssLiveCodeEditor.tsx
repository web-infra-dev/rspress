import { useCssModification } from './CssModificationContext';
import { LiveCodeEditor } from './LiveCodeEditor';

export interface CssLiveCodeEditorProps {
  styleId: string; // Required - unique ID for this editor
  defaultValue: string; // Required - the default CSS value
  disabled?: boolean;
}

export function CssLiveCodeEditor({
  styleId,
  defaultValue,
  disabled = false,
}: CssLiveCodeEditorProps) {
  const [value, setValue] = useCssModification(styleId, defaultValue);

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
