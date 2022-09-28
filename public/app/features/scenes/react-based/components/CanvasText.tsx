import React, { CSSProperties } from 'react';

export interface SceneCanvasTextProps {
  text: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
}

export function CanvasText ({ text, fontSize = 20, align = 'left' }: SceneCanvasTextProps) {
    const style: CSSProperties = {
      fontSize: fontSize,
      display: 'flex',
      flexGrow: 1,
      alignItems: 'center',
      padding: 16,
      justifyContent: align,
    };

    return <div style={style}>{text}</div>;
}