import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

import { Field } from '../Field';
import { findOption, toOption } from '../../utils/common';
import { AzureQueryEditorFieldProps, AzureMonitorOption } from '../../types';
import { setResourceGroup } from './setQueryValue';
import { useRecoilState, useRecoilValueLoadable } from 'recoil';
import { resourceGroupsState, selectedResourceGroupState } from './recoilState';

const ERROR_SOURCE = 'metrics-resourcegroups';
const ResourceGroupsField: React.FC<AzureQueryEditorFieldProps> = ({
  variableOptionGroup,
  onQueryChange,
  setError,
}) => {
  const [resourceGroup, setResourceGroup] = useRecoilState(selectedResourceGroupState);
  const resourceGroupsLoadable = useRecoilValueLoadable(resourceGroupsState);
  const resourceGroups = useMemo(
    () => (resourceGroupsLoadable.state === 'hasValue' ? resourceGroupsLoadable.contents : []),
    [resourceGroupsLoadable]
  );

  const options = useMemo(() => [...resourceGroups, variableOptionGroup], [resourceGroups, variableOptionGroup]);

  const handleChange = useCallback(
    (change: SelectableValue<string>) => {
      setResourceGroup(change.value);
    },
    [setResourceGroup]
  );

  return (
    <Field label="Resource group">
      <Select
        inputId="azure-monitor-metrics-resource-group-field"
        value={resourceGroup}
        onChange={handleChange}
        options={options}
        width={38}
      />
    </Field>
  );
};

export default ResourceGroupsField;
