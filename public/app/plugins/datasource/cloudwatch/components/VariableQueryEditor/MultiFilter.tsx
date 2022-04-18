import { isEqual } from 'lodash';
import React, { useEffect, useState } from 'react';
import { SelectableValue } from '@grafana/data';
import { EditorList } from '@grafana/experimental';
import { Dimensions as DimensionsType, MultiFilters } from '../../types';
import { MultiFilterItem } from './MultiFilterItem';

export interface Props {
  filters?: MultiFilters;
  onChange: (dimensions: MultiFilters) => void;
  dimensionKeys: Array<SelectableValue<string>>;
}

export interface MultiFilterCondition {
  key?: string;
  operator?: string;
  value?: string[];
}

const dimensionsToFilterConditions = (dimensions: DimensionsType | undefined) =>
  Object.entries(dimensions ?? {}).reduce<MultiFilterCondition[]>((acc, [key, value]) => {
    if (value && typeof value === 'object') {
      const filter = {
        key,
        value,
        operator: '=',
      };
      return [...acc, filter];
    }
    return acc;
  }, []);

const filterConditionsToDimensions = (filters: MultiFilterCondition[]) => {
  return filters.reduce<MultiFilters>((acc, { key, value }) => {
    if (key && value) {
      return { ...acc, [key]: value };
    }
    return acc;
  }, {});
};

export const MultiFilter: React.FC<Props> = ({ filters, dimensionKeys, onChange }) => {
  const [items, setItems] = useState<MultiFilterCondition[]>([]);
  useEffect(() => setItems(dimensionsToFilterConditions(filters)), [filters]);
  const onFiltersChange = (newItems: Array<Partial<MultiFilterCondition>>) => {
    setItems(newItems);

    // The onChange event should only be triggered in the case there is a complete dimension object.
    // So when a new key is added that does not yet have a value, it should not trigger an onChange event.
    const newDimensions = filterConditionsToDimensions(newItems);
    if (!isEqual(newDimensions, filters)) {
      onChange(newDimensions);
    }
  };

  return <EditorList items={items} onChange={onFiltersChange} renderItem={makeRenderFilter(dimensionKeys)} />;
};

function makeRenderFilter(keys: Array<SelectableValue<string>>) {
  function renderFilter(
    item: MultiFilterCondition,
    onChange: (item: MultiFilterCondition) => void,
    onDelete: () => void
  ) {
    return <MultiFilterItem filter={item} onChange={(item) => onChange(item)} keys={keys} onDelete={onDelete} />;
  }
  return renderFilter;
}
