import { DataSourceInstanceSettings } from '@grafana/data/';

import { CombinedRuleNamespace, RuleNamespace, RulesSource } from '../../../../types/unified-alerting';
import { AsyncRequestMapSlice } from '../utils/redux';

interface RulesMessage {
  rulesSources: RulesSource[];
  promRulesResponses: AsyncRequestMapSlice<RuleNamespace[]>;
}

self.addEventListener('message', async ({ data }: MessageEvent<RulesMessage>) => {
  console.log(data);
  // rulesSources
  //   .map((rulesSource): CombinedRuleNamespace[] => {
  //     const rulesSourceName = isCloudRulesSource(rulesSource) ? rulesSource.name : rulesSource;
  //     const promRules = promRules[rulesSourceName]?.result;
  //     const rulerRules = rulerRulesResponses[rulesSourceName]?.result;
  //
  //     const cached = cache.current[rulesSourceName];
  //     if (cached && cached.promRules === promRules && cached.rulerRules === rulerRules) {
  //       return cached.result;
  //     }
  //     const namespaces: Record<string, CombinedRuleNamespace> = {};
  //
  //     // first get all the ruler rules in
  //     Object.entries(rulerRules || {}).forEach(([namespaceName, groups]) => {
  //       const namespace: CombinedRuleNamespace = {
  //         rulesSource,
  //         name: namespaceName,
  //         groups: [],
  //       };
  //       namespaces[namespaceName] = namespace;
  //       addRulerGroupsToCombinedNamespace(namespace, groups);
  //     });
  //
  //     // then correlate with prometheus rules
  //     promRules?.forEach(({ name: namespaceName, groups }) => {
  //       const ns = (namespaces[namespaceName] = namespaces[namespaceName] || {
  //         rulesSource,
  //         name: namespaceName,
  //         groups: [],
  //       });
  //
  //       addPromGroupsToCombinedNamespace(ns, groups);
  //     });
  //
  //     const result = Object.values(namespaces);
  //
  //     cache.current[rulesSourceName] = { promRules, rulerRules, result };
  //     return result;
  //   })
  //   .flat();
});

export function isCloudRulesSource(rulesSource: RulesSource | string): rulesSource is DataSourceInstanceSettings {
  return rulesSource !== 'grafana';
}
