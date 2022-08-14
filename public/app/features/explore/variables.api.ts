import { getBackendSrv } from '@grafana/runtime';

const loadVariables = async (payload?: { searchString?: string }) => {
  try {
    return await getBackendSrv().get('/api/explore-variable', payload);
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
