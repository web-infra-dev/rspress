import ReactMarkDown from 'react-markdown';

export const renderInlineMarkdown = (text: string) => {
  return (
    // no getCustomMDXComponent, because we don't need styles here
    <ReactMarkDown>{text}</ReactMarkDown>
  );
};
