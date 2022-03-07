import {
    DataFrame,
    DataFrameView,
    DataLink,
    DataSourceApi,
    Field,
    LinkModel,
    mapInternalLinkToExplore,
    SplitOpen,
    TraceSpanRow,
  } from '@grafana/data';
import { FlamegraphRenderer } from '@pyroscope/flamegraph';
import { ExploreId } from 'app/types/explore';
import React, { RefObject, useCallback, useMemo, useState } from 'react';
// import '@pyroscope/flamegraph/dist/index.css';

type Props = {
    dataFrames: DataFrame[];
    splitOpenFn: SplitOpen;
    exploreId: ExploreId;
    scrollElement?: Element;
    topOfExploreViewRef?: RefObject<HTMLDivElement>;
  };

export function FlamebearerViewContainer(props: Props) {
  const flamebearer = (
    props.dataFrames[props.dataFrames.length - 1].fields[0].values as any
  ).buffer[0];
  console.log(flamebearer);
    return (
      <div className={`flamegraph-wrapper`}>
      <FlamegraphRenderer
        flamebearer={flamebearer}
        ExportData={<div />}
        display="flamegraph"
        viewType="single"
        showToolbar={true}
      />
    </div>
    )
}
