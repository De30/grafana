import { css, cx } from '@emotion/css';
import { take } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DataSourceApi,
  getDefaultTimeRange,
  ExploreUrlState,
  GrafanaTheme2,
  InterpolateFunction,
  PanelProps,
  serializeStateToUrlParam,
  locationUtil,
} from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime/src/services';
import { CustomScrollbar, stylesFactory, useStyles2 } from '@grafana/ui';
import { Icon, IconProps } from '@grafana/ui/src/components/Icon/Icon';
import { getFocusStyles } from '@grafana/ui/src/themes/mixins';
import { setStarred } from 'app/core/reducers/navBarTree';
import { getBackendSrv } from 'app/core/services/backend_srv';
import impressionSrv from 'app/core/services/impression_srv';
import { createQueryText, getRichHistory } from 'app/core/utils/richHistory';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { SearchCard } from 'app/features/search/components/SearchCard';
import { DashboardSearchItem } from 'app/features/search/types';
import { RichHistoryQuery, useDispatch } from 'app/types';

import { RichHistoryResults } from '../../../core/history/RichHistoryStorage';

import { PanelLayout, PanelOptions } from './models.gen';
import { getStyles } from './styles';

type Dashboard = DashboardSearchItem & { id?: number; isSearchResult?: boolean; isRecent?: boolean };
type ExploreQueryDisplay = { datasourceString: string; queryString: string };
type ExploreQuery = RichHistoryQuery & {
  isRecent?: boolean;
  rootDs?: DataSourceApi;
  queryStrings?: ExploreQueryDisplay[];
};
export type Item = {
  uid?: string;
  isSearchResult?: boolean;
  isRecent?: boolean;
  isStarred?: boolean;
  title: string;
  description?: string;
  url?: string;
  folderTitle?: string;
  icon?: string;
  tags?: string[];
  checked?: boolean;
};

interface ItemGroup {
  show: boolean;
  header: string;
  items: Item[];
}

function dashboardToItem(dash: Dashboard): Item {
  return {
    uid: dash.uid,
    isSearchResult: dash.isSearchResult,
    isRecent: dash.isRecent,
    isStarred: dash.isStarred,
    title: dash.title,
  };
}

function exploreToItem(explorer: ExploreQuery): Item {
  const descString = explorer.queryStrings ? explorer.queryStrings.map((query) => query.queryString).join(' / ') : '';
  console.log(explorer.queryStrings, explorer.queryStrings?.length);
  const exploreUrlState: ExploreUrlState = {
    datasource: explorer.datasourceUid,
    queries: explorer.queries,
    range: getDefaultTimeRange(),
  };
  return {
    uid: explorer.id,
    isSearchResult: false,
    isRecent: explorer.isRecent,
    isStarred: explorer.starred,
    title: explorer.rootDs?.name || explorer.datasourceName,
    description: descString,
    url: locationUtil.assureBaseUrl(`/explore?left=${encodeURIComponent(serializeStateToUrlParam(exploreUrlState))}`),
  };
}

async function fetchDashboards(options: PanelOptions, replaceVars: InterpolateFunction) {
  let starredDashboards: Promise<DashboardSearchItem[]> = Promise.resolve([]);
  if (options.showStarred) {
    const params = { limit: options.maxItems, starred: 'true' };
    starredDashboards = getBackendSrv().search(params);
  }

  let recentDashboards: Promise<DashboardSearchItem[]> = Promise.resolve([]);
  let dashUIDs: string[] = [];
  if (options.showRecentlyViewed) {
    let uids = await impressionSrv.getDashboardOpened();
    dashUIDs = take<string>(uids, options.maxItems);
    recentDashboards = getBackendSrv().search({ dashboardUIDs: dashUIDs, limit: options.maxItems });
  }

  let searchedDashboards: Promise<DashboardSearchItem[]> = Promise.resolve([]);
  if (options.showSearch) {
    const params = {
      limit: options.maxItems,
      query: replaceVars(options.query, {}, 'text'),
      folderIds: options.folderId,
      tag: options.tags.map((tag: string) => replaceVars(tag, {}, 'text')),
      type: 'dash-db',
    };

    searchedDashboards = getBackendSrv().search(params);
  }

  const [starred, searched, recent] = await Promise.all([starredDashboards, searchedDashboards, recentDashboards]);

  // We deliberately deal with recent dashboards first so that the order of dash IDs is preserved
  let dashMap = new Map<string, Item>();
  for (const dashUID of dashUIDs) {
    const dash = recent.find((d) => d.uid === dashUID);
    if (dash) {
      dashMap.set(dashUID, dashboardToItem({ ...dash, isRecent: true }));
    }
  }

  searched.forEach((dash) => {
    if (!dash.uid) {
      return;
    }
    if (dashMap.has(dash.uid)) {
      dashMap.get(dash.uid)!.isSearchResult = true;
    } else {
      dashMap.set(dash.uid, dashboardToItem({ ...dash, isSearchResult: true }));
    }
  });

  starred.forEach((dash) => {
    if (!dash.uid) {
      return;
    }
    if (dashMap.has(dash.uid)) {
      dashMap.get(dash.uid)!.isStarred = true;
    } else {
      dashMap.set(dash.uid, dashboardToItem({ ...dash, isStarred: true }));
    }
  });

  return dashMap;
}

async function fetchExploreItems(options: PanelOptions) {
  let exploreItems = new Map<string, Item>();

  let recentRichHistoryResults: Promise<RichHistoryResults> = Promise.resolve({ richHistory: [] });
  if (options.showRecentlyViewed) {
    recentRichHistoryResults = getRichHistory({ from: 0, to: 7, limit: 50 }, true);
  }

  let starredRichHistoryResults: Promise<RichHistoryResults> = Promise.resolve({ richHistory: [] });
  if (options.showStarred) {
    starredRichHistoryResults = getRichHistory({ starred: true, from: 0, to: 7, limit: 50 }, true);
  }

  const [recent, starred] = await Promise.all([recentRichHistoryResults, starredRichHistoryResults]);

  recent.richHistory.forEach(async (explorer) => {
    const rootDs = await getDataSourceSrv().get(explorer.datasourceUid);
    const queryStringArr: ExploreQueryDisplay[] = [];
    explorer.queries.forEach(async (query) => {
      const queryDS = await getDataSourceSrv().get(query.datasource?.uid);
      queryStringArr.push({ datasourceString: queryDS.name, queryString: createQueryText(query, queryDS) });
    });
    const item = exploreToItem({ ...explorer, isRecent: true, rootDs: rootDs, queryStrings: queryStringArr });
    exploreItems.set(explorer.id, item);
  });

  starred.richHistory.forEach(async (explorer) => {
    const rootDs = await getDataSourceSrv().get(explorer.datasourceUid);
    const queryStringArr: ExploreQueryDisplay[] = [];
    explorer.queries.forEach(async (query) => {
      const queryDS = await getDataSourceSrv().get(query.datasource?.uid);
      queryStringArr.push({ datasourceString: queryDS.name, queryString: createQueryText(query, queryDS) });
    });
    const item = exploreToItem({ ...explorer, isRecent: true, rootDs: rootDs, queryStrings: queryStringArr });
    exploreItems.set(explorer.id, item);
  });

  return exploreItems;
}

export function SavedList(props: PanelProps<PanelOptions>) {
  const [dashboards, setDashboards] = useState(new Map<string, Item>());
  const [exploreItems, setExploreItems] = useState(new Map<string, Item>());
  const dispatch = useDispatch();
  useEffect(() => {
    fetchDashboards(props.options, props.replaceVariables).then((dashes) => {
      setDashboards(dashes);
    });
    fetchExploreItems(props.options).then((explorers) => {
      setExploreItems(explorers);
    });
  }, [props.options, props.replaceVariables, props.renderCounter]);

  const toggleDashboardStar = async (e: React.SyntheticEvent, item: Item) => {
    const { uid, title, url } = item;
    e.preventDefault();
    e.stopPropagation();

    try {
      // FIXME: Do not use dash ID. Use UID to star a dashboard once the backend allows it
      const isStarred = await getDashboardSrv().starDashboard(item.uid!.toString(), item.isStarred || false);
      const updatedDashboards = new Map(dashboards);
      updatedDashboards.set(item?.uid ?? '', { ...item, isStarred });
      setDashboards(updatedDashboards);
      dispatch(setStarred({ id: uid ?? '', title, url: url || '', isStarred }));
    } catch {}
  };

  const [starredDashboards, recentDashboards, searchedDashboards] = useMemo(() => {
    const dashboardList = [...dashboards.values()];
    return [
      dashboardList.filter((dash) => dash.isStarred).sort((a, b) => a.title.localeCompare(b.title)),
      dashboardList.filter((dash) => dash.isRecent),
      dashboardList.filter((dash) => dash.isSearchResult).sort((a, b) => a.title.localeCompare(b.title)),
    ];
  }, [dashboards]);

  const [starredExplore, recentExplore] = useMemo(() => {
    const exploreList = [...exploreItems.values()];
    return [
      exploreList.filter((dash) => dash.isStarred).sort((a, b) => a.title.localeCompare(b.title)),
      exploreList.filter((dash) => dash.isRecent),
    ];
  }, [exploreItems]);

  const { showStarred, showRecentlyViewed, showHeadings, showSearch, layout } = props.options;

  const itemGroups: ItemGroup[] = [
    {
      header: 'Starred items',
      items: [...starredDashboards, ...starredExplore],
      show: showStarred,
    },
    {
      header: 'Recently viewed items',
      items: [...recentDashboards, ...recentExplore],
      show: showRecentlyViewed,
    },
    {
      header: 'Search',
      items: searchedDashboards,
      show: showSearch,
    },
  ];

  const css = useStyles2(getStyles);

  const renderList = (items: Item[]) => (
    <ul>
      {items.map((item) => (
        <li className={css.savedlistItem} key={`item-${item.uid}`}>
          <div className={css.savedlistLink}>
            <div className={css.savedlistLinkBody}>
              <a className={css.savedlistTitle} href={item.url}>
                {item.title} {item.description}
              </a>
              {item.folderTitle && <div className={css.savedlistFolder}>{item.folderTitle}</div>}
            </div>
            <IconToggle
              aria-label={`Star item "${item.title}".`}
              className={css.savedlistStar}
              enabled={{ name: 'favorite', type: 'mono' }}
              disabled={{ name: 'star', type: 'default' }}
              checked={item.isStarred || false}
              onClick={(e) => toggleDashboardStar(e, item)}
            />
          </div>
        </li>
      ))}
    </ul>
  );

  const renderPreviews = (items: Item[]) => (
    <ul className={css.gridContainer}>
      {items.map((item) => (
        <li key={item.uid}>
          <SearchCard item={item} />
        </li>
      ))}
    </ul>
  );

  return (
    <CustomScrollbar autoHeightMin="100%" autoHeightMax="100%">
      {itemGroups.map(
        ({ show, header, items }, i) =>
          show && (
            <div className={css.savedlistSection} key={`dash-group-${i}`}>
              {showHeadings && <h6 className={css.savedlistSectionHeader}>{header}</h6>}
              {layout === PanelLayout.Previews ? renderPreviews(items) : renderList(items)}
            </div>
          )
      )}
    </CustomScrollbar>
  );
}

interface IconToggleProps extends Partial<IconProps> {
  enabled: IconProps;
  disabled: IconProps;
  checked: boolean;
}

function IconToggle({
  enabled,
  disabled,
  checked,
  onClick,
  className,
  'aria-label': ariaLabel,
  ...otherProps
}: IconToggleProps) {
  const toggleCheckbox = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      e.preventDefault();
      e.stopPropagation();

      onClick?.(e);
    },
    [onClick]
  );

  const iconPropsOverride = checked ? enabled : disabled;
  const iconProps = { ...otherProps, ...iconPropsOverride };
  const styles = useStyles2(getCheckboxStyles);
  return (
    <label className={styles.wrapper}>
      <input
        type="checkbox"
        defaultChecked={checked}
        onClick={toggleCheckbox}
        className={styles.checkBox}
        aria-label={ariaLabel}
      />
      <Icon className={cx(styles.icon, className)} {...iconProps} />
    </label>
  );
}

export const getCheckboxStyles = stylesFactory((theme: GrafanaTheme2) => {
  return {
    wrapper: css({
      display: 'flex',
      alignSelf: 'center',
      cursor: 'pointer',
      zIndex: 1,
    }),
    checkBox: css({
      appearance: 'none',
      '&:focus-visible + *': {
        ...getFocusStyles(theme),
        borderRadius: theme.shape.borderRadius(1),
      },
    }),
    icon: css({
      marginBottom: 0,
      verticalAlign: 'baseline',
      display: 'flex',
    }),
  };
});
