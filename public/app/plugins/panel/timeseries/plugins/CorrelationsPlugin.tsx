import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useMountedState } from 'react-use';
import uPlot from 'uplot';

import { CartesianCoords2D, DataFrame, DataSourceInstanceSettings, SplitOpen } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { UPlotConfigBuilder } from '@grafana/ui';

type StartCorrelatingFn = (props: {
  // pixel coordinates of the clicked point on the uPlot canvas
  coords: { viewport: CartesianCoords2D; plotCanvas: CartesianCoords2D } | null;
  datasource: DataSourceInstanceSettings;
}) => Promise<void>;

interface CorrelationsPluginProps {
  data: DataFrame;
  config: UPlotConfigBuilder;
  splitOpenFn: SplitOpen;
  children?: (props: {
    startCorrelating: StartCorrelatingFn;
    onOpen: () => void;
    onClose: () => void;
  }) => React.ReactNode;
}

/**
 * @alpha
 */
export const CorrelationsPlugin: React.FC<CorrelationsPluginProps> = ({ data, splitOpenFn, config, children }) => {
  const plotInstance = useRef<uPlot>();
  let isOpenRef = useRef(false);
  const onOpen = () => {
    isOpenRef.current = true;
  };
  const onClose = () => {
    isOpenRef.current = false;
  };
  const [seriesIdx, setSeriesIdx] = useState<number | null>(null);
  const [bbox, setBbox] = useState<DOMRect>();
  const isMounted = useMountedState();

  useLayoutEffect(() => {
    config.addHook('init', (u) => {
      plotInstance.current = u;
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
  }, [config, setBbox, isMounted, isOpenRef, setSeriesIdx]);

  const startCorrelating = useCallback<StartCorrelatingFn>(
    async ({ coords, datasource }) => {
      if (!plotInstance.current || !bbox || !coords) {
        return;
      }

      const min = plotInstance.current.posToVal(coords.plotCanvas.x, 'x');

      if (!min) {
        return;
      }

      const ds = await getDataSourceSrv().get(datasource.uid);

      if (seriesIdx !== null) {
        const field = data.fields[seriesIdx];
        if (ds.createCorrelationQuery === undefined) {
          console.log(`Requested datasource with uid ${datasource.uid} cannot run correlations.`);
          return;
        }
        console.log(`Starting correlating series ${JSON.stringify(field.labels)}`);
        const query = ds.createCorrelationQuery(`Correlated with ${data.refId}`, data, seriesIdx);
        if (query === null) {
          console.log('Could not create correlations query');
          return;
        }
        splitOpenFn({
          query,
          datasourceUid: datasource.uid,
        });
      }
    },
    [bbox, splitOpenFn, seriesIdx, data]
  );

  return <>{children ? children({ startCorrelating, onOpen, onClose }) : null};</>;
};
