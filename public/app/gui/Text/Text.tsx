import React, { ReactNode } from 'react';

interface TextProps {
  children: ReactNode;
}

export default function Text({ children }: TextProps) {
  return <div>{children}</div>;
}
