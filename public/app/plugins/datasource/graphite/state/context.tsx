import React, { createContext, Dispatch, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { AnyAction } from '@reduxjs/toolkit';
import { QueryEditorProps } from '@grafana/data';
import { GraphiteDatasource } from '../datasource';
import { GraphiteOptions, GraphiteQuery } from '../types';
import { createStore, GraphiteQueryEditorState } from './store';
import { actions } from './actions';
import { useDebounce } from 'react-use';

const DispatchContext = createContext<Dispatch<AnyAction>>({} as Dispatch<AnyAction>);
const GraphiteStateContext = createContext<GraphiteQueryEditorState>({} as GraphiteQueryEditorState);

export const useDispatch = () => {
  return useContext(DispatchContext);
};

export const useGraphiteState = () => {
  return useContext(GraphiteStateContext);
};

export type GraphiteQueryEditorProps = QueryEditorProps<GraphiteDatasource, GraphiteQuery, GraphiteOptions>;

export const GraphiteQueryEditorContext = ({
  datasource,
  onRunQuery,
  onChange,
  query,
  queries,
  range,
  children,
}: PropsWithChildren<GraphiteQueryEditorProps>) => {
  const [state, setState] = useState<GraphiteQueryEditorState>();

  const dispatch = useMemo(() => {
    return createStore((state) => {
      setState(state);
    });
  }, []);

  // Debounce because range and onChange is modified multiple times in a single frame during initialization
  useDebounce(
    () => {
      dispatch(
        actions.updateProps({
          target: query,
          datasource: datasource,
          range: range,
          queries: queries || [],
          refresh: (target: string) => {
            onChange({ ...query, target: target });
            onRunQuery();
          },
        })
      );
    },
    0,
    [query, datasource, range, queries, onChange, onRunQuery, dispatch]
  );

  if (!state) {
    return null;
  } else {
    return (
      <GraphiteStateContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
      </GraphiteStateContext.Provider>
    );
  }
};
