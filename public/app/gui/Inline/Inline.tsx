import React, { ReactNode } from 'react';

import Box from '../Box/Box';
import { Sprinkles } from '../sprinkes.css';

interface InlineProps {
  gap: Sprinkles['gap'];
  children: ReactNode;
}

export default function Inline({ gap, children }: InlineProps) {
  return (
    <Box display="flex" flexDirection="row" flexWrap="wrap" gap={gap}>
      {React.Children.map(children, (child) => (
        <Box>{child}</Box>
      ))}
    </Box>
  );
}
