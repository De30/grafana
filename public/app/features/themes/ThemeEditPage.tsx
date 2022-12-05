import React, { useEffect } from 'react';

import { Button, CodeEditor, Field, FieldSet, HorizontalGroup, Input, Tab, TabContent, TabsBar } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';

import { getThemeEditStateManager } from './state';

interface Props extends GrafanaRouteComponentProps<{ uid: string }> {}

export function ThemeEditPage({ match }: Props) {
  const stateManager = getThemeEditStateManager();
  const { loading, theme, defJson, fullJson, tab } = stateManager.useState();

  useEffect(() => {
    stateManager.loadTheme(match.params.uid);
  }, [match.params.uid, stateManager]);

  return (
    <Page navId="themes" pageNav={stateManager.getPageNav()}>
      <Page.Contents isLoading={loading}>
        <FieldSet label="Theme info">
          <Field label="Theme name" required>
            <Input
              aria-label="Theme name"
              id="name"
              defaultValue={theme.name}
              name="name"
              width={50}
              placeholder="My pink theme"
              onChange={stateManager.onNameChange}
              type="text"
            />
          </Field>
        </FieldSet>

        <div>
          <TabsBar>
            <Tab label="Definition" active={tab === 'def'} onChangeTab={() => stateManager.changeTab('def')} />
            <Tab label="Full" active={tab === 'full'} onChangeTab={() => stateManager.changeTab('full')} />
          </TabsBar>
          <TabContent>
            {tab === 'def' && (
              <CodeEditor
                value={defJson}
                height={600}
                width="100%"
                language="json"
                showMiniMap={false}
                onBlur={stateManager.onCodeBlur}
              />
            )}
            {tab === 'full' && (
              <CodeEditor value={fullJson} height={600} width="100%" language="json" showMiniMap={false} readOnly />
            )}
          </TabContent>
        </div>

        <div className="gf-form-button-row">
          <HorizontalGroup>
            <Button type="submit" size="md" variant="primary" onClick={stateManager.onSave}>
              Save
            </Button>
          </HorizontalGroup>
        </div>
      </Page.Contents>
    </Page>
  );
}

export default ThemeEditPage;
