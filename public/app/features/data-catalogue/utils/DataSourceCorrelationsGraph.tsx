import React from 'react';

import { DataQuery, DataSourceApi, DataSourceInstanceSettings } from '@grafana/data';

type Connection = { datasource: DataSourceInstanceSettings; from: boolean; to: boolean };

type Props = {
  datasource: DataSourceApi<DataQuery>;
  connections: Connection[];
};

export const DataSourceCorrelationsGraph = (props: Props) => {
  const { datasource, connections } = props;

  const angleStep = 360 / connections.length;

  return (
    <svg width="80%" viewBox="-10 -5 120 110" transform="translate(0,0)" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
          <polygon points="0 0, 5 2.5, 0 5" fill="#666" />
        </marker>
      </defs>

      <text transform="translate(-10,0)" style={{ fontSize: '4' }} fill="#ddd">
        Data sources correlated with {datasource.name}:
      </text>

      <g transform="translate(-10,-10)">
        <image transform="translate(50,50)" href={datasource.meta.info.logos.small} width="20" height="20"></image>
      </g>

      {connections.map(({ datasource, from, to }, index) => (
        <>
          {from && (
            <line
              transform={`rotate(${index * angleStep},50,50)`}
              x1="60"
              y1="50"
              x2="75"
              y2="50"
              stroke="#666"
              strokeWidth="1"
              markerEnd="url(#arrowhead)"
            />
          )}
          {to && (
            <line
              transform={`rotate(${index * angleStep},50,50)`}
              x1="80"
              y1="50"
              x2="65"
              y2="50"
              stroke="#666"
              strokeWidth="1"
              markerEnd="url(#arrowhead)"
            />
          )}
          <g transform={`translate(-10,-10) rotate(${index * angleStep},50,50)`}>
            <g transform={`translate(90,50) rotate(${-index * angleStep})`}>
              <image
                href={datasource.meta.info.logos.small}
                width="20"
                height="20"
                onClick={() => alert('click')}
              ></image>
              <text textAnchor="middle" transform="translate(10,23)" style={{ fontSize: '3' }} fill="#ddd">
                {datasource.name}
              </text>
            </g>
          </g>
        </>
      ))}
    </svg>
  );
};
