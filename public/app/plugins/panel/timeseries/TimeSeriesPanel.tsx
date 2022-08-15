import React, { useMemo } from 'react';

import { Field, PanelProps } from '@grafana/data';
import { getDataSourceSrv, PanelDataErrorView } from '@grafana/runtime';
import { TooltipDisplayMode } from '@grafana/schema';
import { usePanelContext, TimeSeries, TooltipPlugin, ZoomPlugin, KeyboardPlugin } from '@grafana/ui';
import { config } from 'app/core/config';
import { getFieldLinksForExplore } from 'app/features/explore/utils/links';

import { AnnotationEditorPlugin } from './plugins/AnnotationEditorPlugin';
import { AnnotationsPlugin } from './plugins/AnnotationsPlugin';
import { ContextMenuPlugin } from './plugins/ContextMenuPlugin';
import { CorrelationsPlugin } from './plugins/CorrelationsPlugin';
import { ExemplarsPlugin } from './plugins/ExemplarsPlugin';
import { OutsideRangePlugin } from './plugins/OutsideRangePlugin';
import { ThresholdControlsPlugin } from './plugins/ThresholdControlsPlugin';
import { TimeSeriesOptions } from './types';
import { getTimezones, prepareGraphableFields } from './utils';

interface TimeSeriesPanelProps extends PanelProps<TimeSeriesOptions> {}

export const TimeSeriesPanel: React.FC<TimeSeriesPanelProps> = ({
  data,
  timeRange,
  timeZone,
  width,
  height,
  options,
  fieldConfig,
  onChangeTimeRange,
  replaceVariables,
  id,
}) => {
  const { sync, canAddAnnotations, canCorrelate, onThresholdsChange, canEditThresholds, onSplitOpen } =
    usePanelContext();

  const getFieldLinks = (field: Field, rowIndex: number) => {
    return getFieldLinksForExplore({ field, rowIndex, splitOpenFn: onSplitOpen, range: timeRange });
  };

  const frames = useMemo(() => prepareGraphableFields(data.series, config.theme2, timeRange), [data, timeRange]);
  const timezones = useMemo(() => getTimezones(options.timezones, timeZone), [options.timezones, timeZone]);

  if (!frames) {
    return (
      <PanelDataErrorView
        panelId={id}
        fieldConfig={fieldConfig}
        data={data}
        needsTimeField={true}
        needsNumberField={true}
      />
    );
  }

  const enableCorrelation = Boolean(canCorrelate && canCorrelate());
  const correlationDataSources = enableCorrelation ? getDataSourceSrv().getList({ correlations: true }) : [];
  const enableAnnotationCreation = Boolean(canAddAnnotations && canAddAnnotations());

  return (
    <TimeSeries
      frames={frames}
      structureRev={data.structureRev}
      timeRange={timeRange}
      timeZones={timezones}
      width={width}
      height={height}
      legend={options.legend}
      options={options}
    >
      {(config, alignedDataFrame) => {
        return (
          <>
            <KeyboardPlugin config={config} />
            <ZoomPlugin config={config} onZoom={onChangeTimeRange} />
            {options.tooltip.mode === TooltipDisplayMode.None || (
              <TooltipPlugin
                frames={frames}
                data={alignedDataFrame}
                config={config}
                mode={options.tooltip.mode}
                sortOrder={options.tooltip.sort}
                sync={sync}
                timeZone={timeZone}
              />
            )}
            {/* Renders annotation markers*/}
            {data.annotations && (
              <AnnotationsPlugin annotations={data.annotations} config={config} timeZone={timeZone} />
            )}
            {enableCorrelation && onSplitOpen ? (
              <CorrelationsPlugin data={alignedDataFrame} config={config} splitOpenFn={onSplitOpen}>
                {({ startCorrelating, onOpen, onClose }) => {
                  return (
                    <ContextMenuPlugin
                      data={alignedDataFrame}
                      config={config}
                      timeZone={timeZone}
                      replaceVariables={replaceVariables}
                      onOpen={onOpen}
                      onClose={onClose}
                      defaultItems={[
                        {
                          items: correlationDataSources.map((datasource) => ({
                            label: `Find correlated series using ${datasource.name}`,
                            ariaLabel: `Find correlated series using ${datasource.name}`,
                            icon: 'graph-bar',
                            onClick: (e, p) => {
                              if (!p) {
                                return;
                              }
                              startCorrelating({ coords: p.coords, datasource });
                            },
                          })),
                        },
                      ]}
                    />
                  );
                }}
              </CorrelationsPlugin>
            ) : null}
            {/* Enables annotations creation*/}
            {enableAnnotationCreation ? (
              <AnnotationEditorPlugin data={alignedDataFrame} timeZone={timeZone} config={config}>
                {({ startAnnotating }) => {
                  return (
                    <ContextMenuPlugin
                      data={alignedDataFrame}
                      config={config}
                      timeZone={timeZone}
                      replaceVariables={replaceVariables}
                      defaultItems={[
                        {
                          items: [
                            {
                              label: 'Add annotation',
                              ariaLabel: 'Add annotation',
                              icon: 'comment-alt',
                              onClick: (e, p) => {
                                if (!p) {
                                  return;
                                }
                                startAnnotating({ coords: p.coords });
                              },
                            },
                          ],
                        },
                      ]}
                    />
                  );
                }}
              </AnnotationEditorPlugin>
            ) : // <ContextMenuPlugin
            //   data={alignedDataFrame}
            //   frames={frames}
            //   config={config}
            //   timeZone={timeZone}
            //   replaceVariables={replaceVariables}
            //   defaultItems={[]}
            // />
            null}
            {data.annotations && (
              <ExemplarsPlugin
                config={config}
                exemplars={data.annotations}
                timeZone={timeZone}
                getFieldLinks={getFieldLinks}
              />
            )}

            {canEditThresholds && onThresholdsChange && (
              <ThresholdControlsPlugin
                config={config}
                fieldConfig={fieldConfig}
                onThresholdsChange={onThresholdsChange}
              />
            )}

            <OutsideRangePlugin config={config} onChangeTimeRange={onChangeTimeRange} />
          </>
        );
      }}
    </TimeSeries>
  );
};
