import React, { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { withErrorBoundary } from '@grafana/ui';
import { useQueryParams } from 'app/core/hooks/useQueryParams';

import { AlertingPageWrapper } from './components/AlertingPageWrapper';
import { RuleListErrors } from './components/rules/RuleListErrors';
import { RuleListGroupView } from './components/rules/RuleListGroupView';
import { RuleListListView } from './components/rules/RuleListListView';
import { useCombinedRuleNamespaces } from './hooks/useCombinedRuleNamespaces';
import { useFilteredRules } from './hooks/useFilteredRules';
import { useUnifiedAlertingSelector } from './hooks/useUnifiedAlertingSelector';
import { fetchAllPromAndRulerRulesAction } from './state/actions';
import { RULE_LIST_POLL_INTERVAL_MS } from './utils/constants';
import { getAllRulesSourceNames } from './utils/datasource';

const VIEWS = {
  list: RuleListListView,
  groups: RuleListGroupView,
};

const RuleList = withErrorBoundary(
  () => {
    const dispatch = useDispatch();
    const rulesDataSourceNames = useMemo(getAllRulesSourceNames, []);

    const [queryParams] = useQueryParams();

    const view = VIEWS[queryParams['view'] as keyof typeof VIEWS]
      ? (queryParams['view'] as keyof typeof VIEWS)
      : 'list';

    const ViewComponent = VIEWS[view];

    // fetch rules, then poll every RULE_LIST_POLL_INTERVAL_MS
    useEffect(() => {
      dispatch(fetchAllPromAndRulerRulesAction());
      const interval = setInterval(() => dispatch(fetchAllPromAndRulerRulesAction()), RULE_LIST_POLL_INTERVAL_MS);
      return () => {
        clearInterval(interval);
      };
    }, [dispatch]);

    const promRuleRequests = useUnifiedAlertingSelector((state) => state.promRules);
    const rulerRuleRequests = useUnifiedAlertingSelector((state) => state.rulerRules);

    const loading = rulesDataSourceNames.some(
      (name) => promRuleRequests[name]?.loading || rulerRuleRequests[name]?.loading
    );
    const haveResults = rulesDataSourceNames.some(
      (name) =>
        (promRuleRequests[name]?.result?.length && !promRuleRequests[name]?.error) ||
        (Object.keys(rulerRuleRequests[name]?.result || {}).length && !rulerRuleRequests[name]?.error)
    );

    const combinedNamespaces = useCombinedRuleNamespaces();
    const filteredNamespaces = useFilteredRules(combinedNamespaces);
    return (
      <AlertingPageWrapper pageId="alert-list" isLoading={loading && !haveResults}>
        <RuleListErrors />
        {haveResults && <ViewComponent namespaces={filteredNamespaces} expandAll={false} />}
      </AlertingPageWrapper>
    );
  },
  { style: 'page' }
);

export default RuleList;
