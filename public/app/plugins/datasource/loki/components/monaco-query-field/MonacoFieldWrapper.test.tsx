import { render, screen } from '@testing-library/react';
import React from 'react';

import { createLokiDatasource } from '../../mocks';

import { MonacoQueryFieldWrapper, Props } from './MonacoQueryFieldWrapper';

function renderComponent({
  initialValue = '',
  onChange = jest.fn(),
  onRunQuery = jest.fn(),
  runQueryOnBlur = false,
}: Partial<Props> = {}) {
  const datasource = createLokiDatasource();

  render(
    <MonacoQueryFieldWrapper
      datasource={datasource}
      history={[]}
      initialValue={initialValue}
      onChange={onChange}
      onRunQuery={onRunQuery}
      runQueryOnBlur={runQueryOnBlur}
    />
  );
}

describe('MonacoFieldWrapper', () => {
  test('Renders with no errors', async () => {
    renderComponent();

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
  });
});
