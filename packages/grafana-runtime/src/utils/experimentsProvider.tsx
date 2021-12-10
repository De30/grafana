import React, { FC } from 'react';

const ExperimentsContext = React.createContext<{ [key: string]: boolean }>({});

interface ExperimentProps {
  children: React.ReactNode;
  experimentName: string;
  stable?: React.ReactNode;
}

export const Experiment: FC<ExperimentProps> = ({ children, experimentName, stable }) => {
  return (
    <ExperimentContextConsumer>
      {(value) => {
        if (value[experimentName]) {
          return children;
        }
        return stable;
      }}
    </ExperimentContextConsumer>
  );
};

export const ExperimentContextProvider = ExperimentsContext.Provider;
export const ExperimentContextConsumer = ExperimentsContext.Consumer;

export const useExperiment = (experimentName: string) => {
  const context = React.useContext(ExperimentsContext);
  return context[experimentName];
};
