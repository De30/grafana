import React, { CSSProperties, useLayoutEffect, useRef } from 'react';

import { GrafanaTheme2 } from '@grafana/data';

import { UPlotConfigBuilder } from '../config/UPlotConfigBuilder';

interface HighlightPluginProps {
  theme: GrafanaTheme2;
  config: UPlotConfigBuilder;
}

/**
 * @alpha
 */
export const HighlightPlugin: React.FC<HighlightPluginProps> = ({ theme, config }) => {
  //   const light = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);

  //   const lightStyle: CSSProperties = {
  //     width: '35px',
  //     height: '100px',
  //     position: 'absolute',
  //     top: 0,
  //     background: 'rgb(164 164 255 / 51%)',
  //   };

  const ballStyle: CSSProperties = {
    width: '15px',
    height: '15px',
    borderRadius: '50%',
    background: 'white',
    position: 'absolute',
    boxShadow: '0px 0px 0px 4px rgb(164 164 255 / 51%)',
  };

  useLayoutEffect(() => {
    const draw = (u: uPlot) => {
      const ballElement = ball.current;
      if (!ballElement) {
        return;
      }

      //   const lightElement = light.current;
      //   if (!lightElement) {
      //     return;
      //   }

      if (u.data.length > 0) {
        const x = u.data[0];
        const y = u.data[1];
        const seriesY = u.series[1];
        const yScale = u.scales[seriesY.scale!];

        const leftX = u.valToPos(x[x.length - 1], 'x', false);
        const topY = u.valToPos(y[y.length - 1], yScale.key, false);
        console.log('leftX', leftX);
        console.log('rightY', topY);

        ballElement.style.left = `${leftX + 19}px`;
        ballElement.style.top = `${topY - 7}px`;

        // lightElement.style.left = `${leftX}px`;
        // lightElement.style.bottom = `${u.bbox.height - u.valToPos(yScale.min!, yScale.key!, false)}px`;
      }
      //   const radius = 20;
      //   u.ctx.beginPath();
      //   u.ctx.arc(u.bbox.width, 50, radius, 2 * Math.PI, 0);
      //   u.ctx.fillStyle = 'green';
      //   u.ctx.fill();
      //   u.ctx.lineWidth = 2;
      //   u.ctx.strokeStyle = theme.colors.text.primary;
      //   u.ctx.stroke();
      //   console.log(u.scales);
      //   u.scales.x.max = 1000000;
      //   u.scales.x.u.ctx.restore();
    };

    config.addHook('draw', draw);

    config.setPadding([0, 100, 0, 0]);
    // config.addHook('init', (u) => {
    //     u.
    // });
  }, [config]);

  return (
    <>
      {/* <div ref={light} style={lightStyle} /> */}
      <div ref={ball} style={ballStyle} />
    </>
  );
};
