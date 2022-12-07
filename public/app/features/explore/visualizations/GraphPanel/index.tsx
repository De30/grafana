import React, { useCallback, useState } from 'react';

import {
  DataFrame,
  EventBus,
  AbsoluteTimeRange,
  TimeZone,
  SplitOpen,
  LoadingState,
  SelectableValue,
} from '@grafana/data';
import { RadioButtonGroup } from '@grafana/ui';
import store from 'app/core/store';

import { PanelContainer } from '../../components/PanelContainer';

import { Graph } from './Graph';
import { ExploreGraphStyle, EXPLORE_GRAPH_STYLES } from './types';

const GRAPH_STYLE_KEY = 'grafana.explore.style.graph';
const storeGraphStyle = (graphStyle: string): void => {
  store.set(GRAPH_STYLE_KEY, graphStyle);
};

const loadGraphStyle = (): ExploreGraphStyle => {
  return toGraphStyle(store.get(GRAPH_STYLE_KEY));
};

// we use this function to take any kind of data we loaded
// from an external source (URL, localStorage, whatever),
// and extract the graph-style from it, or return the default
// graph-style if we are not able to do that.
// it is important that this function is able to take any form of data,
// (be it objects, or arrays, or booleans or whatever),
// and produce a best-effort graphStyle.
// note that typescript makes sure we make no mistake in this function.
// we do not rely on ` as ` or ` any `.
const toGraphStyle = (data: unknown): ExploreGraphStyle => {
  return EXPLORE_GRAPH_STYLES.find((v) => v === data) || EXPLORE_GRAPH_STYLES[0];
};

const ALL_GRAPH_STYLE_OPTIONS: Array<SelectableValue<ExploreGraphStyle>> = EXPLORE_GRAPH_STYLES.map((style) => ({
  value: style,
  // capital-case it and switch `_` to ` `
  label: style[0].toUpperCase() + style.slice(1).replace(/_/, ' '),
}));

interface Props {
  loading: boolean;
  data: DataFrame[];
  annotations?: DataFrame[];
  eventBus: EventBus;
  height: number;
  absoluteRange: AbsoluteTimeRange;
  timeZone: TimeZone;
  onChangeTime: (absoluteRange: AbsoluteTimeRange) => void;
  splitOpenFn: SplitOpen;
  loadingState: LoadingState;
}

export const GraphPanel = ({
  loading,
  data,
  eventBus,
  height,
  absoluteRange,
  timeZone,
  annotations,
  onChangeTime,
  splitOpenFn,
  loadingState,
}: Props) => {
  const [graphStyle, setGraphStyle] = useState(loadGraphStyle);

  const onGraphStyleChange = useCallback((graphStyle: ExploreGraphStyle) => {
    storeGraphStyle(graphStyle);
    setGraphStyle(graphStyle);
  }, []);

  return (
    <PanelContainer
      label="Graph"
      secondaryActions={[
        <RadioButtonGroup
          key="graph-style"
          size="sm"
          options={ALL_GRAPH_STYLE_OPTIONS}
          value={graphStyle}
          onChange={onGraphStyleChange}
        />,
      ]}
      loading={loading}
      isOpen
    >
      {(width) => (
        <Graph
          graphStyle={graphStyle}
          data={data}
          height={height}
          width={width}
          absoluteRange={absoluteRange}
          onChangeTime={onChangeTime}
          timeZone={timeZone}
          annotations={annotations}
          splitOpenFn={splitOpenFn}
          loadingState={loadingState}
          eventBus={eventBus}
        />
      )}
    </PanelContainer>
  );
};
