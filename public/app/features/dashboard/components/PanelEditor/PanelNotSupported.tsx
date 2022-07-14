import React, { useCallback } from 'react';

import { locationService } from '@grafana/runtime';
import { Button, Layout, VerticalGroup } from '@grafana/ui';

import { PanelEditorTabId } from './types';

export interface Props {
  message: string;
}

export function PanelNotSupported({ message }: Props): JSX.Element {
  const onBackToQueries = useCallback(() => {
    locationService.partial({ tab: PanelEditorTabId.Query });
  }, []);

  return (
    <Layout justify="center" style={{ marginTop: '100px' }}>
      <VerticalGroup spacing="md">
        <h2>{message}</h2>
        <div>
          <Button size="md" variant="secondary" icon="arrow-left" onClick={onBackToQueries}>
            Go back to Queries
          </Button>
        </div>
      </VerticalGroup>
    </Layout>
  );
}
