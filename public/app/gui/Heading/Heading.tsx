import { createElement, ReactNode } from 'react';

import { headingStyles } from './heading.css';

interface HeadingProps {
  level: keyof typeof componentMap;
  children: ReactNode;
}

const componentMap = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
};

export default function Heading({ level, children }: HeadingProps) {
  const component = componentMap[level];

  return createElement(
    component,
    {
      className: headingStyles[level],
    },
    children
  );
}
