import React from 'react';
import { StoryboardDocumentElement } from '../../types';
import { css } from '@emotion/css';

export function CellType({ element }: { element: StoryboardDocumentElement }): JSX.Element {
  return (
    <div
      className={css`
        margin-top: 20px;
        opacity: 0.5;
      `}
    >
      {element.type} — <strong>#{element.id}</strong>{' '}
      <i className="fa fa-pencil-square" style={{ color: 'skyblue', cursor: 'pointer' }}></i>
    </div>
  );
}
