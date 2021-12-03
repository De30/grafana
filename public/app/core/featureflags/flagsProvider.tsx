import React, { FC } from 'react';

export interface FeatureFlag {
  name: String;
}

const FlagContext = React.createContext<FeatureFlag[]>([]);

interface FlagProps {
  children: React.ReactNode;
  featureFlag: FeatureFlag;
}

export const ExperimentFlag: FC<FlagProps> = ({ children, featureFlag }) => {
  return (
    <FlagContextConsumer>
      {(value) => {
        if (
          value.find((v) => {
            return v.name === featureFlag.name;
          })
        ) {
          return children;
        }
        return null;
      }}
    </FlagContextConsumer>
  );
};

export const NormalFlag: FC<FlagProps> = ({ children, featureFlag }) => {
  return (
    <FlagContextConsumer>
      {(value) => {
        if (
          !value.find((v) => {
            return v.name === featureFlag.name;
          })
        ) {
          return children;
        }
        return null;
      }}
    </FlagContextConsumer>
  );
};

export const FlagContextProvider = FlagContext.Provider;
export const FlagContextConsumer = FlagContext.Consumer;

export const useFeatureFlagsContext = () => React.useContext(FlagContext);
