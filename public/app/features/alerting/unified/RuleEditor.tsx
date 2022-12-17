import React, { useCallback } from 'react';
import { useAsync } from 'react-use';

import { NavModelItem, PageLayoutType } from '@grafana/data';
import { Button, ToolbarButtonRow, withErrorBoundary } from '@grafana/ui';
import { AppChromeUpdate } from 'app/core/components/AppChrome/AppChromeUpdate';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { useDispatch } from 'app/types';

import { AlertWarning } from './AlertWarning';
import { CloneRuleEditor } from './CloneRuleEditor';
import { ExistingRuleEditor } from './ExistingRuleEditor';
import { AlertingPageWrapper } from './components/AlertingPageWrapper';
import { AlertRuleForm } from './components/rule-editor/AlertRuleForm';
import { useURLSearchParams } from './hooks/useURLSearchParams';
import { fetchRulesSourceBuildInfoAction } from './state/actions';
import { useRulesAccess } from './utils/accessControlHooks';
import * as ruleId from './utils/rule-id';

type RuleEditorProps = GrafanaRouteComponentProps<{ id?: string }>;

const defaultPageNav: Partial<NavModelItem> = {
  icon: 'bell',
  id: 'alert-rule-view',
  breadcrumbs: [{ title: 'Alert rules', url: 'alerting/list' }],
};

const getPageNav = (state: 'edit' | 'add') => {
  if (state === 'edit') {
    return { ...defaultPageNav, id: 'alert-rule-edit', text: 'Edit rule' };
  } else if (state === 'add') {
    return { ...defaultPageNav, id: 'alert-rule-add', text: 'Add rule' };
  }
  return undefined;
};

const RuleEditor = ({ match }: RuleEditorProps) => {
  const dispatch = useDispatch();
  const [searchParams] = useURLSearchParams();

  const { id } = match.params;
  const identifier = ruleId.tryParse(id, true);

  const copyFromId = searchParams.get('copyFrom') ?? undefined;
  const copyFromIdentifier = ruleId.tryParse(copyFromId);

  const { loading = true } = useAsync(async () => {
    if (identifier) {
      await dispatch(fetchRulesSourceBuildInfoAction({ rulesSourceName: identifier.ruleSourceName }));
    }
  }, [dispatch]);

  const { canCreateGrafanaRules, canCreateCloudRules, canEditRules } = useRulesAccess();

  const getContent = useCallback(() => {
    if (loading) {
      return;
    }

    if (!identifier && !canCreateGrafanaRules && !canCreateCloudRules) {
      return <AlertWarning title="Cannot create rules">Sorry! You are not allowed to create rules.</AlertWarning>;
    }

    if (identifier && !canEditRules(identifier.ruleSourceName)) {
      return <AlertWarning title="Cannot edit rules">Sorry! You are not allowed to edit rules.</AlertWarning>;
    }

    if (copyFromIdentifier) {
      return <CloneRuleEditor sourceRuleId={copyFromIdentifier} />;
    }

    return <AlertRuleForm />;
  }, [canCreateCloudRules, canCreateGrafanaRules, canEditRules, copyFromIdentifier, identifier, loading]);

  if (identifier && canEditRules(identifier.ruleSourceName)) {
    return (
      <AlertingPageWrapper
        isLoading={loading}
        pageId="alert-list"
        pageNav={getPageNav('edit')}
        layout={PageLayoutType.Custom}
      >
        <ExistingRuleEditor key={id} identifier={identifier} />;
      </AlertingPageWrapper>
    );
  }

  if (!identifier) {
    return (
      <AlertingPageWrapper
        pageId="alert-list"
        pageNav={getPageNav('add')}
        layout={PageLayoutType.Custom}
        toolbar={
          <AppChromeUpdate
            actions={
              <ToolbarButtonRow alignment="right">
                <Button type="button" variant="destructive" size="sm" fill="outline">
                  Discard
                </Button>
                <Button type="button" size="sm">
                  Save
                </Button>
              </ToolbarButtonRow>
            }
          />
        }
      >
        <AlertRuleForm />
      </AlertingPageWrapper>
    );
  }

  return (
    <AlertingPageWrapper isLoading={loading} pageId="alert-list" pageNav={getPageNav(identifier ? 'edit' : 'add')}>
      {getContent()}
    </AlertingPageWrapper>
  );
};

export default withErrorBoundary(RuleEditor, { style: 'page' });
