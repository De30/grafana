import { css } from '@emotion/css';
import React from 'react';
import { useSelector } from 'react-redux';

import { GrafanaTheme } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Field, useStyles } from '@grafana/ui';
import { StoreState } from 'app/types';

import { OptionsPaneOptions } from './OptionsPaneOptions';
import { VisualizationButton } from './VisualizationButton';
import { VisualizationSelectPane } from './VisualizationSelectPane';
import { OptionPaneRenderProps } from './types';
import { usePanelLatestData } from './usePanelLatestData';

export const OptionsPane: React.FC<OptionPaneRenderProps> = ({
  plugin,
  panel,
  onFieldConfigsChange,
  onPanelOptionsChanged,
  onPanelConfigChange,
  dashboard,
  instanceState,
}) => {
  const styles = useStyles(getStyles);
  const isVizPickerOpen = useSelector((state: StoreState) => state.panelEditor.isVizPickerOpen);
  const { data } = usePanelLatestData(panel, { withTransforms: true, withFieldConfig: false }, true);

  return (
    <div className={styles.wrapper} aria-label={selectors.components.PanelEditor.OptionsPane.content}>
      {!isVizPickerOpen && (
        <>
          <div className={styles.optionsWrapper}>
            <div className={styles.vizButtonWrapper}>
              <Field label="Visualization">
                <VisualizationButton panel={panel} />
              </Field>
            </div>
            <OptionsPaneOptions
              panel={panel}
              dashboard={dashboard}
              plugin={plugin}
              instanceState={instanceState}
              data={data}
              onFieldConfigsChange={onFieldConfigsChange}
              onPanelOptionsChanged={onPanelOptionsChanged}
              onPanelConfigChange={onPanelConfigChange}
            />
          </div>
        </>
      )}
      {isVizPickerOpen && <VisualizationSelectPane panel={panel} data={data} />}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme) => {
  return {
    wrapper: css`
      height: 100%;
      width: 100%;
      display: flex;
      flex: 1 1 0;
      flex-direction: column;
      border-left: 1px solid ${theme.colors.border1};
      background: ${theme.colors.bg1};
      padding-top: ${theme.spacing.sm};
    `,
    optionsWrapper: css`
      flex-grow: 1;
      min-height: 0;
    `,
    vizButtonWrapper: css`
      padding: ${theme.spacing.sm};
    `,
    legacyOptions: css`
      label: legacy-options;
      .panel-options-grid {
        display: flex;
        flex-direction: column;
      }
      .panel-options-group {
        margin-bottom: 0;
      }
      .panel-options-group__body {
        padding: ${theme.spacing.md} 0;
      }

      .section {
        display: block;
        margin: ${theme.spacing.md} 0;

        &:first-child {
          margin-top: 0;
        }
      }
    `,
  };
};
