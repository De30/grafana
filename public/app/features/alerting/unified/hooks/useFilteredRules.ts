import { SyntaxNode } from '@lezer/common';
import produce from 'immer';
import { compact, trim } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';

import { getDataSourceSrv } from '@grafana/runtime';
import { useQueryParams } from 'app/core/hooks/useQueryParams';
import { Matcher } from 'app/plugins/datasource/alertmanager/types';
import { CombinedRuleGroup, CombinedRuleNamespace } from 'app/types/unified-alerting';
import {
  isPromAlertingRuleState,
  PromAlertingRuleState,
  PromRuleType,
  RulerGrafanaRuleDTO,
} from 'app/types/unified-alerting-dto';

import { parser } from '../search/search';
import * as terms from '../search/search.terms';
import { labelsMatchMatchers, matcherToMatcherField, parseMatcher, parseMatchers } from '../utils/alertmanager';
import { isCloudRulesSource } from '../utils/datasource';
import { getFiltersFromUrlParams } from '../utils/misc';
import { isAlertingRule, isGrafanaRulerRule } from '../utils/rules';

import { useURLSearchParams } from './useURLSearchParams';

export interface SearchFilterState {
  // query?: string;
  freeFormWords: string[];
  namespace?: string;
  groupName?: string;
  ruleName?: string;
  ruleState?: PromAlertingRuleState; // Unify somehow with Prometheus rules
  ruleType?: PromRuleType;
  dataSourceName?: string;
  labels: string[];
}

const filterTermToTypeMap: Record<number, string> = {
  [terms.DataSourceFilter]: 'ds',
  [terms.NameSpaceFilter]: 'ns',
  [terms.LabelFilter]: 'l',
  [terms.RuleFilter]: 'r',
  [terms.StateFilter]: 's',
  [terms.TypeFilter]: 't',
  [terms.GroupFilter]: 'g',
};

function isPromRuleType(ruleType: string): ruleType is PromRuleType {
  return Object.values<string>(PromRuleType).includes(ruleType);
}

function getSearchFilterFromQuery(query: string): SearchFilterState {
  const parsed = parser.parse(query);

  const filterState: SearchFilterState = { labels: [], freeFormWords: [] };
  const freeFormWords: string[] = [];

  let cursor = parsed.cursor();
  do {
    if (cursor.node.type.id === terms.FilterExpression) {
      // ds:prom FilterExpression
      // ds: DataSourceFilter prom FilterValue
      const valueNode = cursor.node.firstChild?.getChild(terms.FilterValue);
      const filterValue = valueNode ? trim(query.substring(valueNode.from, valueNode.to), '"') : undefined;

      // ds | ns | group | etc...
      const filterType = cursor.node.firstChild?.type.id;

      if (filterType && filterValue) {
        switch (filterType) {
          case terms.DataSourceFilter:
            filterState.dataSourceName = filterValue;
            break;
          case terms.NameSpaceFilter:
            filterState.namespace = filterValue;
            break;
          case terms.GroupFilter:
            filterState.groupName = filterValue;
            break;
          case terms.RuleFilter:
            filterState.ruleName = filterValue;
            break;
          case terms.LabelFilter:
            filterState.labels.push(filterValue);
            break;
          case terms.StateFilter:
            const state = filterValue.toLowerCase();
            if (isPromAlertingRuleState(state)) {
              filterState.ruleState = state;
            }
            break;
          case terms.TypeFilter:
            if (isPromRuleType(filterValue)) {
              filterState.ruleType = filterValue;
            }
            break;
        }
      }
    } else if (cursor.node.type.id === terms.FreeFormExpression) {
      freeFormWords.push(query.slice(cursor.node.from, cursor.node.to));
      filterState.freeFormWords.push(query.slice(cursor.node.from, cursor.node.to));
    }
  } while (cursor.next());

  return filterState;
}

function updateSearchFilterQuery(query: string, filter: SearchFilterState): string {
  const parsed = parser.parse(query);

  let cursor = parsed.cursor();

  const filterStateArray: Array<{ type: number; value: string }> = [];
  if (filter.freeFormWords) {
    filterStateArray.push(...filter.freeFormWords.map((word) => ({ type: terms.FreeFormExpression, value: word })));
  }
  if (filter.dataSourceName) {
    filterStateArray.push({ type: terms.DataSourceFilter, value: filter.dataSourceName });
  }
  if (filter.namespace) {
    filterStateArray.push({ type: terms.NameSpaceFilter, value: filter.namespace });
  }
  if (filter.groupName) {
    filterStateArray.push({ type: terms.GroupFilter, value: filter.groupName });
  }
  if (filter.ruleName) {
    filterStateArray.push({ type: terms.RuleFilter, value: filter.ruleName });
  }
  if (filter.ruleState) {
    filterStateArray.push({ type: terms.StateFilter, value: filter.ruleState });
  }
  if (filter.ruleType) {
    filterStateArray.push({ type: terms.TypeFilter, value: filter.ruleType });
  }
  if (filter.labels) {
    filterStateArray.push(...filter.labels.map((l) => ({ type: terms.LabelFilter, value: l })));
  }

  const existingTreeFilters: SyntaxNode[] = [];

  do {
    if (cursor.node.type.id === terms.FilterExpression && cursor.node.firstChild) {
      existingTreeFilters.push(cursor.node.firstChild);
    }
    if (cursor.node.type.id === terms.FreeFormExpression) {
      existingTreeFilters.push(cursor.node);
    }
  } while (cursor.next());

  let newQueryExpressions: string[] = [];

  existingTreeFilters.map((filterNode) => {
    const matchingFilterIdx = filterStateArray.findIndex((f) => f.type === filterNode.type.id);
    const filterValueNode = filterNode.getChild(terms.FilterValue);
    if (matchingFilterIdx !== -1 && filterValueNode) {
      const filterToken = query.substring(filterNode.from, filterValueNode.from); // Extract the filter type only
      const filterItem = filterStateArray.splice(matchingFilterIdx, 1)[0];
      newQueryExpressions.push(`${filterToken}${getSafeFilterValue(filterItem.value)}`);
    } else if (matchingFilterIdx !== -1 && filterNode.node.type.id === terms.FreeFormExpression) {
      const freeFormWordNode = filterStateArray.splice(matchingFilterIdx, 1)[0];
      newQueryExpressions.push(freeFormWordNode.value);
    }
  });

  filterStateArray.forEach((fs) => {
    newQueryExpressions.push(`${filterTermToTypeMap[fs.type]}:${getSafeFilterValue(fs.value)}`);
  });

  return newQueryExpressions.join(' ');
}

function getSafeFilterValue(filterValue: string) {
  const containsWhiteSpaces = /\s/.test(filterValue);
  return containsWhiteSpaces ? `\"${filterValue}\"` : filterValue;
}

export function useRulesFilter() {
  const [queryParams, updateQueryParams] = useURLSearchParams();
  const searchQuery = queryParams.get('search') ?? '';

  const filterState = getSearchFilterFromQuery(searchQuery);

  const updateFilters = useCallback(
    (newFilter: SearchFilterState) => {
      const newSearchQuery = updateSearchFilterQuery(searchQuery, newFilter);
      updateQueryParams({ search: newSearchQuery });
    },
    [searchQuery, updateQueryParams]
  );

  const setSearchQuery = useCallback(
    (newSearchQuery: string | undefined) => {
      updateQueryParams({ search: newSearchQuery });
    },
    [updateQueryParams]
  );

  // Handle legacy filters
  useEffect(() => {
    const legacyFilters = {
      dataSource: queryParams.get('dataSource') ?? undefined,
      alertState: queryParams.get('alertState') ?? undefined,
      ruleType: queryParams.get('ruleType') ?? undefined,
      labels: parseMatchers(queryParams.get('queryString') ?? '').map(matcherToMatcherField),
    };

    const hasLegacyFilters = Object.values(legacyFilters).some((lf) => (Array.isArray(lf) ? lf.length > 0 : !!lf));
    if (hasLegacyFilters) {
      updateQueryParams({ dataSource: undefined, alertState: undefined, ruleType: undefined, queryString: undefined });
      // Existing query filters takes precedence over legacy ones
      updateFilters(
        produce(filterState, (draft) => {
          draft.dataSourceName ??= legacyFilters.dataSource;
          if (legacyFilters.alertState && isPromAlertingRuleState(legacyFilters.alertState)) {
            draft.ruleState ??= legacyFilters.alertState;
          }
          if (legacyFilters.ruleType && isPromRuleType(legacyFilters.ruleType)) {
            draft.ruleType ??= legacyFilters.ruleType;
          }
          if (draft.labels.length === 0 && legacyFilters.labels.length > 0) {
            const legacyLabelsAsStrings = legacyFilters.labels.map(
              ({ name, operator, value }) => `${name}${operator}${value}`
            );
            draft.labels.push(...legacyLabelsAsStrings);
          }
        })
      );
    }
  }, [queryParams, updateFilters, filterState, updateQueryParams]);

  return { filterState, searchQuery, setSearchQuery, updateFilters };
}

export const useFilteredRules = (namespaces: CombinedRuleNamespace[]) => {
  const { filterState } = useRulesFilter();
  return useMemo(() => filterRules(namespaces, filterState), [namespaces, filterState]);
};

export const filterRules = (
  namespaces: CombinedRuleNamespace[],
  ngFilters: SearchFilterState = { labels: [], freeFormWords: [] }
): CombinedRuleNamespace[] => {
  return (
    namespaces
      .filter((ns) => (ngFilters.namespace ? ns.name.toLowerCase().includes(ngFilters.namespace.toLowerCase()) : true))
      .filter(({ rulesSource }) =>
        ngFilters.dataSourceName && isCloudRulesSource(rulesSource)
          ? rulesSource.name === ngFilters.dataSourceName
          : true
      )
      // If a namespace and group have rules that match the rules filters then keep them.
      .reduce(reduceNamespaces(ngFilters), [] as CombinedRuleNamespace[])
  );
};

const reduceNamespaces = (ngFilters: SearchFilterState) => {
  return (namespaceAcc: CombinedRuleNamespace[], namespace: CombinedRuleNamespace) => {
    const groups = namespace.groups
      .filter((g) => (ngFilters.groupName ? g.name.toLowerCase().includes(ngFilters.groupName.toLowerCase()) : true))
      .reduce(reduceGroups(ngFilters), [] as CombinedRuleGroup[]);

    if (groups.length) {
      namespaceAcc.push({
        ...namespace,
        groups,
      });
    }

    return namespaceAcc;
  };
};

// Reduces groups to only groups that have rules matching the filters
const reduceGroups = (ngFilters: SearchFilterState) => {
  return (groupAcc: CombinedRuleGroup[], group: CombinedRuleGroup) => {
    const rules = group.rules.filter((rule) => {
      if (ngFilters.ruleType && ngFilters.ruleType !== rule.promRule?.type) {
        return false;
      }
      if (
        ngFilters.dataSourceName &&
        isGrafanaRulerRule(rule.rulerRule) &&
        !isQueryingDataSource(rule.rulerRule, ngFilters)
      ) {
        return false;
      }

      const ruleNameLc = rule.name?.toLocaleLowerCase();
      // Free Form Query is used to filter by rule name
      if (
        ngFilters.freeFormWords.length > 0 &&
        !ngFilters.freeFormWords.every((w) => ruleNameLc.includes(w.toLocaleLowerCase()))
      ) {
        return false;
      }

      if (ngFilters.ruleName && !rule.name?.toLocaleLowerCase().includes(ngFilters.ruleName.toLocaleLowerCase())) {
        return false;
      }
      // Query strings can match alert name, label keys, and label values
      if (ngFilters.labels.length > 0) {
        // const matchers = parseMatchers(filters.queryString);
        const matchers = compact(ngFilters.labels.map(looseParseMatcher));

        const doRuleLabelsMatchQuery = matchers.length > 0 && labelsMatchMatchers(rule.labels, matchers);
        const doAlertsContainMatchingLabels =
          matchers.length > 0 &&
          rule.promRule &&
          rule.promRule.type === PromRuleType.Alerting &&
          rule.promRule.alerts &&
          rule.promRule.alerts.some((alert) => labelsMatchMatchers(alert.labels, matchers));

        if (!(doRuleLabelsMatchQuery || doAlertsContainMatchingLabels)) {
          return false;
        }
      }
      if (
        ngFilters.ruleState &&
        !(rule.promRule && isAlertingRule(rule.promRule) && rule.promRule.state === ngFilters.ruleState)
      ) {
        return false;
      }
      return true;
    });
    // Add rules to the group that match the rule list filters
    if (rules.length) {
      groupAcc.push({
        ...group,
        rules,
      });
    }
    return groupAcc;
  };
};

function looseParseMatcher(matcherQuery: string): Matcher | undefined {
  try {
    return parseMatcher(matcherQuery);
  } catch {
    // Try to createa a matcher than matches all values for a given key
    return { name: matcherQuery, value: '', isRegex: true, isEqual: true };
  }
}

const isQueryingDataSource = (rulerRule: RulerGrafanaRuleDTO, ngFilter: SearchFilterState): boolean => {
  if (!ngFilter.dataSourceName) {
    return true;
  }

  return !!rulerRule.grafana_alert.data.find((query) => {
    if (!query.datasourceUid) {
      return false;
    }
    const ds = getDataSourceSrv().getInstanceSettings(query.datasourceUid);
    return ds?.name === ngFilter.dataSourceName;
  });
};
