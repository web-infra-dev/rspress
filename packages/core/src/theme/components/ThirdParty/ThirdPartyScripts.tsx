'use client';
export type ScriptEmbed = {
  html?: string | null;
  height?: string | number | null;
  width?: string | number | null;
  children?: React.ReactElement | React.ReactElement[];
};

export default function ThirdPartyScriptEmbed({
  html,
  height = null,
  width = null,
  children,
}: ScriptEmbed) {
  return (
    <>
      {/* insert script children */}
      {children}
      {/* insert html */}
      {html ? (
        <div
          style={{
            height: height != null ? `${height}px` : 'auto',
            width: width != null ? `${width}px` : 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
    </>
  );
}
