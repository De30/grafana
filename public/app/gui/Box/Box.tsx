import React, { ReactNode } from 'react';

import { sprinkles, Sprinkles } from '../sprinkes.css';

interface BoxProps extends Sprinkles {
  children: ReactNode;
}

export default function Box({ children, ...sprinkleProps }: BoxProps) {
  return <div className={sprinkles(sprinkleProps)}>{children}</div>;
}
