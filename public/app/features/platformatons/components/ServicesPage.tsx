import React, { useState } from 'react';

import { config } from '@grafana/runtime/src';
import { Alert, Tab, TabsBar, TabContent } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { useNavModel } from '../../../core/hooks/useNavModel';

import { Services } from './Services';

const initialTabs = [
  {
    label: 'Services',
    active: true,
  },
];

const ServicesPage = () => {
  const navModel = useNavModel('services');

  const [tabs, setTabs] = useState(initialTabs);

  if (!config.featureToggles.panelTitleSearch) {
    return <Alert title="Missing feature toggle: panelTitleSearch">Query library requires searchV2</Alert>;
  }

  return (
    <Page navModel={navModel}>
      <Page.Contents>
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
        <TabContent>{tabs[0].active && <Services />}</TabContent>
      </Page.Contents>
    </Page>
  );
};

export default ServicesPage;
