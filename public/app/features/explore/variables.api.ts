import { getBackendSrv } from '@grafana/runtime';

import { NewVariable, Variable } from './RichHistory/SavedItemsVariablesTab';

const loadVariables = async (payload?: { searchString?: string; uids?: string[] }) => {
  try {
    let paramStr = '?searchString';
    if (payload?.searchString) {
      paramStr += `=${payload.searchString}`;
    }

    let uidFilter = '';
    if (payload && payload.uids && payload.uids.length > 0) {
      payload.uids.forEach((uid) => {
        uidFilter += `&uid=${uid}`;
      });
    }

    paramStr += uidFilter;
    return await getBackendSrv().get(`/api/explore-variable${paramStr}`);
  } catch (err) {
    console.error(err);
  }
};

const updateVariable = async (variable: Variable) => {
  try {
    return await getBackendSrv().patch(`/api/explore-variable/${variable.uid}`, variable);
  } catch (err) {
    console.error(err);
  }
};

const addVariable = async (variable: NewVariable) => {
  try {
    return await getBackendSrv().post(`/api/explore-variable/`, variable);
  } catch (err) {
    console.error(err);
  }
};

const deleteVariable = async (uid: string) => {
  try {
    return await getBackendSrv().delete(`/api/explore-variable/${uid}`);
  } catch (err) {
    console.error(err);
  }
};

export const api = {
  loadVariables,
  updateVariable,
  addVariable,
  deleteVariable,
};
