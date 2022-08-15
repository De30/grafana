import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useMountedState } from 'react-use';
import uPlot from 'uplot';

import { CartesianCoords2D, DataFrame, SplitOpen, TimeZone } from '@grafana/data';
import { UPlotConfigBuilder } from '@grafana/ui';

type StartCorrelatingFn = (props: {
  // pixel coordinates of the clicked point on the uPlot canvas
  coords: { viewport: CartesianCoords2D; plotCanvas: CartesianCoords2D } | null;
}) => void;

interface CorrelationsPluginProps {
  data: DataFrame;
  timeZone: TimeZone;
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
export const CorrelationsPlugin: React.FC<CorrelationsPluginProps> = ({
  data,
  splitOpenFn,
  timeZone,
  config,
  children,
}) => {
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
    ({ coords }) => {
      if (!plotInstance.current || !bbox || !coords) {
        return;
      }

      const min = plotInstance.current.posToVal(coords.plotCanvas.x, 'x');

      if (!min) {
        return;
      }

      if (seriesIdx !== null) {
        const field = data.fields[seriesIdx];
        console.log(`Starting correlating series ${JSON.stringify(field.labels)}`);
        splitOpenFn({
          query: {
            refId: 'Correlated',
            // TODO: handle other data sources by defining a new 'type' of
            // target where the data is passed directly to the backend.
            target: {
              type: 'prometheus',
              expr: field.config.displayNameFromDS,
              // extraLabels: field.labels,
            },
          },
          // TODO: fetch this from somewhere?
          // Maybe it should be configured globally, or maybe there should
          // be a context menu item for each possible correlations data source?
          datasourceUid: 'gpf6oFm4k',
        });
      }
    },
    [bbox, splitOpenFn, seriesIdx, data.fields]
  );

  return <>{children ? children({ startCorrelating, onOpen, onClose }) : null};</>;
};
