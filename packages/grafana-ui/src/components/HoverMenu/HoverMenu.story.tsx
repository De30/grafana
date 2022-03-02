import React from 'react';
import { HoverMenu, HoverMenuItem, HoverMenuItemDropdown } from './HoverMenu';
import { withCenteredStory } from '../../utils/storybook/withCenteredStory';
import { PanelChrome } from '../PanelChrome';
import { DashboardStoryCanvas } from '../../utils/storybook/DashboardStoryCanvas';
import { getFocusStyles } from '../../themes/mixins';
import { css } from '@emotion/css';
import { useTheme2 } from '../../themes/ThemeContext';
import { Button } from '../Button';
import { Menu } from '../Menu/Menu';
import { MenuItem } from '../Menu/MenuItem';

export default {
  title: 'Buttons/HoverMenu',
  component: HoverMenu,
  decorators: [withCenteredStory],
  parameters: {},
};

export const Examples = () => {
  const theme = useTheme2();
  const focusStyle = css({
    '&:focus-visible': getFocusStyles(theme),
  });

  return (
    <DashboardStoryCanvas>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: 300 }}>
        <div>Menu</div>

        <div>On hover</div>

        <div style={{ position: 'relative' }} tabIndex={0} className={focusStyle}>
          <HoverMenu>
            <HoverMenuItem icon="eye" name="View panel" />
            <HoverMenuItem icon="pen" name="Edit panel" />
            <HoverMenuItem icon="share-alt" name="Share panel" />
            <HoverMenuItemDropdown icon="ellipsis-v" name="Share panel">
              <Menu>
                <MenuItem label="Inspect" icon="info-circle" shortcut="i" />
                <MenuItem label="Explore" icon="compass" shortcut="e" />
                <MenuItem label="Duplicate" icon="bell" shortcut="d" />
                <MenuItem label="Remove" icon="trash-alt" shortcut="r" />
              </Menu>
            </HoverMenuItemDropdown>
          </HoverMenu>
          <PanelChrome width={300} height={200}>
            {() => {
              return <div>hello</div>;
            }}
          </PanelChrome>
        </div>

        <div>Button</div>
        <Button>Focus outside test</Button>
      </div>
    </DashboardStoryCanvas>
  );
};
