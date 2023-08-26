import './DemoBlock.scss';

interface Props {
  title: string;
  children?: React.ReactNode;
}

export default (props: Props) => {
  const { title, children } = props;
  return (
    <div className="rspress-demo-block">
      <div className="rspress-demo-block-title">{title}</div>
      <div className="rspress-demo-block-main">{children}</div>
    </div>
  );
};
