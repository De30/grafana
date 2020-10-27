import React, { PureComponent } from 'react';
import appEvents from '../../app_events';
import TopSection from './TopSection';
import BottomSection from './BottomSection';
import config from 'app/core/config';
import { CoreEvents } from 'app/types';
import { Branding } from 'app/core/components/Branding/Branding';
import { Icon } from '@grafana/ui';

const homeUrl = config.appSubUrl || '/';

export class SideMenu extends PureComponent {
  toggleSideMenuSmallBreakpoint = () => {
    appEvents.emit(CoreEvents.toggleSidemenuMobile);
  };

  render() {
    return [
      <div className="sidemenu__left">
        <a href={homeUrl} className="sidemenu__logo" key="logo">
          <Branding.MenuLogo />
        </a>
        <div className="sidemenu__menu">
          <Icon name="bars" />
        </div>
      </div>,
      <TopSection key="topsection" />,
      <BottomSection key="bottomsection" />,
    ];
  }
}
