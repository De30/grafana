import { DataFrame, SplitOpen } from '@grafana/data';
import { FlamegraphRenderer } from '@pyroscope/flamegraph';
import { ExploreId } from 'app/types/explore';
import React, { RefObject } from 'react';
import '@pyroscope/flamegraph/dist/index.css';

type Props = {
  dataFrames: DataFrame[];
  splitOpenFn: SplitOpen;
  exploreId: ExploreId;
  scrollElement?: Element;
  topOfExploreViewRef?: RefObject<HTMLDivElement>;
};

export function FlamebearerViewContainer(props: Props) {
  const flamebearer = (props.dataFrames[props.dataFrames.length - 1].fields[0].values as any).buffer[0];
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
  );
}
