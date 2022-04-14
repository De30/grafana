import { getDashboardSrv } from '../../dashboard/services/DashboardSrv';
import { PanelData, LoadingState, DataSourceApi, CoreApp, urlUtil, DataFrame } from '@grafana/data';
import { reportMetaAnalytics, MetaAnalyticsEventName, DataRequestEventPayload } from '@grafana/runtime';

export function emitDataRequestEvent(datasource: DataSourceApi) {
  let done = false;

  return (data: PanelData) => {
    if (!data.request || done || data.request.app === CoreApp.Explore) {
      return;
    }

    const params = urlUtil.getUrlSearchParams();
    if (params.editPanel != null) {
      return;
    }

    if (data.state !== LoadingState.Done && data.state !== LoadingState.Error) {
      return;
    }

    const { queryCount, cachedQueryCount } = countCachedQueries(data.series);

    const eventData: DataRequestEventPayload = {
      eventName: MetaAnalyticsEventName.DataRequest,
      datasourceName: datasource.name,
      datasourceId: datasource.id,
      datasourceType: datasource.type,
      panelId: data.request.panelId,
      dashboardId: data.request.dashboardId,
      dataSize: 0,
      duration: data.request.endTime! - data.request.startTime,
      queryCount,
      cachedQueryCount,
    };

    // enrich with dashboard info
    const dashboard = getDashboardSrv().getCurrent();
    if (dashboard) {
      eventData.dashboardId = dashboard.id;
      eventData.dashboardName = dashboard.title;
      eventData.dashboardUid = dashboard.uid;
      eventData.folderName = dashboard.meta.folderTitle;
    }

    if (data.series && data.series.length > 0) {
      // estimate size
      eventData.dataSize = data.series.length;
    }

    if (data.error) {
      eventData.error = data.error.message;
    }

    reportMetaAnalytics(eventData);

    // this done check is to make sure we do not double emit events in case
    // there are multiple responses with done state
    done = true;
  };
}

export function countCachedQueries(series: DataFrame[]): { queryCount: number; cachedQueryCount: number } {
  // get unique count of all refId's
  let queries = new Map();

  series.forEach((frame: DataFrame) => {
    queries.set(frame.refId, frame.meta?.isCachedResponse ?? false);
  });

  let cachedQueryCount = 0;
  queries.forEach((isCached) => {
    if (isCached) {
      cachedQueryCount += 1;
    }
  });

  return { queryCount: queries.size, cachedQueryCount };
}
