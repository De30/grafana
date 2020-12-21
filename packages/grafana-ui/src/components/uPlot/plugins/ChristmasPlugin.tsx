import React, { CSSProperties, useEffect, useState } from 'react';
import { PlotPluginProps } from '../types';
import { usePlotContext } from '../context';
import { XYCanvas } from '../geometries';
import uPlot from 'uplot';

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
    rotation: -35,
  });
  const timeOffset = 6000;

  useEffect(() => {
    plotCtx.registerPlugin({
      id: pluginId,
      hooks: {
        draw: (plot: uPlot) => {
          const timePos = new Date().valueOf() - timeOffset;

          const valIndex = plot.valToIdx(timePos);
          //console.log('value', plot.data[1][valIndex]);
          const xPos = plot.valToPos(timePos, 'x');
          const valPos = plot.valToPos(plot.data[1][valIndex] ?? 0, 'short');
          const valPosNext = plot.valToPos(plot.data[1][valIndex + 1] ?? 0, 'short');
          const valPostNextNext = plot.valToPos(plot.data[1][valIndex + 2] ?? 0, 'short');
          const diff = valPostNextNext - valPosNext;

          setState({
            xPos: xPos,
            yPos: valPos - 40,
            rotation: -40 + diff,
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
    transform: `rotate(${state.rotation}deg) matrix(-1, 0, 0, 1, 0, 0)`,
    transition: 'all 30ms linear 30ms',
  };

  return (
    <XYCanvas>
      <div style={style}>⛷</div>
    </XYCanvas>
  );
};
