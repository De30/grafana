import React from 'react';

import { NavModelItem } from '@grafana/data';
// import { useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/PageNew/Page';

const node: NavModelItem = {
  id: 'platformatons',
  text: 'Platformatons',
  subTitle: 'Platformatons go!',
  url: 'platformatons',
};

const PlatformatonsPage = () => {
  //   const styles = useStyles2(getStyles);

  return (
    <Page navModel={{ node: node, main: node }}>
      <Page.Contents>
        <div>Platformatons</div>
      </Page.Contents>
    </Page>
  );
};

// const getStyles = (theme: GrafanaTheme2) => ({});

export default PlatformatonsPage;
