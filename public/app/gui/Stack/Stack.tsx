import React, { ReactNode } from 'react';

import Box from '../Box/Box';
import { Sprinkles } from '../sprinkes.css';

interface StackProps {
  direction: Sprinkles['gridAutoFlow'];
  gap: Sprinkles['gap'];
  children: ReactNode;
}

export default function Stack({ direction, gap, children }: StackProps) {
  return (
    <Box display="grid" gridAutoFlow={direction} gap={gap}>
      {children}
    </Box>
  );
}
