import React, { ReactNode } from 'react';

import Box from '../Box/Box';
import Heading from '../Heading/Heading';
import Stack from '../Stack/Stack';
import Text from '../Text/Text';

interface CardProps {
  title: ReactNode;
  description: ReactNode;
}

export default function Card({ title, description }: CardProps) {
  return (
    <Box padding="medium" background="secondary" borderRadius="small">
      <Stack direction="row" gap="small">
        <Heading level={6}>{title}</Heading>
        <Text>{description}</Text>
      </Stack>
    </Box>
  );
}
