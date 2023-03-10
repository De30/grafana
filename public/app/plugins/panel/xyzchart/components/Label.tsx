import { Text } from '@react-three/drei';
import React, { useContext } from 'react';

import { useTheme2 } from '@grafana/ui';

import { SCENE_SCALE, WHITE } from '../consts';
import { ScatterPlotOptions } from '../models.gen';
import OptionsContext from '../optionsContext';
import { Direction, LabelProps } from '../types';

export const Label = ({ direction, labelSize, position, rotation, text }: LabelProps) => {
  const options: ScatterPlotOptions = useContext(OptionsContext);
  const fontSize = labelSize ? labelSize : (SCENE_SCALE * 0.2) / 10;
  const color = options.themeColor ?? WHITE;
  const theme = useTheme2();

  // Negative percentages don't work beyond -100% hence using
  // local units in that case instead
  const anchorX = direction === Direction.Right ? "116%" : -1.15;

  return (
    <Text
      color={color}
      font={theme.typography.fontFamilyMonospace}
      textAlign="left"
      //@ts-ignore
      anchorX={anchorX}
      fontSize={fontSize}
      position={position}
      rotation={rotation}
    >
      {text}
    </Text>
  );
};
