import React, { useState } from 'react';
import { useAsync } from 'react-use';

import { Card, LinkButton, VerticalGroup } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { loadAllThemes, CustomThemeDTO } from './state';

interface State {
  themes: CustomThemeDTO[];
}

export function ThemeListPage() {
  const [state, setState] = useState<State>({ themes: [] });

  useAsync(async () => {
    const result = await loadAllThemes();
    setState({ themes: result });
  }, []);

  const actions = [
    <LinkButton href="themes/new" variant="primary" key="new">
      New theme
    </LinkButton>,
  ];

  return (
    <Page navId="themes" actions={actions}>
      <VerticalGroup spacing="none">
        {state.themes.map((theme) => (
          <Card key={theme.uid}>
            <Card.Heading>{theme.name}</Card.Heading>
            <Card.Actions>
              <LinkButton href={`themes/${theme.uid}`} variant="secondary">
                Edit
              </LinkButton>
            </Card.Actions>
            <Card.SecondaryActions>
              <LinkButton href={`themes/${theme.uid}?safeMode`} fill="text">
                Open in safe mode
              </LinkButton>
            </Card.SecondaryActions>
          </Card>
        ))}
      </VerticalGroup>
    </Page>
  );
}

export default ThemeListPage;
