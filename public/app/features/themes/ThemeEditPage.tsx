import React, { useEffect } from 'react';

import {
  Button,
  CodeEditor,
  ConfirmButton,
  Field,
  FieldSet,
  Input,
  Tab,
  TabContent,
  TabsBar,
  TextArea,
  ThemeDemo,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';

import { getThemeEditStateManager } from './state';

interface Props extends GrafanaRouteComponentProps<{ uid: string }, { safeMode?: boolean }> {}

export function ThemeEditPage({ match, queryParams }: Props) {
  const stateManager = getThemeEditStateManager();
  const { loading, theme, defJson, fullJson, tab } = stateManager.useState();

  useEffect(() => {
    stateManager.loadTheme(match.params.uid, queryParams.safeMode);
    return () => stateManager.reset();
  }, [match.params.uid, queryParams.safeMode, stateManager]);

  const actions = (
    <>
      <ConfirmButton
        confirmText="Delete"
        confirmVariant="destructive"
        onConfirm={stateManager.onDelete}
        closeOnConfirm={true}
      >
        <Button variant="destructive" fill="outline">
          Delete
        </Button>
      </ConfirmButton>
      <Button type="submit" size="md" variant="primary" onClick={stateManager.onSave}>
        Save
      </Button>
    </>
  );

  return (
    <Page navId="themes" pageNav={stateManager.getPageNav()} actions={actions}>
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
          <Field label="Description" required>
            <TextArea
              aria-label="Theme description"
              id="description"
              defaultValue={theme.description ?? ''}
              name="description"
              style={{ maxWidth: '600px' }}
              rows={4}
              placeholder="Description"
              onChange={stateManager.onDescriptionChange}
              type="text"
            />
          </Field>
        </FieldSet>

        <div>
          <TabsBar>
            <Tab label="Definition" active={tab === 'def'} onChangeTab={() => stateManager.changeTab('def')} />
            <Tab label="Full" active={tab === 'full'} onChangeTab={() => stateManager.changeTab('full')} />
            <Tab label="Preview" active={tab === 'preview'} onChangeTab={() => stateManager.changeTab('preview')} />
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
            {tab === 'preview' && <ThemeDemo />}
          </TabContent>
        </div>
      </Page.Contents>
    </Page>
  );
}

export default ThemeEditPage;
