import { css } from '@emotion/css';
import { formatRelative } from 'date-fns';
import React, { FC } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Button, Card, Icon, TagList, useStyles2 } from '@grafana/ui';
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
        <Stack direction="row" gap={1}>
          {instances.map((alert, index) => (
            <Card key={index} className={styles.cardReset}>
              <Card.Heading>
                <Stack>
                  <AlertStateTag state={alert.state} /> {alert.annotations?.summary}
                </Stack>
                <span>
                  <Icon name="clock-nine" /> {formatRelative(new Date(alert.activeAt), new Date())}
                </span>
              </Card.Heading>
              <Card.Meta>
                <TagList tags={Object.entries(alert.labels).map((kv) => kv.join('='))} />
              </Card.Meta>
              <Card.Actions>
                <Button icon="compass" size="sm">
                  Explore
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </Stack>
      }
    >
      <div>{children}</div>
    </HoverCard>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    cardReset: css`
      margin-bottom: 0;
    `,
  };
}

export { AlertInstanceHoverPreview };
