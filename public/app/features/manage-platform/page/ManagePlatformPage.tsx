import React, { useState } from 'react';
import { NavModelItem, SelectableValue, GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { Select, useStyles2, Tab, TabsBar, TabContent, InlineLabel } from '@grafana/ui';

import Page from 'app/core/components/Page/Page';
import { SystemManagement } from './SystemManagement';
import { Console } from './Console';
import { Diagnostics } from './Diagnostics';
import { ImageManagement } from './ImageManagement';

const node: NavModelItem = {
  id: 'manage-platform',
  text: 'GrafanaPie',
  subTitle: 'A Raspberry Pi turbo confabulator',
  icon: 'raspberry',
  url: 'manage-platform',
  img: 'https://www.raspberrypi.org/app/uploads/2018/03/RPi-Logo-Reg-SCREEN.png',
};

const initialTabs = [
  {
    label: 'System',
    active: true,
  },
  {
    label: 'Diagnostics',
    active: false,
  },
  {
    label: 'Images',
    active: false,
  },
  {
    label: 'Console',
    active: false,
  },
];

const PLATFORM_OPTIONS: Array<SelectableValue<string>> = [
  { label: 'Raspberry Pi', value: 'pi' },
  { label: 'Linux', value: 'linux' },
];

const ManagePlatformPage = () => {
  const [tabs, setTabs] = useState(initialTabs);
  const styles = useStyles2(getStyles);

  return (
    <Page navModel={{ node: node, main: node }}>
      <Page.Contents>
        <div className={styles.platformSelection}>
          <InlineLabel className={styles.inlineLabel} width="auto" tooltip="Choose the platform you wish to manage">
            Target platform
          </InlineLabel>
          <Select
            menuShouldPortal
            className={styles.platformSelect}
            options={PLATFORM_OPTIONS}
            value={PLATFORM_OPTIONS[0]}
            onChange={() => {}}
          />
        </div>
        <TabsBar>
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              active={tab.active}
              onChangeTab={() => setTabs(tabs.map((tab, idx) => ({ ...tab, active: idx === index })))}
            />
          ))}
        </TabsBar>
        <TabContent>
          {tabs[0].active && <SystemManagement />}
          {tabs[1].active && <Diagnostics />}
          {tabs[2].active && <ImageManagement />}
          {tabs[3].active && <Console />}
        </TabContent>
      </Page.Contents>
    </Page>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  platformSelection: css`
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
  `,
  platformSelect: css`
    width: 150px !important;
  `,
  inlineLabel: css`
    background: transparent;
  `,
});

export default ManagePlatformPage;
