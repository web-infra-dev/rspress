export default () => {
  return (
    <p className="rp-doc">
      This is content in tsx, but the styles are the same as in the
      documentation, such as <code>@rspress/core</code>. However, this text with
      className="rp-not-doc"
      <code className="rp-not-doc">@rspress/core</code> will not take effect
    </p>
  );
};
