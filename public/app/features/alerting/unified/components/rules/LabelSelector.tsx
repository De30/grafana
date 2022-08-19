import React, { FC } from 'react';

export const LabelSelector: FC = () => {
  const labels = [
    {
      key: 'severity',
      value: 'critical',
    },
    {
      key: 'severity',
      value: 'low',
    },
    {
      key: 'region',
      value: 'us-central-0',
    },
    {
      key: 'region',
      value: 'eu-west-1',
    },
  ];

  const labelMap = labels.reduce((acc, label) => {
    const existingValues = acc.get(label.key) ?? [];

    acc.set(label.key, existingValues.concat(label.value));
    return acc;
  }, new Map<string, string[]>());

  const keys = labelMap.keys();

  return (
    <ul>
      {Array.from(keys).map((key) => (
        <li key={key}>{key}</li>
      ))}
    </ul>
  );
};
