export default () => {
  return (
    <p className="rp-doc">
      这是一段在 tsx 中的内容，不过样式和在文档中的样式一样，比如
      <code>@rspress/core</code>。 但是
      <strong className="rp-not-doc">
        含有 className="rp-not-doc" 的这段文字
      </strong>{' '}
      不会生效
    </p>
  );
};
