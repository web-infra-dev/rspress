import './DemoBlock.css';

interface Props {
  title: string;
  children?: React.ReactNode;
}

export default (props: Props) => {
  const { title, children } = props;
  return (
    <div className="rp-demo-block">
      <div className="rp-demo-block-title">{title}</div>
      <div className="rp-demo-block-main">{children}</div>
    </div>
  );
};
