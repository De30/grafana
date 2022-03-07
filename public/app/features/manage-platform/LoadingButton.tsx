import React, { useRef, useState } from 'react';
import { Button, IconName } from '@grafana/ui';

type Props = {
  icon: IconName;
  text: string;
};

const TIMEOUT = 3000;

export const LoadingButton = ({ icon, text }: Props) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const loadingTimeout = useRef();

  const onMouseDown = () => {
    setHasStarted(true);
    loadingTimeout.current = setTimeout(() => {
      setIsCompleted(true);
      setHasStarted(false);
    }, TIMEOUT);
  };

  const onMouseUp = () => {
    loadingTimeout.current && clearTimeout(loadingTimeout.current);
    setHasStarted(false);
  };

  const onMouseMove = () => {
    onMouseUp();
  };

  const getIcon = () => {
    if (!isCompleted) {
      if (hasStarted) {
        icon = 'fa fa-spinner';
      }
    } else {
      icon = 'check';
    }

    return icon;
  };

  return (
    <Button icon={getIcon()} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove}>
      {text}
    </Button>
  );
};
