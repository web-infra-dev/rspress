export default () => {
  return (
    <p className="rp-doc">
      Это содержимое в tsx, но стили такие же, как в документации, например,
      <code>@rspress/core</code>. Однако этот текст с className="rp-not-doc"
      <code className="rp-not-doc">@rspress/core</code> не будет стилизоваться
    </p>
  );
};
