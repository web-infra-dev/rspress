export default () => {
  return (
    <p className="rp-doc">
      This is content in tsx, but the styles are the same as in the
      documentation, such as <code>@rspress/core</code>. However,{' '}
      <strong className="rp-not-doc">
        this text with className="rp-not-doc"
      </strong>{' '}
      will not take effect
    </p>
  );
};
