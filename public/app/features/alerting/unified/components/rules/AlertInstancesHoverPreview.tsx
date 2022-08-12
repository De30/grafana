import { css } from '@emotion/css';
import React, { FC } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, TagList, useStyles2 } from '@grafana/ui';
import { Alert } from 'app/types/unified-alerting';

import { HoverCard } from '../HoverCard';

import { AlertStateTag } from './AlertStateTag';

interface AlertInstanceHoverPreviewProps {
  instances: Alert[];
}

const AlertInstanceHoverPreview: FC<AlertInstanceHoverPreviewProps> = ({ children, instances }) => {
  const styles = useStyles2(getStyles);

  return (
    <HoverCard
      placement="bottom-end"
      content={
        <AlertInstanceRows>
          {instances.map((alert) => (
            <>
              <div>
                <Icon name="clock-nine" /> {new Date(alert.activeAt).toLocaleString()}
              </div>
              <AlertStateTag state={alert.state} />
              <div className={styles.tagsList}>
                <TagList tags={Object.entries(alert.labels).map((kv) => kv.join('='))} />
              </div>
              <Button icon="compass" size="sm">
                Explore
              </Button>
            </>
          ))}
        </AlertInstanceRows>
      }
    >
      <div>{children}</div>
    </HoverCard>
  );
};

const AlertInstanceRows: FC = ({ children }) => {
  const styles = useStyles2(getStyles);

  return <div className={styles.instancesWrapper}>{children}</div>;
};

function getStyles(theme: GrafanaTheme2) {
  return {
    instancesWrapper: css`
      display: grid;
      grid-template-columns: max-content auto auto auto;

      column-gap: ${theme.spacing(2)};
      row-gap: ${theme.spacing(2)};

      padding: ${theme.spacing(1)};
    `,
    tagsList: css`
      overflow: hidden;
    `,
  };
}

export { AlertInstanceHoverPreview };
