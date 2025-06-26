export interface NavProps {
  beforeNav?: React.ReactNode;
  beforeNavTitle?: React.ReactNode;
  navTitle?: React.ReactNode;
  afterNavTitle?: React.ReactNode;
  afterNavMenu?: React.ReactNode;
}

export function Nav(props: NavProps) {
  const { beforeNavTitle, afterNavTitle, beforeNav, afterNavMenu, navTitle } =
    props;
}
