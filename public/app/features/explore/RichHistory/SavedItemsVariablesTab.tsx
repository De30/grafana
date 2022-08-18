import { css } from '@emotion/css';
import React, { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, Checkbox, CollapsableSection, InlineField, Input, useStyles2 } from '@grafana/ui';
import { ExploreId, StoreState } from 'app/types';

import { changeVariableListAction } from '../state/explorePane';
import { api } from '../variables.api';

export interface SavedItemsVariablesTabProps {
  exploreId: ExploreId;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      font-size: ${theme.typography.body.fontSize};
    `,
    collapsableContainer: css`
      margin-top: ${theme.spacing(1)};
      margin-bottom: ${theme.spacing(1)};
    `,
    checkbox: css`
      margin-right: ${theme.spacing(1)};
      line-height: 1;
    `,
    headerText: css`
      font-size: ${theme.typography.h4.fontSize};
      font-weight: ${theme.typography.fontWeightBold};
      display: block;
    `,
    descriptionText: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      font-style: italic;
      display: block;
    `,
    buttonContainer: css`
      margin-left: ${theme.spacing(1)};
      margin-right: ${theme.spacing(1)};
    `,
    button: css`
      margin-right: ${theme.spacing(0.5)};
    `,
    inlineContainer: css`
      display: inline-flex;
    `,
    valueFieldContainer: css`
      display: flex;
    `,
    collapsableValuesContainer: css`
      padding-top: 0;
      margin-left: ${theme.spacing(3)};
    `,
  };
};

export interface Variable {
  uid: string;
  name: string;
  label?: string;
  desc?: string;
  values: string[];
}

export interface NewVariable {
  name?: string;
  label?: string;
  desc?: string;
  values?: string[];
}

interface DispatchProps {
  exploreId: ExploreId;
}

export function SavedItemsVariablesTab(props: DispatchProps) {
  const styles = useStyles2(getStyles);
  const dispatch = useDispatch();
  const checkedVariablesList = useSelector((state: StoreState) => state.explore[props.exploreId]?.variablesList || []);

  const [variablesList, setVariablesList] = useState([]);
  const [totalVariablesCount, setTotalVariablesCount] = useState(undefined);
  const [openVariables, setOpenVariables] = useState<string[]>([]);
  const [variableInEdit, setVariableInEdit] = useState<Variable | undefined>(undefined);
  const [variableToAdd, setVariableToAdd] = useState<NewVariable | undefined>(undefined);

  async function fetchVariables() {
    const variables = await api.loadVariables();
    setVariablesList(variables.result.exploreVariables);
    setTotalVariablesCount(variables.result.totalCount);
  }

  useEffect(() => {
    fetchVariables();
  }, []);

  // when a variable's values are being edited, we want to have a new field for new entries appear
  useEffect(() => {
    if (variableInEdit && variableInEdit.values[variableInEdit.values.length - 1] !== '') {
      const values = variableInEdit.values;
      values?.push('');
      setVariableInEdit({ ...variableInEdit, values: values });
    }
  }, [variableInEdit]);

  useEffect(() => {
    if (variableToAdd && variableToAdd.values && variableToAdd.values[variableToAdd.values.length - 1] !== '') {
      const values = variableToAdd.values;
      values?.push('');
      setVariableToAdd({ ...variableToAdd, values: values });
    }
  }, [variableToAdd]);

  //adds the variable to the explorePane state
  const checkVariable = (event: FormEvent<HTMLInputElement>) => {
    let list = [...checkedVariablesList];
    const checkedVariableUID = event.currentTarget.value;
    const findIdx = list.indexOf(checkedVariableUID);
    if (findIdx === -1) {
      list.push(checkedVariableUID);
    } else {
      list.splice(findIdx, 1);
    }
    dispatch(changeVariableListAction({ exploreId: props.exploreId, variables: list }));
  };

  const saveVariableEdit = async () => {
    if (variableInEdit) {
      await api.updateVariable(variableInEdit);
      await fetchVariables();
      setVariableInEdit(undefined);
    }
  };

  const deleteVariable = async (variable: Variable) => {
    await api.deleteVariable(variable.uid);
    await fetchVariables();
  };

  const addVariable = async () => {
    if (variableToAdd) {
      //TODO make sure name exists
      await api.addVariable(variableToAdd);
      await fetchVariables();
      setVariableToAdd(undefined);
    }
  };

  const displayText = (variable: Variable) => {
    const disableActions = !(variableInEdit === undefined);
    return (
      <>
        <div>
          <div className={styles.headerText}>
            {variable.label ? `${variable.label} (${variable.name})` : variable.name}
          </div>
          {variable.desc && <div className={styles.descriptionText}>{variable.desc}</div>}
        </div>
        <div className={styles.buttonContainer}>
          <Button
            className={styles.button}
            variant="secondary"
            icon="pen"
            disabled={disableActions}
            onClick={() => setVariableInEdit(variable)}
          >
            Edit
          </Button>
          <Button
            className={styles.button}
            variant="secondary"
            icon="times"
            disabled={disableActions}
            onClick={() => deleteVariable(variable)}
          >
            Delete
          </Button>
        </div>
      </>
    );
  };

  const displayFields = (variable: Variable) => {
    return (
      <>
        <div>
          <InlineField label="Label">
            <Input
              value={variable.label}
              onChange={(e) => {
                if (variableInEdit) {
                  setVariableInEdit({ ...variableInEdit, label: e.currentTarget.value });
                }
              }}
            />
          </InlineField>
          <InlineField label="Name">
            <Input
              value={variable.name}
              invalid={!variableInEdit || variableInEdit.name === undefined || variableInEdit.name === ''}
              onChange={(e) => {
                if (variableInEdit) {
                  setVariableInEdit({ ...variableInEdit, name: e.currentTarget.value });
                }
              }}
            />
          </InlineField>
          <InlineField label="Description">
            <Input
              value={variable.desc}
              onChange={(e) => {
                if (variableInEdit) {
                  setVariableInEdit({ ...variableInEdit, desc: e.currentTarget.value });
                }
              }}
            />
          </InlineField>
        </div>
        <div className={styles.buttonContainer}>
          <Button className={styles.button} variant="secondary" icon="save" onClick={() => saveVariableEdit()}>
            Save
          </Button>
          <Button
            className={styles.button}
            variant="secondary"
            icon="times"
            onClick={() => setVariableInEdit(undefined)}
          >
            Cancel
          </Button>
        </div>
      </>
    );
  };

  const displayValueText = (variable: Variable) => {
    const valueDivs = variable.values.map((value: string, index: number) => (
      <div key={`${variable.uid}-${index}`}>{value}</div>
    ));
    return <div>{valueDivs}</div>;
  };

  const displayValueFields = (variable: Variable) => {
    const valueFields = variable.values.map((value: string, index: number) => (
      <div className={styles.valueFieldContainer} key={`${variable.uid}-${index}`}>
        <InlineField label="Value">
          <Input
            value={value}
            onChange={(e) => {
              if (variableInEdit) {
                const variableValues = variableInEdit.values || [];
                if (variableValues[index]) {
                  variableValues[index] = e.currentTarget.value;
                } else if (variableValues.length - 1 >= 0) {
                  variableValues[variableValues.length - 1] = e.currentTarget.value;
                } else {
                  variableValues.push(e.currentTarget.value);
                }
                setVariableInEdit({ ...variableInEdit, values: variableValues });
              }
            }}
          />
        </InlineField>
        {index < variable.values.length - 1 && (
          <Button
            variant="secondary"
            icon="minus"
            onClick={() => {
              if (variableInEdit?.values?.[index]) {
                const variable = { ...variableInEdit };
                variable.values.splice(index, 1);
                setVariableInEdit({ ...variableInEdit, values: variable.values });
              }
            }}
          >
            Remove
          </Button>
        )}
      </div>
    ));
    return <div>{valueFields}</div>;
  };

  const displayNewVariable = () => {
    const validState = !variableToAdd || variableToAdd.name === undefined || variableToAdd.name === '';

    const valueFields = variableToAdd!.values!.map((value: string, index: number) => (
      <div className={styles.valueFieldContainer} key={`newVariable-${index}`}>
        <InlineField label="Value">
          <Input
            value={value}
            onChange={(e) => {
              if (variableToAdd) {
                const variableValues = variableToAdd.values || [];
                if (variableValues[index]) {
                  variableValues[index] = e.currentTarget.value;
                } else if (variableValues.length - 1 >= 0) {
                  variableValues[variableValues.length - 1] = e.currentTarget.value;
                } else {
                  variableValues.push(e.currentTarget.value);
                }
                setVariableToAdd({ ...variableToAdd, values: variableValues });
              }
            }}
          />
        </InlineField>
        {index < variableToAdd!.values!.length - 1 && (
          <Button
            variant="secondary"
            icon="minus"
            onClick={() => {
              if (variableToAdd?.values?.[index]) {
                const variable = { ...variableToAdd };
                variable!.values!.splice(index, 1);
                setVariableToAdd({ ...variableToAdd, values: variable.values });
              }
            }}
          >
            Remove
          </Button>
        )}
      </div>
    ));

    return (
      <>
        <div>
          <InlineField label="Label">
            <Input
              value={variableToAdd?.label || ''}
              onChange={(e) => {
                if (variableToAdd) {
                  setVariableToAdd({ ...variableToAdd, label: e.currentTarget.value });
                }
              }}
            />
          </InlineField>
          <InlineField label="Name">
            <Input
              value={variableToAdd?.name || ''}
              invalid={validState}
              onChange={(e) => {
                if (variableToAdd) {
                  setVariableToAdd({ ...variableToAdd, name: e.currentTarget.value });
                }
              }}
            />
          </InlineField>
          <InlineField label="Description">
            <Input
              value={variableToAdd?.desc || ''}
              onChange={(e) => {
                if (variableToAdd) {
                  setVariableToAdd({ ...variableToAdd, desc: e.currentTarget.value });
                }
              }}
            />
          </InlineField>
        </div>
        <div>{valueFields}</div>
        <div>
          <Button
            variant="secondary"
            icon="save"
            disabled={validState}
            onClick={() => {
              addVariable();
            }}
          >
            Save New Variable
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              setVariableToAdd(undefined);
            }}
          >
            Cancel
          </Button>
        </div>
      </>
    );
  };

  const onToggle = (isOpen: boolean, uid: string) => {
    // if the uid is in edit mode, be sure it is open and keep it that way
    if (variableInEdit && uid === variableInEdit.uid) {
      const index = openVariables.indexOf(uid);
      if (index === -1) {
        setOpenVariables([...openVariables, uid]);
      }
    } else {
      if (isOpen) {
        setOpenVariables([...openVariables, uid]);
      } else {
        const index = openVariables.indexOf(uid);
        setOpenVariables(openVariables.splice(index, 1));
      }
    }
  };

  return (
    <div className={styles.container}>
      <div>
        Click checkbox to add variable to explore view. The value in parenthesis will be the variable name to use in
        your query. For example, test can be written as &#36;&#123;test&#125;
      </div>
      <div>
        <Button
          variant="secondary"
          icon="x-add"
          disabled={variableToAdd !== undefined}
          onClick={() => {
            setVariableToAdd({ name: '', label: '', desc: '', values: [] });
          }}
        >
          Add Variable
        </Button>
      </div>
      {variableToAdd && displayNewVariable()}
      {variablesList.map((variable: Variable) => {
        return (
          <CollapsableSection
            key={`collapsable-${variable.uid}`}
            isOpen={openVariables.includes(variable.uid)}
            onToggle={(isOpen) => onToggle(isOpen, variable.uid)}
            className={styles.collapsableContainer}
            openOverride={variableInEdit && variable.uid === variableInEdit.uid}
            contentClassName={styles.collapsableValuesContainer}
            label={
              <>
                <div>
                  <Checkbox
                    onChange={checkVariable}
                    value={checkedVariablesList.includes(variable.uid)}
                    className={styles.checkbox}
                    htmlValue={variable.uid}
                    disabled={variableInEdit !== undefined}
                  />
                </div>
                <div className={styles.inlineContainer}>
                  {variableInEdit && variableInEdit.uid === variable.uid
                    ? displayFields(variableInEdit)
                    : displayText(variable)}
                </div>
              </>
            }
          >
            <div>
              {variableInEdit && variableInEdit.uid === variable.uid
                ? displayValueFields(variableInEdit)
                : displayValueText(variable)}
            </div>
          </CollapsableSection>
        );
      })}
      Showing {variablesList.length} of {totalVariablesCount}
    </div>
  );
}

export default SavedItemsVariablesTab;
