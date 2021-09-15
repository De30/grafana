import { DataQueryRequest, RelatedDataProvider, RelatedQueries } from '@grafana/data';
import { Observable } from 'rxjs';
import LokiDatasource from '../datasource';
import { LokiQuery } from '../types';

export class RelatedMetricsProvider implements RelatedDataProvider<RelatedQueries> {
  private readonly dataQueryRequest: DataQueryRequest<LokiQuery>;
  private readonly queries: RelatedQueries = {};

  constructor(datasource: LokiDatasource, dataQueryRequest: DataQueryRequest<LokiQuery>) {
    this.dataQueryRequest = dataQueryRequest;
  }

  getData(): Observable<RelatedQueries> {
    return new Observable<RelatedQueries>((observer) => {
      // Something like:
      //
      // this.datasource.getLinkedDataSources().forEach((datasource) => {
      //   const relatedQuery = await datasource.relatedQuery(this.dataQueryRequest);
      //   if (relatedQuery) {
      //     observer.next(...)
      //   }
      // })
      //
      // similar behavior simulated below
      observer.next({ ...this.queries });
      setTimeout(() => {
        if (this.dataQueryRequest.targets[0]) {
          this.queries[this.dataQueryRequest.targets[0].refId] = [
            {
              refId: this.dataQueryRequest.targets[0].refId,
              queryType: 'metrics',
              datasource: 'gdev-prometheus',
            },
          ];
        }
        if (this.dataQueryRequest.targets[1]) {
          this.queries[this.dataQueryRequest.targets[1].refId] = [
            {
              refId: this.dataQueryRequest.targets[1].refId,
              queryType: 'traces',
              datasource: 'gdev-tempo',
            },
          ];
        }
        observer.next({ ...this.queries });
      }, 2000);

      setTimeout(() => {
        if (this.dataQueryRequest.targets[1]) {
          const currentQueries = this.queries[this.dataQueryRequest.targets[1].refId];
          this.queries[this.dataQueryRequest.targets[1].refId] = [
            ...currentQueries,
            {
              refId: this.dataQueryRequest.targets[1].refId,
              queryType: 'metrics',
              datasource: 'gdev-graphite',
            },
          ];
        }
        observer.next({ ...this.queries });
      }, 6000);
    });
  }
}
