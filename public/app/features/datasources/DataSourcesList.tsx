// Libraries
import React, { FC } from 'react';

// Types
import { DataSourceSettings, LayoutMode } from '@grafana/data';
import { Card, HoverMenu, HoverMenuItem, Tag, useStyles } from '@grafana/ui';
import { css } from '@emotion/css';

export interface Props {
  dataSources: DataSourceSettings[];
  layoutMode: LayoutMode;
}

export const DataSourcesList: FC<Props> = ({ dataSources, layoutMode }) => {
  const styles = useStyles(getStyles);

  return (
    <ul className={styles.list}>
      {dataSources.map((dataSource) => {
        return (
          <li key={dataSource.id}>
            <Card href={`datasources/edit/${dataSource.uid}`}>
              <HoverMenu>
                <HoverMenuItem icon="compass" name="Open in explore" />
                <HoverMenuItem icon="trash-alt" name="Delete" />
              </HoverMenu>
              <Card.Heading>{dataSource.name}</Card.Heading>
              <Card.Figure>
                <img src={dataSource.typeLogoUrl} alt="" height="40px" width="40px" className={styles.logo} />
              </Card.Figure>
              <Card.Meta>
                {[
                  dataSource.typeName,
                  dataSource.url,
                  dataSource.isDefault && <Tag key="default-tag" name={'default'} colorIndex={1} />,
                ]}
              </Card.Meta>
            </Card>
          </li>
        );
      })}
    </ul>
  );
};

export default DataSourcesList;

const getStyles = () => {
  return {
    list: css({
      listStyle: 'none',
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
      // gap: '8px', Add back when legacy support for old Card interface is dropped
    }),
    logo: css({
      objectFit: 'contain',
    }),
  };
};
