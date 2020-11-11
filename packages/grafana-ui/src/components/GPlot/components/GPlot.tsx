import React, { FC, CSSProperties } from 'react';
import { usePlotContext } from '../hooks/usePlotContext';
import { PlotConfig } from '../types';

interface Props {
  config: PlotConfig;
}

export const GPlot: FC<Props> = ({ config: userConfig, children }) => {
  const env = usePlotContext(userConfig);

  const { margins, config } = env;
  const { width, height } = config;

  const fullsizeStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: `${margins.top}px`,
          right: `${margins.right}px`,
          bottom: `${margins.bottom}px`,
          left: `${margins.left}px`,
          cursor: `crosshair`,
        }}
      >
        <div className="gplot-layers" style={fullsizeStyle}>
          {children && children}
        </div>
      </div>
    </div>
  );
};

GPlot.displayName = 'GPlot';
