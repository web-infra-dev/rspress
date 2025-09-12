import { useNav } from '@rspress/runtime';
import { Search } from '@theme';
import { leftNav, navContainer, rightNav } from './index.module.scss';
import { NavTitle } from './NarTitle';
import { NavMenu } from './NavMenu';

export interface NavProps {
  beforeNav?: React.ReactNode;
  beforeNavTitle?: React.ReactNode;
  navTitle?: React.ReactNode;
  afterNavTitle?: React.ReactNode;

  beforeNavMenu?: React.ReactNode;
  afterNavMenu?: React.ReactNode;
}

export function Nav(props: NavProps) {
  const {
    beforeNavTitle,
    afterNavTitle,
    beforeNav,
    beforeNavMenu,
    afterNavMenu,
    navTitle,
  } = props;
  const navList = useNav();
  return (
    <>
      {beforeNav}
      <header className={navContainer}>
        <div className={leftNav}>
          {beforeNavTitle}
          {navTitle ?? <NavTitle />}
          {afterNavTitle}
        </div>

        <div className={rightNav}>
          {beforeNavMenu}
          <Search />
          <NavMenu menuItems={navList} />
          {afterNavMenu}
        </div>
      </header>
    </>
  );
}
