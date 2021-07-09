import React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { locationService } from '@grafana/runtime';
import RuleEditor from './RuleEditor';
import { configureStore } from '../../../store/configureStore';
import { GrafanaRouteComponentProps } from '../../../core/navigation/types';

const store = configureStore();
const renderRuleEditor = () => {
  return render(
    <Provider store={store}>
      <Router history={locationService.getHistory()}>
        <RuleEditor {...mockRoute} />
      </Router>
    </Provider>
  );
};

describe('Rule editor', () => {
  it('should render component', () => {
    renderRuleEditor();
  });
});

const mockRoute: GrafanaRouteComponentProps<{ id: string }> = {
  route: {
    path: '/',
    component: RuleEditor,
  },
  queryParams: {},
  match: { params: { id: 'test1' }, isExact: false, url: 'asdf', path: '' },
  history: locationService.getHistory(),
  location: { pathname: '', hash: '', search: '', state: '' },
  staticContext: {},
};
