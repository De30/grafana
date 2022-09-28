import React, { CSSProperties, useContext } from 'react';

// Extract it 
import { SceneObjectSize } from '../../core/types';

export type FlexLayoutDirection = 'column' | 'row';

interface FlexLayoutContext {
  direction: FlexLayoutDirection;
}

interface FlexLayoutProps {
  direction?: FlexLayoutDirection;
  children: React.ReactNode;
}

const FlexConfigContext = React.createContext<FlexLayoutContext>({direction: 'row'});

export function FlexLayout({ direction = 'row', children }: FlexLayoutProps) {
  return (
    <FlexConfigContext.Provider value={{ direction }}>
      <div style={{ flexGrow: 1, flexDirection: direction, display: 'flex', gap: '8px' }}>{children}</div>
    </FlexConfigContext.Provider>
  );
}

FlexLayout.Item = FlexLayoutItem;

interface FlexLayoutItemProps {
  size?: SceneObjectSize;
  children: React.ReactNode;
}

export function FlexLayoutItem({ size, children }:FlexLayoutItemProps) {
  const { direction } = useContext<FlexLayoutContext>(FlexConfigContext);

  return <div style={getItemStyles(direction, size)}>{children}</div>;
}

function getItemStyles(direction: FlexLayoutDirection, sizing: SceneObjectSize = {}) {
  const { xSizing = 'fill', ySizing = 'fill' } = sizing;

  const style: CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    minWidth: sizing.minWidth,
    minHeight: sizing.minHeight,
  };

  if (direction === 'column') {
    if (sizing.height) {
      style.height = sizing.height;
    } else {
      style.flexGrow = ySizing === 'fill' ? 1 : 0;
    }

    if (sizing.width) {
      style.width = sizing.width;
    } else {
      style.alignSelf = xSizing === 'fill' ? 'stretch' : 'flex-start';
    }
  } else {
    if (sizing.height) {
      style.height = sizing.height;
    } else {
      style.alignSelf = ySizing === 'fill' ? 'stretch' : 'flex-start';
    }

    if (sizing.width) {
      style.width = sizing.width;
    } else {
      style.flexGrow = xSizing === 'fill' ? 1 : 0;
    }
  }

  return style;
}
