import React from 'react';

import { DataFrame, CoreApp } from '@grafana/data';
import FlameGraphContainer from 'app/plugins/panel/flamegraph/components/FlameGraphContainer';

import { PanelContainer } from '../../components/PanelContainer';

interface Props {
  dataFrames: DataFrame[];
}

// TODO: The FlameeGraph panel renders actions inside the panel content.
// To offer the same experience as other Explore panels, they should be rendered in the panel header as
// primary/secondary actions.
export const FlameGraphPanel = (props: Props) => {
  return (
    <PanelContainer label="Flame graph" isOpen>
      <FlameGraphContainer data={props.dataFrames[0]} app={CoreApp.Explore} />
    </PanelContainer>
  );
};
