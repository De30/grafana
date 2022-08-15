import { css } from '@emotion/css';
import React, { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, CollapsableSection, useStyles2 } from '@grafana/ui';
import { StoreState } from 'app/types';
import { ExploreId } from 'app/types/explore';

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
    spaceBetween: css`
      margin-bottom: ${theme.spacing(2)};
    `,
    checkbox: css`
      margin-right: ${theme.spacing(1)};
      line-height: 1 !important;
    `,
    input: css`
      max-width: 200px;
    `,
  };
};

interface Variable {
  uid: string;
  name: string;
  label: string;
  desc: string;
  values: string;
}

export function SavedItemsVariablesTab(props: SavedItemsVariablesTabProps) {
  const styles = useStyles2(getStyles);
  const dispatch = useDispatch();
  const checkedVariablesList: string[] =
    useSelector((state: StoreState) => state.explore[props.exploreId]?.variables) || [];
  //props.checkedVariables || [];

  const [variablesList, setVariablesList] = useState([]);
  const [totalVariablesCount, setTotalVariablesCount] = useState(undefined);

  useEffect(() => {
    async function fetchVariables() {
      const variables = await api.loadVariables();
      console.log(variables);
      setVariablesList(variables.result.exploreVariables);
      setTotalVariablesCount(variables.result.totalCount);
    }

    fetchVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkVariable = (event: FormEvent<HTMLInputElement>) => {
    let list = [...checkedVariablesList];
    const checkedVariableUID = event.currentTarget.value;
    const findIdx = list.indexOf(checkedVariableUID);
    if (findIdx === -1) {
      list.push(checkedVariableUID);
    } else {
      list.splice(findIdx, 1);
    }
    dispatch(changeVariableListAction({ variables: list }));
    console.log(event);
  };

  return (
    <div className={styles.container}>
      Click checkbox to add variable to explore view.
      {variablesList.map((variable: Variable) => {
        const displayText =
          (variable.label ? `${variable.label} (${variable.name})` : variable.name) +
          (variable.desc ? ` - ${variable.desc}` : '');

        return (
          <CollapsableSection
            key={`collapsable-${variable.uid}`}
            isOpen={false}
            label={
              <>
                <Checkbox onChange={checkVariable} className={styles.checkbox} htmlValue={variable.uid} />
                {displayText}
              </>
            }
          >
            {variable.values.toString()}
          </CollapsableSection>
        );
      })}
      Showing {variablesList.length} of {totalVariablesCount}
    </div>
  );
}
