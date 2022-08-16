import { id } from 'common-tags';
import React, { useState } from 'react';

import { CustomVariableModel, LoadingState, VariableHide, VariableOption } from '@grafana/data';
import { ClickOutsideWrapper } from '@grafana/ui';

import { PickerLabel } from '../variables/pickers/PickerRenderer';
import { VariableInput } from '../variables/pickers/shared/VariableInput';
import { VariableLink } from '../variables/pickers/shared/VariableLink';
import { VariableOptions } from '../variables/pickers/shared/VariableOptions';

import { Variable } from './RichHistory/SavedItemsVariablesTab';

export interface Props {
  variable: Variable;
  index: number;
}

export function ExploreVariablePicker(props: Props) {
  const { variable, index } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const renderOptions = (variable: CustomVariableModel) => {
    return (
      <ClickOutsideWrapper onClick={() => setIsOpen(false)}>
        <VariableInput
          id={`var-${id}`}
          value={variable.options[selectedIdx].value as string}
          onChange={() => {}}
          onNavigate={() => {}}
          aria-expanded={true}
          aria-controls={`options-${id}`}
        />
        <VariableOptions
          values={variable.options}
          onToggle={(toggledOption) => {
            const index = variable.options.findIndex((option) => option.value === toggledOption.value);
            setSelectedIdx(index);
            setIsOpen(false);
          }}
          onToggleAll={() => {}}
          highlightIndex={selectedIdx}
          multi={false}
          selectedValues={[variable.options[selectedIdx]]}
          id={`options-${id}`}
        />
      </ClickOutsideWrapper>
    );
  };

  const renderLink = (variable: Variable) => {
    return (
      <VariableLink
        id={`var-${variable.uid}`}
        text={variable.values[selectedIdx]}
        onClick={() => setIsOpen(!isOpen)}
        loading={false}
        onCancel={() => setIsOpen(false)}
        disabled={false}
      />
    );
  };

  const pickerVariable: CustomVariableModel = {
    name: variable.name,
    id: variable.name,
    label: variable.label,
    rootStateKey: variable.uid,
    global: true,
    hide: VariableHide.dontHide,
    skipUrlSync: true,
    index: index,
    state: LoadingState.Done,
    description: variable.desc,
    error: null,
    type: 'custom',
    multi: false,
    includeAll: false,
    allValue: null,
    query: '',
    options: variable.values.map((val: string) => {
      return {
        selected: false,
        text: val,
        value: val,
      };
    }),
    current: {} as VariableOption,
  };

  return (
    <>
      <PickerLabel variable={pickerVariable} />
      {isOpen ? renderOptions(pickerVariable) : renderLink(variable)}
    </>
  );
}
