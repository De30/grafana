import { css } from '@emotion/css';
import { id } from 'common-tags';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { CustomVariableModel, GrafanaTheme2, LoadingState, VariableHide, VariableOption } from '@grafana/data';
import { Button, ClickOutsideWrapper, useStyles2 } from '@grafana/ui';
import { ExploreId, VariableValue } from 'app/types';

import { PickerLabel } from '../variables/pickers/PickerRenderer';
import { VariableInput } from '../variables/pickers/shared/VariableInput';
import { VariableLink } from '../variables/pickers/shared/VariableLink';
import { VariableOptions } from '../variables/pickers/shared/VariableOptions';

import { Variable } from './RichHistory/SavedItemsVariablesTab';
import { changeVariableValuesAction } from './state/explorePane';
import { runQueries } from './state/query';

export interface Props {
  exploreId: ExploreId;
  variable: Variable;
  index: number;
}

export function ExploreVariablePicker(props: Props) {
  const { variable, index } = props;
  const dispatch = useDispatch();
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    const variableValue: VariableValue = { key: variable.name, value: variable.values[selectedIdx] };
    dispatch(changeVariableValuesAction({ exploreId: props.exploreId, variable: variableValue }));
    dispatch(runQueries(props.exploreId));
  }, [dispatch, props.exploreId, selectedIdx, variable.name, variable.values]);

  const removePicker = () => {
    const variableValue: VariableValue = { key: variable.name, value: undefined, uid: variable.uid };
    dispatch(dispatch(changeVariableValuesAction({ exploreId: props.exploreId, variable: variableValue })));
  };

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
    <div className={styles.wrapper}>
      <PickerLabel variable={pickerVariable} />
      {isOpen ? renderOptions(pickerVariable) : renderLink(variable)}
      <Button variant="secondary" onClick={removePicker} icon="times" />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css`
      margin-right: ${theme.spacing(1)};
      margin-left: ${theme.spacing(1)};
      display: inline-flex;
    `,
  };
};
