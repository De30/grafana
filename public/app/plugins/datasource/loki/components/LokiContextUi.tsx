import { css } from '@emotion/css';
import React, { useState } from 'react';

import { FilterPill } from '@grafana/ui';

import { ContextFilter } from '../types';

export interface LokiContextUiProps {
  filters: Map<string, ContextFilter>;
  updateFilter: (label: string, value: Map<string, ContextFilter>) => void;
}

const styles = {
  labels: css`
    display: flex;
    gap: 2px;
  `,
};

export function LokiContextUi(props: LokiContextUiProps) {
  const [filterState, setfilterState] = useState(props.filters);
  const updateMap = (k: string, v: boolean) => {
    const filter = filterState.get(k)!;
    filter.enabled = v;
    const newMap = new Map(filterState.set(k, filter));
    setfilterState(newMap);
    props.updateFilter(k, newMap);
  };
  const l = [...filterState.entries()].sort((a, b) => a[0].localeCompare(b[0])).sort((a) => (a[1].enabled ? -1 : 1));
  const labels = l
    .filter(([_, { fromParser }]) => !fromParser)
    .map(([key]) => (
      <FilterPill
        key={key}
        label={key}
        selected={filterState.get(key)?.enabled!}
        onClick={() => {
          updateMap(key, !filterState.get(key)?.enabled!);
        }}
      />
    ));
  const parsedLabels = l
    .filter(([_, { fromParser }]) => fromParser)
    .map(([key]) => (
      <FilterPill
        key={key}
        label={key}
        selected={filterState.get(key)?.enabled!}
        onClick={() => {
          updateMap(key, !filterState.get(key)?.enabled!);
        }}
      />
    ));

  return (
    <div className={styles.labels}>
      {labels} | {parsedLabels}
    </div>
  );
}
