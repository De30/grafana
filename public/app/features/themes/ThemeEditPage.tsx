import React, { useEffect } from 'react';

import { Button, CodeEditor, CollapsableSection, Field, FieldSet, HorizontalGroup, Input } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';

import { getThemeEditStateManager } from './state';

interface Props extends GrafanaRouteComponentProps<{ uid: string }> {}

export function ThemeEditPage({ match }: Props) {
  const stateManager = getThemeEditStateManager();
  const { loading, theme, code } = stateManager.useState();

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
          {/* <Field label="Type" required>
          <RadioButtonGroup options={typeOptions} value={theme.type} onChange={onTypeChange} />
        </Field>
        <Field label="Shade" required>
          <RadioButtonGroup options={shadeOptions} value={theme.shade} onChange={onModeChange} />
        </Field> */}
        </FieldSet>

        <CollapsableSection label="Theme definition" isOpen={true}>
          <CodeEditor
            value={code}
            height={600}
            width="100%"
            language="json"
            showMiniMap={false}
            onBlur={stateManager.onCodeBlur}
          />
        </CollapsableSection>

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
