import _ from 'lodash';
import {
  AnnotationEvent,
  AnnotationQueryRequest,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
} from '@grafana/data';
import { tree } from './tree';
import { candle } from './candle';

import { GrafanaQuery, GrafanaAnnotationQuery, GrafanaAnnotationType } from './types';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';

let counter = 100;

export class GrafanaDatasource extends DataSourceApi<GrafanaQuery> {
  constructor(instanceSettings: DataSourceInstanceSettings) {
    super(instanceSettings);
  }

  query(request: DataQueryRequest<GrafanaQuery>): Promise<DataQueryResponse> {
    if (request.targets[0].name === 'candle') {
      return Promise.resolve({ data: candle() });
    }
    return Promise.resolve({ data: tree() });
  }

  metricFindQuery(options: any) {
    return Promise.resolve([]);
  }

  annotationQuery(options: AnnotationQueryRequest<GrafanaQuery>): Promise<AnnotationEvent[]> {
    const templateSrv = getTemplateSrv();
    const annotation = (options.annotation as unknown) as GrafanaAnnotationQuery;
    const params: any = {
      from: options.range.from.valueOf(),
      to: options.range.to.valueOf(),
      limit: annotation.limit,
      tags: annotation.tags,
      matchAny: annotation.matchAny,
    };

    if (annotation.type === GrafanaAnnotationType.Dashboard) {
      // if no dashboard id yet return
      if (!options.dashboard.id) {
        return Promise.resolve([]);
      }
      // filter by dashboard id
      params.dashboardId = options.dashboard.id;
      // remove tags filter if any
      delete params.tags;
    } else {
      // require at least one tag
      if (!Array.isArray(annotation.tags) || annotation.tags.length === 0) {
        return Promise.resolve([]);
      }
      const delimiter = '__delimiter__';
      const tags = [];
      for (const t of params.tags) {
        const renderedValues = templateSrv.replace(t, {}, (value: any) => {
          if (typeof value === 'string') {
            return value;
          }

          return value.join(delimiter);
        });
        for (const tt of renderedValues.split(delimiter)) {
          tags.push(tt);
        }
      }
      params.tags = tags;
    }

    return getBackendSrv().get(
      '/api/annotations',
      params,
      `grafana-data-source-annotations-${annotation.name}-${options.dashboard?.id}`
    );
  }

  testDatasource() {
    return Promise.resolve();
  }
}
