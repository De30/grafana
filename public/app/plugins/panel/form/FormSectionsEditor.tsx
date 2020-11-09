import React, { PureComponent } from 'react';
import { css } from 'emotion';
import { FeatureInfoBox, stylesFactory, Button, Icon } from '@grafana/ui';
import { GrafanaTheme, StandardEditorProps, FeatureState } from '@grafana/data';
import { config } from '@grafana/runtime';

import { FormSectionConfig, FormValueConfig, FormPanelOptions } from './types';

type Props = StandardEditorProps<FormSectionConfig[], any, FormPanelOptions>;

export class FormSectionsEditor extends PureComponent<Props> {
  style = getStyles(config.theme);

  constructor(props: Props) {
    super(props);
  }

  onAddSection = () => {
    const empty: FormValueConfig = {
      path: 'enter.path',
    };

    const value = this.props.value ?? [];
    this.props.onChange([...value, { values: [empty] }]);
  };

  renderSection(section: FormSectionConfig) {
    return <div>SECTION</div>;
  }

  render() {
    const sections = this.props.value ?? [];

    return (
      <>
        <FeatureInfoBox title="Writeable fields" featureState={FeatureState.alpha}>
          <p>
            This panel assumes the data source implements a pre-release alpha feature that allows writing values to a
            data source.
          </p>
        </FeatureInfoBox>

        {sections.map(s => {
          return this.renderSection(s);
        })}

        <div>
          <Button onClick={this.onAddSection} variant="secondary">
            <Icon name="plus" /> Add Section
          </Button>
        </div>
      </>
    );
  }
}

const getStyles = stylesFactory((theme: GrafanaTheme) => ({
  editorBox: css`
    label: editorBox;
    border: ${theme.border.width.sm} solid ${theme.colors.border2};
    border-radius: ${theme.border.radius.sm};
    margin: ${theme.spacing.xs} 0;
    width: 100%;
  `,
}));
