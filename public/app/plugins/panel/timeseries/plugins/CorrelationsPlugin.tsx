import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useMountedState } from 'react-use';
import uPlot from 'uplot';

import {
  AppEvents,
  CartesianCoords2D,
  DataFrame,
  DataQuery,
  DataSourceApi,
  DataSourceInstanceSettings,
  dateTime,
  FieldType,
  SplitOpen,
  TimeZone,
} from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { PlotSelection, UPlotConfigBuilder } from '@grafana/ui';
import { appEvents } from 'app/core/app_events';

import { ContextMenuView } from './ContextMenuPlugin';

type ContextMenuSelectionCoords = { viewport: CartesianCoords2D; plotCanvas: CartesianCoords2D };
type StartCorrelatingFn = (props: {
  // pixel coordinates of the clicked point on the uPlot canvas
  coords: { viewport: CartesianCoords2D; plotCanvas: CartesianCoords2D } | null;
  datasource: DataSourceInstanceSettings;
}) => Promise<void>;

interface CorrelationsPluginProps {
  data: DataFrame;
  config: UPlotConfigBuilder;
  timeZone: TimeZone;
  splitOpenFn: SplitOpen;
  correlationDataSources: DataSourceInstanceSettings[];
  queries?: DataQuery[];
  originalDatasource?: DataSourceApi | null;
  children?: (props: {
    startCorrelating: StartCorrelatingFn;
    onOpen: () => void;
    onClose: () => void;
  }) => React.ReactNode;
}

/**
 * @alpha
 */
export const CorrelationsPlugin: React.FC<CorrelationsPluginProps> = ({
  data,
  splitOpenFn,
  config,
  timeZone,
  correlationDataSources,
  queries,
  originalDatasource,
  children,
}) => {
  const plotInstance = useRef<uPlot>();
  const plotCanvas = useRef<HTMLDivElement>();
  let isOpenRef = useRef(false);
  const onOpen = () => {
    isOpenRef.current = true;
  };
  const onClose = () => {
    isOpenRef.current = false;
  };
  const [seriesIdx, setSeriesIdx] = useState<number | null>(null);
  const [pluginCoords, setPluginCoords] = useState<ContextMenuSelectionCoords | null>(null);
  const [isCorrelating, setIsCorrelating] = useState(false);
  const [isRegionCorrelation, setIsRegionCorrelation] = useState(false);
  const [selection, setSelection] = useState<PlotSelection | null>(null);
  const [bbox, setBbox] = useState<DOMRect>();
  const isMounted = useMountedState();

  const clearSelection = useCallback(() => {
    setSelection(null);

    if (plotInstance.current) {
      plotInstance.current.setSelect({ top: 0, left: 0, width: 0, height: 0 });
    }
    setIsCorrelating(false);
  }, [setIsCorrelating, setSelection]);

  useLayoutEffect(() => {
    let correlating = false;
    let regionCorrelating = false;

    const onMouseCapture = (e: MouseEvent) => {
      let update = {
        viewport: {
          x: e.clientX,
          y: e.clientY,
        },
        plotCanvas: {
          x: 0,
          y: 0,
        },
      };
      if (bbox) {
        update = {
          ...update,
          plotCanvas: {
            x: e.clientX - bbox.left,
            y: e.clientY - bbox.top,
          },
        };
      }
      setPluginCoords(update);
    };

    config.addHook('init', (u) => {
      plotInstance.current = u;
      const canvas = u.over;
      plotCanvas.current = canvas || undefined;
      plotCanvas.current?.addEventListener('mousedown', onMouseCapture);
      // Wrap all setSelect hooks to prevent them from firing if user is correlating
      const setSelectHooks = u.hooks.setSelect;

      if (setSelectHooks) {
        for (let i = 0; i < setSelectHooks.length; i++) {
          const hook = setSelectHooks[i];

          if (hook !== setSelect) {
            setSelectHooks[i] = (...args) => {
              !regionCorrelating && hook!(...args);
            };
          }
        }
      }
    });

    // cache uPlot plotting area bounding box
    config.addHook('syncRect', (u, rect) => {
      if (!isMounted()) {
        return;
      }
      setBbox(rect);
    });

    config.addHook('setSeries', (_, idx) => {
      if (!isOpenRef.current) {
        setSeriesIdx(idx);
      }
    });

    config.setCursor({
      bind: {
        mousedown: (u, targ, handler) => (e) => {
          // We're doing a region correlation if the user has ctrl/cmd+clicked.
          regionCorrelating = e.button === 0 && (e.metaKey || e.ctrlKey);
          // We're doing some kind of correlation either way.
          correlating = e.button === 0;
          handler(e);
          return null;
        },
        mouseup: (u, targ, handler) => (e) => {
          if (correlating && u.select.width === 0) {
            // uPlot will not fire setSelect hooks for 0-width && 0-height selections
            // so we force it to fire on single-point clicks by mutating left & height
            u.select.left = u.cursor.left!;
            u.select.height = u.bbox.height / window.devicePixelRatio;
          }
          handler(e);
          return null;
        },
      },
    });

    // This is called after the `mouseup` handler. We need to update the selection either way,
    // because the startCorrelating callback uses it when the rendered menu item is clicked.
    const setSelect = (u: uPlot) => {
      if (correlating || regionCorrelating) {
        // Update the component's state so that we know whether we should display a menu item or not.
        // For region correlations we should; for non-region correlations it'll be handled by
        // a child component.
        setIsCorrelating(correlating);
        setIsRegionCorrelation(regionCorrelating);
        const selection = {
          min: u.posToVal(u.select.left, 'x'),
          max: u.posToVal(u.select.left + u.select.width, 'x'),
          bbox: {
            left: u.select.left,
            top: 0,
            height: u.select.height,
            width: u.select.width,
          },
        };
        setSelection(selection);
        correlating = false;
        regionCorrelating = false;
      }
    };

    config.addHook('setSelect', setSelect);
  }, [config, bbox, setBbox, setPluginCoords, isMounted, isOpenRef, setSeriesIdx]);

  // Callback used when the menu item is clicked.
  const startCorrelating = useCallback<StartCorrelatingFn>(
    async ({ coords, datasource }) => {
      if (!plotInstance.current || !bbox || !coords) {
        return;
      }
      if (!selection) {
        return;
      }
      const { min, max } = selection;
      if (!min) {
        return;
      }

      // Get the datasource that should perform the correlations.
      const dataSourceSrv = getDataSourceSrv();
      const ds = await dataSourceSrv.get(datasource.uid);

      // If seriesIdx is set, we should use it - this means that a user has clicked on a series directly.
      // If not, we can use the only number field if the data only has one non-hidden field.
      // This will likely be the case in region correlations.
      const seriesIdxToUse =
        seriesIdx ??
        (data.fields.filter((f) => f.type === FieldType.number && !f.config.custom.hideFrom.viz).length === 1 // 1, not 2, because the 'time' field is always hidden.
          ? data.fields.findIndex((f) => f.type === FieldType.number && !f.config.custom.hideFrom.viz) // add one for the time field
          : null);

      if (seriesIdxToUse === null) {
        appEvents.emit(AppEvents.alertWarning, ['Select a single series to correlate a region.']);
        return;
      }
      const field = data.fields[seriesIdxToUse];
      if (ds.createCorrelationQuery === undefined) {
        console.log(`Requested datasource with uid ${datasource.uid} cannot run correlations.`);
        return;
      }
      console.log(`Starting correlating series ${JSON.stringify(field.labels)}`);
      const originalQuery = queries?.find((x) => x.refId === data.refId);
      // Use the region time range if we're doing a region correlation, otherwise just use the current time range
      // by leaving this undefined.
      const range = isRegionCorrelation
        ? {
            from: dateTime(new Date(min)),
            to: dateTime(new Date(max)),
            raw: { from: dateTime(new Date(min)), to: dateTime(new Date(max)) },
          }
        : undefined;
      const query = await ds.createCorrelationQuery(
        `Correlated with ${data.refId}`,
        data,
        seriesIdxToUse,
        originalDatasource ?? undefined,
        originalQuery
      );
      if (query === null) {
        console.log('Could not create correlations query');
        return;
      }
      splitOpenFn({
        query,
        range,
        datasourceUid: datasource.uid,
      });
    },
    [bbox, splitOpenFn, seriesIdx, data, queries, originalDatasource, selection, isRegionCorrelation]
  );

  return (
    <>
      {isCorrelating && selection && bbox && pluginCoords && isRegionCorrelation && (
        <div
          style={{
            position: 'absolute',
            top: `${pluginCoords.plotCanvas.y}px`,
            left: `${pluginCoords.plotCanvas.x}px`,
          }}
        >
          <ContextMenuView
            data={data}
            timeZone={timeZone}
            onClose={() => {
              clearSelection();
              onClose();
            }}
            selection={{ ...selection, coords: pluginCoords }}
            defaultItems={[
              {
                items: correlationDataSources.map((datasource) => ({
                  label: `Find correlated series using ${datasource.name}`,
                  ariaLabel: `Find correlated series using ${datasource.name}`,
                  icon: 'graph-bar',
                  onClick: (e, p) => {
                    console.log({ selection });
                    startCorrelating({ coords: pluginCoords, datasource });
                  },
                })),
              },
            ]}
          />
        </div>
      )}
      {children ? children({ startCorrelating, onOpen, onClose }) : null}
    </>
  );
};
