import { css, cx } from '@emotion/css';
import React, { memo, useMemo, useState } from 'react';

import { GrafanaTheme2, isDateTime, rangeUtil, RawTimeRange, TimeOption, TimeRange, TimeZone } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';

import { FilterInput, IconButton } from '../..';
import { stylesFactory, useTheme2 } from '../../../themes';
import { getFocusStyles } from '../../../themes/mixins';
import { CustomScrollbar } from '../../CustomScrollbar/CustomScrollbar';
import { Icon } from '../../Icon/Icon';
import { formattedRange } from '../utils';

import { TimePickerFooter } from './TimePickerFooter';
import { TimePickerTitle } from './TimePickerTitle';
import { TimeRangeContent } from './TimeRangeContent';
import { TimeRangeList } from './TimeRangeList';
import { mapOptionToTimeRange, mapRangeToTimeOption } from './mapper';

interface Props {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  onChangeTimeZone: (timeZone: TimeZone) => void;
  onFavoritesChange?: (values: TimeRange[]) => void;
  onChangeFiscalYearStartMonth?: (month: number) => void;
  timeZone?: TimeZone;
  fiscalYearStartMonth?: number;
  quickOptions?: TimeOption[];
  history?: TimeRange[];
  favorites?: TimeRange[];
  showHistory?: boolean;
  className?: string;
  hideTimeZone?: boolean;
  /** Reverse the order of relative and absolute range pickers. Used to left align the picker in forms */
  isReversed?: boolean;
  hideQuickRanges?: boolean;
  widthOverride?: number;
}

export interface PropsWithScreenSize extends Props {
  isFullscreen: boolean;
}

interface FormProps extends Omit<Props, 'history'> {
  historyOptions?: TimeOption[];
  favoritesOptions?: TimeOption[];
}

export const TimePickerContentWithScreenSize: React.FC<PropsWithScreenSize> = (props) => {
  const {
    quickOptions = [],
    isReversed,
    isFullscreen,
    hideQuickRanges,
    timeZone,
    fiscalYearStartMonth,
    value,
    onChange,
    history,
    favorites,
    showHistory,
    className,
    hideTimeZone,
    onChangeTimeZone,
    onChangeFiscalYearStartMonth,
  } = props;
  const isHistoryEmpty = !history?.length;
  const isContainerTall =
    (isFullscreen && showHistory) || (!isFullscreen && ((showHistory && !isHistoryEmpty) || !hideQuickRanges));
  const theme = useTheme2();
  const styles = getStyles(theme, isReversed, hideQuickRanges, isContainerTall, isFullscreen);
  const historyOptions = mapToHistoryOptions(history, timeZone);
  const timeOption = useTimeOption(value.raw, quickOptions);
  const [searchTerm, setSearchQuery] = useState('');

  const filteredQuickOptions = quickOptions.filter((o) => o.display.toLowerCase().includes(searchTerm.toLowerCase()));

  const onChangeTimeOption = (timeOption: TimeOption) => {
    return onChange(mapOptionToTimeRange(timeOption));
  };

  return (
    <div id="TimePickerContent" className={cx(styles.container, className)}>
      <div className={styles.body}>
        {(!isFullscreen || !hideQuickRanges) && (
          <div className={styles.rightSide}>
            <div className={styles.timeRangeFilter}>
              <FilterInput
                width={0}
                autoFocus={true}
                value={searchTerm}
                onChange={setSearchQuery}
                placeholder={'Search quick ranges'}
              />
            </div>
            <CustomScrollbar>
              {!isFullscreen && <NarrowScreenForm {...props} historyOptions={historyOptions} />}
              {!hideQuickRanges && (
                <TimeRangeList options={filteredQuickOptions} onChange={onChangeTimeOption} value={timeOption} />
              )}
            </CustomScrollbar>
          </div>
        )}
        {isFullscreen && (
          <div className={styles.leftSide}>
            <FullScreenForm {...props} favorites={favorites} historyOptions={historyOptions} />
          </div>
        )}
      </div>
      {!hideTimeZone && isFullscreen && (
        <TimePickerFooter
          timeZone={timeZone}
          fiscalYearStartMonth={fiscalYearStartMonth}
          onChangeTimeZone={onChangeTimeZone}
          onChangeFiscalYearStartMonth={onChangeFiscalYearStartMonth}
        />
      )}
    </div>
  );
};

export const TimePickerContent = (props: Props) => {
  const { widthOverride } = props;
  const theme = useTheme2();
  const isFullscreen = (widthOverride || window.innerWidth) >= theme.breakpoints.values.lg;
  return <TimePickerContentWithScreenSize {...props} isFullscreen={isFullscreen} />;
};

const NarrowScreenForm = (props: FormProps) => {
  const { value, hideQuickRanges, onChange, timeZone, historyOptions = [], showHistory } = props;
  const theme = useTheme2();
  const styles = getNarrowScreenStyles(theme);
  const isAbsolute = isDateTime(value.raw.from) || isDateTime(value.raw.to);
  const [collapsedFlag, setCollapsedFlag] = useState(!isAbsolute);
  const collapsed = hideQuickRanges ? false : collapsedFlag;

  const onChangeTimeOption = (timeOption: TimeOption) => {
    return onChange(mapOptionToTimeRange(timeOption, timeZone));
  };

  return (
    <fieldset>
      <div className={styles.header}>
        <button
          type={'button'}
          className={styles.expandButton}
          onClick={() => {
            if (!hideQuickRanges) {
              setCollapsedFlag(!collapsed);
            }
          }}
          data-testid={selectors.components.TimePicker.absoluteTimeRangeTitle}
          aria-expanded={!collapsed}
          aria-controls="expanded-timerange"
        >
          <TimePickerTitle>Absolute time range</TimePickerTitle>
          {!hideQuickRanges && <Icon name={!collapsed ? 'angle-up' : 'angle-down'} />}
        </button>
      </div>
      {!collapsed && (
        <div className={styles.body} id="expanded-timerange">
          <div className={styles.form}>
            <TimeRangeContent value={value} onApply={onChange} timeZone={timeZone} isFullscreen={false} />
          </div>
          {showHistory && (
            <TimeRangeList
              title="Recently used absolute ranges"
              options={historyOptions}
              onChange={onChangeTimeOption}
              placeholderEmpty={null}
            />
          )}
        </div>
      )}
    </fieldset>
  );
};

interface FavoriteTimeRangeListProps {
  onFavoritesChange: (values: TimeRange[]) => void;
  favorites: TimeRange[];
  onChange: (option: TimeRange) => void;
  timeZone: string | undefined;
}

const FavouriteTimeRangeList = (props: FavoriteTimeRangeListProps) => {
  const { favorites, onFavoritesChange, timeZone, onChange } = props;
  const theme = useTheme2();
  const styles = getFavoritesStyles(theme);
  const onRemoveFavourite = (timeRange: TimeRange) => {
    onFavoritesChange(
      favorites.filter((value: TimeRange) => {
        let to = false,
          from = false;
        if (typeof value.raw.from === 'string') {
          from = value.raw.from === timeRange.raw.from;
        } else {
          from = value.from.toISOString() === timeRange.from.toISOString();
        }

        if (typeof value.raw.to === 'string') {
          to = value.raw.to === timeRange.raw.to;
        } else {
          to = value.to.toISOString() === timeRange.to.toISOString();
        }
        return !(from && to);
      })
    );
  };

  return (
    <>
      <ul aria-roledescription="Time range selection">
        {favorites.map((favourite, index) => {
          return (
            <li
              className={styles.container}
              onClick={() => {
                onChange(favourite);
              }}
              key={`${favourite.raw.from}${favourite.raw.to}${index}`}
            >
              <IconButton
                className={styles.icon}
                name="favorite"
                size="md"
                onClick={(e) => {
                  onRemoveFavourite(favourite);
                  e.stopPropagation();
                }}
              ></IconButton>
              <label className={styles.label}>{formattedRange(favourite, timeZone)}</label>
            </li>
          );
        })}
      </ul>
      <div />
    </>
  );
};

const getFavoritesStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      align-items: center;
      flex-direction: row-reverse;
      justify-content: space-between;
      padding: 7px 9px 7px 9px;

      &:hover {
        background: ${theme.colors.action.hover};
        cursor: pointer;
      }
    `,
    label: css`
      cursor: pointer;
    `,
    icon: css`
      color: #eb7b18;
    `,
  };
};

const FullScreenForm: React.FC<FormProps> = (props) => {
  const { onFavoritesChange, favorites, onChange, value, timeZone, fiscalYearStartMonth, isReversed, historyOptions } =
    props;
  const theme = useTheme2();
  const styles = getFullScreenStyles(theme, props.hideQuickRanges);
  const onChangeTimeOption = (timeOption: TimeOption) => {
    return onChange(mapOptionToTimeRange(timeOption, timeZone));
  };

  const addToFavorites = (timeRange: TimeRange) => {
    if (onFavoritesChange && favorites) {
      onFavoritesChange(favorites.concat([timeRange]));
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.title} data-testid={selectors.components.TimePicker.absoluteTimeRangeTitle}>
          <TimePickerTitle>Custom time range</TimePickerTitle>
        </div>
        <TimeRangeContent
          value={value}
          timeZone={timeZone}
          fiscalYearStartMonth={fiscalYearStartMonth}
          onApply={onChange}
          onAddToFavorites={addToFavorites}
          isFullscreen={true}
          isReversed={isReversed}
        />
      </div>
      {onFavoritesChange && favorites ? (
        <div className={styles.recent}>
          <FavouriteTimeRangeList
            favorites={favorites}
            onChange={onChange}
            onFavoritesChange={onFavoritesChange}
            timeZone={timeZone}
          ></FavouriteTimeRangeList>
        </div>
      ) : null}
      {props.showHistory && (
        <div className={styles.recent}>
          <TimeRangeList
            title="Recently used absolute ranges"
            options={historyOptions || []}
            onChange={onChangeTimeOption}
            placeholderEmpty={<EmptyRecentList />}
          />
        </div>
      )}
    </>
  );
};

const EmptyRecentList = memo(() => {
  const theme = useTheme2();
  const styles = getEmptyListStyles(theme);

  return (
    <div className={styles.container}>
      <div>
        <span>
          It looks like you haven&apos;t used this time picker before. As soon as you enter some time intervals,
          recently used intervals will appear here.
        </span>
      </div>
      <div>
        <a
          className={styles.link}
          href="https://grafana.com/docs/grafana/latest/dashboards/time-range-controls"
          target="_new"
        >
          Read the documentation
        </a>
        <span> to find out more about how to enter custom time ranges.</span>
      </div>
    </div>
  );
});

function mapToHistoryOptions(ranges?: TimeRange[], timeZone?: TimeZone): TimeOption[] {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return [];
  }
  return ranges.slice(ranges.length - 4).map((range) => mapRangeToTimeOption(range, timeZone));
}

EmptyRecentList.displayName = 'EmptyRecentList';

const useTimeOption = (raw: RawTimeRange, quickOptions: TimeOption[]): TimeOption | undefined => {
  return useMemo(() => {
    if (!rangeUtil.isRelativeTimeRange(raw)) {
      return;
    }
    return quickOptions.find((option) => {
      return option.from === raw.from && option.to === raw.to;
    });
  }, [raw, quickOptions]);
};

const getStyles = stylesFactory((theme: GrafanaTheme2, isReversed, hideQuickRanges, isContainerTall, isFullscreen) => {
  return {
    container: css`
      background: ${theme.colors.background.primary};
      box-shadow: ${theme.shadows.z3};
      position: absolute;
      z-index: ${theme.zIndex.dropdown};
      width: ${isFullscreen ? '546px' : '262px'};
      top: 116%;
      border-radius: 2px;
      border: 1px solid ${theme.colors.border.weak};
      ${isReversed ? 'left' : 'right'}: 0;
    `,
    body: css`
      display: flex;
      flex-direction: row-reverse;
      height: ${isContainerTall ? '381px' : '217px'};
    `,
    leftSide: css`
      display: flex;
      flex-direction: column;
      border-right: ${isReversed ? 'none' : `1px solid ${theme.colors.border.weak}`};
      width: ${!hideQuickRanges ? '60%' : '100%'};
      overflow: hidden;
      order: ${isReversed ? 1 : 0};
    `,
    rightSide: css`
      width: ${isFullscreen ? '40%' : '100%'}; !important;
      border-right: ${isReversed ? `1px solid ${theme.colors.border.weak}` : 'none'};
      display: flex;
      flex-direction: column;
    `,
    timeRangeFilter: css`
      padding: ${theme.spacing(1)};
    `,
    spacing: css`
      margin-top: 16px;
    `,
  };
});

const getNarrowScreenStyles = stylesFactory((theme: GrafanaTheme2) => {
  return {
    header: css`
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid ${theme.colors.border.weak};
      padding: 7px 9px 7px 9px;
    `,
    expandButton: css`
      background-color: transparent;
      border: none;
      display: flex;
      width: 100%;

      &:focus-visible {
        ${getFocusStyles(theme)}
      }
    `,
    body: css`
      border-bottom: 1px solid ${theme.colors.border.weak};
    `,
    form: css`
      padding: 7px 9px 7px 9px;
    `,
  };
});

const getFullScreenStyles = stylesFactory((theme: GrafanaTheme2, hideQuickRanges?: boolean) => {
  return {
    container: css`
      padding-top: 9px;
      padding-left: 11px;
      padding-right: ${!hideQuickRanges ? '9px' : '11px'};
    `,
    title: css`
      margin-bottom: 11px;
    `,
    recent: css`
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding-top: ${theme.spacing(1)};
    `,
  };
});

const getEmptyListStyles = stylesFactory((theme: GrafanaTheme2) => {
  return {
    container: css`
      padding: 12px;
      margin: 12px;

      a,
      span {
        font-size: 13px;
      }
    `,
    link: css`
      color: ${theme.colors.text.link};
    `,
  };
});
