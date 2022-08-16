import { getBackendSrv } from '@grafana/runtime';

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
const updateVariable = async () => {};
const addVariable = async () => {};
const deleteVariable = async () => {};

export const api = {
  loadVariables,
  updateVariable,
  addVariable,
  deleteVariable,
};
