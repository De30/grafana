import React, { useState } from 'react';
import { HoverMenu } from './HoverMenu';
import { withCenteredStory } from '../../utils/storybook/withCenteredStory';
import { PanelChrome } from '../PanelChrome';
import { DashboardStoryCanvas } from '../../utils/storybook/DashboardStoryCanvas';
import { VerticalGroup } from '../Layout/Layout';

export default {
  title: 'Buttons/HoverMenu',
  component: HoverMenu,
  decorators: [withCenteredStory],
  parameters: {},
};

export const Examples = () => {
  // const [showMenu, setShowMenu] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  return (
    <DashboardStoryCanvas>
      <VerticalGroup spacing="lg">
        <div>Menu</div>
        {/* <HoverMenu show={true} /> */}

        <div>On hover</div>

        <div ref={setRef} style={{ position: 'relative' }}>
          <HoverMenu triggerRef={ref} />
          <PanelChrome width={300} height={200}>
            {() => {
              return <div>hello</div>;
            }}
          </PanelChrome>
        </div>
      </VerticalGroup>
    </DashboardStoryCanvas>
  );
};
