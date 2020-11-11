import { useRef, useEffect, useState } from 'react';
import { PlotContext } from '../state/PlotContext';
import { PlotConfig } from '../types';

/*
  Get a `PlotContext` for a plot.
*/
export const usePlotContext = (config: PlotConfig): PlotContext => {
  const contextRef = useRef<PlotContext | null>(null);
  const isFirstRender = useRef(true);
  const [revision, setRevision] = useState(0);

  if (contextRef.current === null) {
    contextRef.current = new PlotContext();
    contextRef.current.config = config;
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    contextRef.current!.config = config;
    setRevision(revision + 1);
  }, [config]);

  return contextRef.current;
};
