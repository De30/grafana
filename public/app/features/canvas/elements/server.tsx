import { css } from '@emotion/css';
import React, { FC } from 'react';

import { FieldColorModeId, GrafanaTheme2, ThresholdsMode, VizOrientation } from '@grafana/data';
import { BarGauge, BarGaugeDisplayMode, useStyles2 } from '@grafana/ui';
import { config } from 'app/core/config';
import { DimensionContext, ScalarDimensionConfig } from 'app/features/dimensions';
import { ScalarDimensionEditor } from 'app/features/dimensions/editors';

import { CanvasElementItem, CanvasElementProps } from '../element';

interface WindTurbineData {
  rpm?: number;
}

interface WindTurbineConfig {
  rpm?: ScalarDimensionConfig;
}

const ServerDisplay: FC<CanvasElementProps<WindTurbineConfig, WindTurbineData>> = (props) => {
  const styles = useStyles2(getStyles);

  //const { data } = props;

  //const windTurbineAnimation = `spin ${data?.rpm ? 60 / Math.abs(data.rpm) : 0}s linear infinite`;

  const val = {
    text: '62.7',
    numeric: 62.74513619222988,
    suffix: '%',
    color: '#EAB839',
    percent: 0.6274513619222988,
  };
  const val2 = {
    text: '90',
    numeric: 90,
    suffix: '%',
    color: '#FF5733',
    percent: 0.9,
  };
  const field2 = {
    min: 0,
    max: 100,
    delta: 100,
    mappings: [],
    unit: 'percent',
    color: {
      mode: FieldColorModeId.Thresholds,
    },
    thresholds: {
      mode: ThresholdsMode.Absolute,
      steps: [
        {
          color: 'green',
          value: -Infinity,
        },
        {
          color: '#EAB839',
          value: 50,
        },
        {
          color: 'red',
          value: 80,
        },
      ],
    },
  };

  return (
    <>
      <BarGauge
        width={100}
        height={130}
        field={field2}
        text={{ valueSize: 14 }}
        value={val}
        orientation={VizOrientation.Vertical}
        className={styles.gauge}
        itemSpacing={1}
        lcdCellWidth={8}
        displayMode={BarGaugeDisplayMode.Gradient}
        theme={config.theme2}
      />
      <BarGauge
        width={100}
        height={130}
        field={field2}
        text={{ valueSize: 14 }}
        value={val2}
        orientation={VizOrientation.Vertical}
        className={styles.gauge2}
        itemSpacing={1}
        lcdCellWidth={8}
        displayMode={BarGaugeDisplayMode.Gradient}
        theme={config.theme2}
      />
      <svg viewBox="0 0 81.129 70.129">
        <g transform="translate(-244.4 -28.642)">
          <g className={styles.r16}>
            <rect x="256.66" y="50.233" width="56.974" height="45.548" />
          </g>
          <g className={styles.r10}>
            <rect x="244.48" y="28.724" width="7.7773" height="69.968" />
            <rect x="317.68" y="28.721" width="7.7773" height="69.968" />
          </g>
          <g className={styles.r11}>
            <rect x="252.27" y="28.739" width="65.423" height="3.5045" />
            <rect x="252.28" y="93.796" width="65.382" height="3.7552" />
          </g>
          <g className={styles.r15}>
            <rect x="254.91" y="80.507" width="60.345" height="12.931" />
          </g>
          <g className={styles.c1}>
            <circle cx="256.07" cy="81.69" r=".88718" />
            <circle cx="256.04" cy="92.26" r=".88718" />
            <circle cx="314.07" cy="81.707" r=".88718" />
            <circle cx="314.04" cy="92.278" r=".88718" />
          </g>
          <g className={styles.r9}>
            <rect x="256.94" y="82.143" width="1.6763" height="9.3391" />
            <rect x="310.72" y="82.081" width="1.6763" height="9.3391" />
          </g>

          <g className={styles.r7}>
            <rect x="276.49" y="85.155" width="16.425" height="3.6405" />
            <rect x="276.48" y="81.01" width="16.425" height="3.6405" />
            <rect x="276.45" y="89.272" width="16.425" height="3.6405" />
            <rect x="259.38" y="85.211" width="16.425" height="3.6405" />
            <rect x="259.37" y="81.067" width="16.425" height="3.6405" />
            <rect x="259.34" y="89.328" width="16.425" height="3.6405" />
            <rect x="293.59" y="85.155" width="16.425" height="3.6405" />
            <rect x="293.59" y="81.01" width="16.425" height="3.6405" />
            <rect x="293.56" y="89.272" width="16.425" height="3.6405" />
          </g>
          <g className={styles.r12}>
            <rect x="255.01" y="73.624" width="60.119" height="6.0595" />
          </g>
          <g className={styles.c1}>
            <circle cx="256.06" cy="74.884" r=".88718" />
            <circle cx="256.03" cy="78.458" r=".88718" />
            <circle cx="314.05" cy="74.901" r=".88718" />
            <circle cx="314.03" cy="78.475" r=".88718" />
          </g>
          <g className={styles.r8}>
            <rect x="259.44" y="74.581" width="24.793" height="4.2072" />
            <rect x="285.49" y="74.581" width="24.793" height="4.2072" />
          </g>
          <g className={styles.p1}>
            <path d="m262.24 77.259h1.0188v-2.0241h-2.8167v1.9735h.95888v.75904h.85203z" />
            <path d="m265.85 77.278h1.0188v-2.0241h-2.8167v1.9735h.95887v.75904h.85203z" />
            <path d="m269.49 77.294h1.0188v-2.0241h-2.8167v1.9735h.95887v.75904h.85203z" />
            <path d="m274.83 77.313h1.0188v-2.0241h-2.8167v1.9735h.95888v.75904h.85203z" />
            <path d="m278.45 77.32h1.0188v-2.0241h-2.8167v1.9735h.95888v.75904h.85203z" />
            <path d="m282.06 77.338h1.0188v-2.0241h-2.8167v1.9735h.95887v.75904h.85203z" />
            <path d="m288.33 77.334h1.0188v-2.0241h-2.8167v1.9735h.95888v.75904h.85202z" />
            <path d="m291.94 77.352h1.0188v-2.0241h-2.8167v1.9735h.95887v.75904h.85203z" />
            <path d="m295.58 77.369h1.0188v-2.0241h-2.8167v1.9735h.95888v.75904h.85202z" />
            <path d="m300.92 77.388h1.0188v-2.0241h-2.8167v1.9735h.95888v.75904h.85203z" />
            <path d="m304.54 77.394h1.0188v-2.0241h-2.8167v1.9735h.95888v.75904h.85203z" />
            <path d="m308.15 77.413h1.0188v-2.0241h-2.8167v1.9735h.95888v.75904h.85202z" />
          </g>

          <g className={styles.r13}>
            <rect x="254.98" y="31.395" width="60.333" height="41.427" />
          </g>
          <g className={styles.r14}>
            <rect x="256.43" y="32.85" width="57.572" height="38.649" />
          </g>
          <g className={styles.r5}>
            <rect x="290.47" y="85.764" width="1.5565" height=".71839" />
            <rect x="290.46" y="81.62" width="1.5565" height=".71839" />
            <rect x="290.43" y="89.881" width="1.5565" height=".71839" />
            <rect x="273.36" y="85.82" width="1.5565" height=".71839" />
            <rect x="273.35" y="81.676" width="1.5565" height=".71839" />
            <rect x="273.32" y="89.938" width="1.5565" height=".71839" />
            <rect x="307.57" y="85.764" width="1.5565" height=".71839" />
            <rect x="307.57" y="81.62" width="1.5565" height=".71839" />
            <rect x="307.54" y="89.881" width="1.5565" height=".71839" />
          </g>
          <g className={styles.r3}>
            <rect x="287.21" y="85.384" width="3.3019" height="3.1326" />
            <rect x="287.21" y="81.24" width="3.3019" height="3.1326" />
            <rect x="287.18" y="89.502" width="3.3019" height="3.1326" />
            <rect x="270.1" y="85.441" width="3.3019" height="3.1326" />
            <rect x="270.09" y="81.296" width="3.3019" height="3.1326" />
            <rect x="270.06" y="89.558" width="3.3019" height="3.1326" />
            <rect x="304.32" y="85.384" width="3.3019" height="3.1326" />
            <rect x="304.31" y="81.24" width="3.3019" height="3.1326" />
            <rect x="304.28" y="89.502" width="3.3019" height="3.1326" />
          </g>
          <g className={styles.r1}>
            <rect x="308.38" y="77.623" width=".92793" height=".53636" />
            <rect x="304.77" y="77.617" width=".92793" height=".53636" />
            <rect x="301.15" y="77.623" width=".92793" height=".53636" />
            <rect x="295.8" y="77.62" width=".92793" height=".53636" />
            <rect x="292.18" y="77.614" width=".92793" height=".53636" />
            <rect x="288.56" y="77.62" width=".92793" height=".53636" />
            <rect x="282.28" y="77.625" width=".92793" height=".53636" />
            <rect x="278.66" y="77.619" width=".92793" height=".53636" />
            <rect x="275.04" y="77.625" width=".92793" height=".53636" />
            <rect x="269.7" y="77.622" width=".92793" height=".53636" />
            <rect x="266.08" y="77.616" width=".92793" height=".53636" />
            <rect x="262.46" y="77.622" width=".92793" height=".53636" />
          </g>
          <g className={styles.r2}>
            <rect x="306.19" y="77.623" width=".92793" height=".53636" />
            <rect x="302.57" y="77.617" width=".92793" height=".53636" />
            <rect x="298.95" y="77.622" width=".92793" height=".53636" />
            <rect x="293.61" y="77.62" width=".92793" height=".53636" />
            <rect x="289.99" y="77.614" width=".92793" height=".53636" />
            <rect x="286.37" y="77.619" width=".92793" height=".53636" />
            <rect x="280.09" y="77.625" width=".92793" height=".53636" />
            <rect x="276.47" y="77.619" width=".92793" height=".53636" />
            <rect x="272.85" y="77.625" width=".92793" height=".53636" />
            <rect x="267.5" y="77.622" width=".92793" height=".53636" />
            <rect x="263.88" y="77.616" width=".92793" height=".53636" />
            <rect x="260.26" y="77.622" width=".92793" height=".53636" />
          </g>
          <g className={styles.r4}>
            <rect x="278.78" y="86.001" width="8.7204" height=".57048" />
            <rect x="278.77" y="81.857" width="8.7204" height=".57048" />
            <rect x="278.74" y="90.119" width="8.7204" height=".57048" />
            <rect x="261.66" y="86.057" width="8.7204" height=".57048" />
            <rect x="261.65" y="81.913" width="8.7204" height=".57048" />
            <rect x="261.62" y="90.175" width="8.7204" height=".57048" />
            <rect x="295.88" y="86.001" width="8.7204" height=".57048" />
            <rect x="295.87" y="81.857" width="8.7204" height=".57048" />
            <rect x="295.84" y="90.119" width="8.7204" height=".57048" />
          </g>
          <g className={styles.r6}>
            <rect x="278.79" y="87.258" width="8.7204" height=".57048" />
            <rect x="278.78" y="83.114" width="8.7204" height=".57048" />
            <rect x="278.75" y="91.376" width="8.7204" height=".57048" />
            <rect x="261.67" y="87.315" width="8.7204" height=".57048" />
            <rect x="261.66" y="83.17" width="8.7204" height=".57048" />
            <rect x="261.63" y="91.432" width="8.7204" height=".57048" />
            <rect x="295.89" y="87.258" width="8.7204" height=".57048" />
            <rect x="295.88" y="83.114" width="8.7204" height=".57048" />
            <rect x="295.85" y="91.376" width="8.7204" height=".57048" />
          </g>
        </g>
      </svg>
    </>
  );
};

export const serverItem: CanvasElementItem<any, any> = {
  id: 'server',
  name: 'Server',
  description: 'Server with status',

  display: ServerDisplay,

  defaultSize: {
    width: 100,
    height: 155,
  },

  getNewOptions: (options) => ({
    ...options,
    background: {
      color: {
        fixed: 'transparent',
      },
    },
    placement: {
      width: options?.placement?.width ?? 100,
      height: options?.placement?.height ?? 155,
      top: options?.placement?.top,
      left: options?.placement?.left,
    },
  }),

  // Called when data changes
  prepareData: (ctx: DimensionContext, cfg: WindTurbineConfig) => {
    const data: WindTurbineData = {
      rpm: cfg?.rpm ? ctx.getScalar(cfg.rpm).value() : 0,
    };

    return data;
  },

  registerOptionsUI: (builder) => {
    const category = ['Server'];
    builder.addCustomEditor({
      category,
      id: 'rpm',
      path: 'config.rpm',
      name: 'RPM',
      editor: ScalarDimensionEditor,
    });
  },
};

const getStyles = (theme: GrafanaTheme2) => ({
  blade: css`
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    transform-origin: 94.663px 94.663px;
    transform: rotate(15deg);
  `,
  gauge: css`
    left: 50px;
    position: absolute;
    top: 70px;
  `,
  gauge2: css`
    left: 153px;
    position: absolute;
    top: 39px;
  `,
  p1: css`
    fill: #383838;
    stroke-linecap: round;
    stroke-miterlimit: 10;
    stroke-width: 0.27596;
    stroke: #232323;
  `,
  c1: css`
    fill: #d8d8d8;
    stroke-width: 0.21783;
    stroke: #5d5d5d;
  `,
  r1: css`
    fill: #eb6303;
    stroke-linecap: round;
    stroke-miterlimit: 10;
    stroke-width: 0.22808;
  `,
  r2: css`
    fill: #69b76b;
    stroke-linecap: round;
    stroke-miterlimit: 10;
    stroke-width: 0.22808;
  `,
  r3: css`
    fill: #137cc2;
    stroke-linecap: round;
    stroke-miterlimit: 10;
    stroke-width: 0.5;
    stroke: #0061a8;
  `,
  r4: css`
    fill: #838383;
  `,
  r5: css`
    fill: #0061a8;
  `,
  r6: css`
    fill: #8a8a8a;
  `,
  r7: css`
    fill: #1d1e1e;
    stroke-linecap: round;
    stroke-miterlimit: 10;
    stroke-width: 0.265;
    stroke: #2b2b2b;
  `,
  r8: css`
    fill: #555;
    stroke-linecap: round;
    stroke-miterlimit: 10;
    stroke-width: 0.25;
    stroke: #5d5d5d;
  `,
  r9: css`
    fill: #d8d8d8;
    stroke-linecap: round;
    stroke-miterlimit: 4.1;
    stroke-width: 0.25;
    stroke: #5d5d5d;
  `,
  r10: css`
    fill: #969696;
    stroke-width: 0.15561;
    stroke: #000;
  `,
  r11: css`
    fill: #969696;
    stroke-width: 0.19;
    stroke: #000;
  `,
  r12: css`
    fill: #b5b5b5;
    stroke-linecap: round;
    stroke-miterlimit: 10;
    stroke-width: 0.25;
    stroke: #5d5d5d;
  `,
  r13: css`
    fill: #c0c0c0;
    stroke-width: 0.27683;
    stroke: #464646;
  `,
  r14: css`
    stroke-width: 0.30043;
    stroke: #7f7d7c;
  `,
  r15: css`
    fill: #848484;
    stroke-width: 0.265;
    stroke: #080808;
  `,
  r16: css`
    fill: #fff;
    stroke-width: 0.23749;
    stroke: #000;
  `,
});
