import React, { CSSProperties, useEffect, useState } from 'react';
import { PlotPluginProps } from '../types';
import { usePlotContext } from '../context';
import { XYCanvas } from '../geometries';
import uPlot from 'uplot';
import { DH_CHECK_P_NOT_SAFE_PRIME } from 'constants';

interface Props extends PlotPluginProps {}

interface State {
  xPos: number;
  yPos: number;
  rotation: number;
}

/**
 * @alpha
 */
export const ChristmasPlugin: React.FC<Props> = ({ id }) => {
  const pluginId = `SelectionPlugin:${id}`;
  const plotCtx = usePlotContext();
  const [state, setState] = useState<State>({
    xPos: 200,
    yPos: 1,
    rotation: 0,
  });

  useEffect(() => {
    let yPos = 0;

    plotCtx.registerPlugin({
      id: pluginId,
      hooks: {
        draw: (plot: uPlot) => {
          yPos += 1;
          console.log('draw hook');
          console.log(plot.data[1][0]);
          setState({
            xPos: state.xPos,
            yPos: yPos,
            rotation: 0,
          });
        },
      },
    });
  }, []);

  const style: CSSProperties = {
    position: 'relative',
    top: state.yPos,
    left: state.xPos,
    fontSize: '40px',
    transform: 'rotate(-35deg) matrix(-1, 0, 0, 1, 0, 0)',
  };

  return (
    <XYCanvas>
      <div style={style}>⛷</div>
    </XYCanvas>
  );
};
