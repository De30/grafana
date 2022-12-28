// Copyright (c) 2017 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { css } from '@emotion/css';
import cx from 'classnames';
import { get as _get, maxBy as _maxBy, values as _values } from 'lodash';
import * as React from 'react';
import { useState } from 'react';
import MdKeyboardArrowRight from 'react-icons/lib/md/keyboard-arrow-right';

import { dateTimeFormat, GrafanaTheme2, TimeZone } from '@grafana/data';
import {
  Badge,
  Button,
  Collapse,
  HorizontalGroup,
  Icon,
  InlineField,
  InlineFieldRow,
  Input,
  QueryField,
  RadioButtonGroup,
  Select,
  useStyles2,
  VerticalGroup,
} from '@grafana/ui';

import { autoColor, TUpdateViewRangeTimeFunction, ViewRange, ViewRangeTimeUpdate } from '..';
import { SelectedView } from '../../../../public/app/plugins/panel/flamegraph/components/types';
import ExternalLinks from '../common/ExternalLinks';
import TraceName from '../common/TraceName';
import { getTraceLinks } from '../model/link-patterns';
import { getCandidateSpan, getTraceName } from '../model/trace-viewer';
import { Trace } from '../types/trace';
import { uTxMuted } from '../uberUtilityStyles';
import { formatDuration } from '../utils/date';

import SpanGraph from './SpanGraph';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    TracePageHeader: css`
      label: TracePageHeader;
      & > :first-child {
        border-bottom: 1px solid ${autoColor(theme, '#e8e8e8')};
      }
      & > :nth-child(2) {
        background-color: ${autoColor(theme, '#eee')};
        border-bottom: 1px solid ${autoColor(theme, '#e4e4e4')};
      }
      & > :last-child {
        border-bottom: 1px solid ${autoColor(theme, '#ccc')};
      }
    `,
    TracePageHeaderTitleRow: css`
      label: TracePageHeaderTitleRow;
      align-items: center;
      display: flex;
      width: 100%;
      margin-bottom: 1rem;
    `,
    TracePageHeaderBack: css`
      label: TracePageHeaderBack;
      align-items: center;
      align-self: stretch;
      background-color: #fafafa;
      border-bottom: 1px solid #ddd;
      border-right: 1px solid #ddd;
      color: inherit;
      display: flex;
      font-size: 1.4rem;
      padding: 0 1rem;
      margin-bottom: -1px;
      &:hover {
        background-color: #f0f0f0;
        border-color: #ccc;
      }
    `,
    TracePageHeaderTitleLink: css`
      label: TracePageHeaderTitleLink;
      align-items: center;
      display: flex;
      flex: 1;

      &:hover * {
        text-decoration: underline;
      }
      &:hover > *,
      &:hover small {
        text-decoration: none;
      }
      /* Adapt styles when changing from a element into button */
      background: transparent;
      text-align: left;
      border: none;
    `,
    TracePageHeaderDetailToggle: css`
      label: TracePageHeaderDetailToggle;
      font-size: 2.5rem;
      transition: transform 0.07s ease-out;
    `,
    TracePageHeaderDetailToggleExpanded: css`
      label: TracePageHeaderDetailToggleExpanded;
      transform: rotate(90deg);
    `,
    TracePageHeaderTitle: css`
      label: TracePageHeaderTitle;
      color: inherit;
      flex: 1;
      font-size: 1.7em;
      line-height: 1em;
      margin: 0 0 0 0.5em;
    `,
    TracePageHeaderTitleCollapsible: css`
      label: TracePageHeaderTitleCollapsible;
      margin-left: 0;
    `,
    TracePageHeaderOverviewItems: css`
      label: TracePageHeaderOverviewItems;
      padding: 0.25rem 0.5rem !important;
    `,
    TracePageHeaderOverviewItemValueDetail: cx(
      css`
        label: TracePageHeaderOverviewItemValueDetail;
        color: #aaa;
      `,
      'trace-item-value-detail'
    ),
    TracePageHeaderOverviewItemValue: css`
      label: TracePageHeaderOverviewItemValue;
      &:hover > .trace-item-value-detail {
        color: unset;
      }
    `,
    TracePageHeaderArchiveIcon: css`
      label: TracePageHeaderArchiveIcon;
      font-size: 1.78em;
      margin-right: 0.15em;
    `,
    TracePageHeaderTraceId: css`
      label: TracePageHeaderTraceId;
      white-space: nowrap;
    `,
    TempHttpUrl: css`
      label: TempHttpUrl;
      white-space: nowrap;
      color: #aaa;
      background: ${autoColor(theme, '#ddd')};
      padding: 1px 8px;
      font-size: 12px;
    `,
  };
};

export type TracePageHeaderEmbedProps = {
  canCollapse: boolean;
  hideMap: boolean;
  hideSummary: boolean;
  onSlimViewClicked: () => void;
  onTraceGraphViewClicked: () => void;
  slimView: boolean;
  trace: Trace | null;
  updateNextViewRangeTime: (update: ViewRangeTimeUpdate) => void;
  updateViewRangeTime: TUpdateViewRangeTimeFunction;
  viewRange: ViewRange;
  timeZone: TimeZone;
};

export const HEADER_ITEMS = [
  {
    key: 'timestamp',
    label: 'Trace Start:',
    renderer(trace: Trace, timeZone: TimeZone, styles: ReturnType<typeof getStyles>) {
      // Convert date from micro to milli seconds
      const dateStr = dateTimeFormat(trace.startTime / 1000, { timeZone, defaultWithMS: true });
      const match = dateStr.match(/^(.+)(:\d\d\.\d+)$/);
      return match ? (
        <span className={styles.TracePageHeaderOverviewItemValue}>
          {match[1]}
          <span className={styles.TracePageHeaderOverviewItemValueDetail}>{match[2]}</span>
        </span>
      ) : (
        dateStr
      );
    },
  },
  {
    key: 'duration',
    label: 'Duration:',
    renderer: (trace: Trace) => formatDuration(trace.duration),
  },
  {
    key: 'service-count',
    label: 'Services:',
    renderer: (trace: Trace) => new Set(_values(trace.processes).map((p) => p.serviceName)).size,
  },
  {
    key: 'depth',
    label: 'Depth:',
    renderer: (trace: Trace) => _get(_maxBy(trace.spans, 'depth'), 'depth', 0) + 1,
  },
  {
    key: 'span-count',
    label: 'Total Spans:',
    renderer: (trace: Trace) => trace.spans.length,
  },
];

export default function TracePageHeader(props: TracePageHeaderEmbedProps) {
  const {
    canCollapse,
    hideMap,
    onSlimViewClicked,
    slimView,
    trace,
    updateNextViewRangeTime,
    updateViewRangeTime,
    viewRange,
    timeZone,
  } = props;

  const styles = useStyles2(getStyles);
  const links = React.useMemo(() => {
    if (!trace) {
      return [];
    }
    return getTraceLinks(trace);
  }, [trace]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (!trace) {
    return null;
  }

  const dateStr = dateTimeFormat(trace.startTime / 1000, { timeZone, defaultWithMS: true });
  const match = dateStr.match(/^(.+)(:\d\d\.\d+)$/);
  const formattedDate = match ? (
    <span className={styles.TracePageHeaderOverviewItemValue}>
      {match[1]}
      <span className={styles.TracePageHeaderOverviewItemValueDetail}>{match[2]}</span>
    </span>
  ) : (
    dateStr
  );

  const candidateSpan = getCandidateSpan(trace.spans);

  const title = (
    <VerticalGroup spacing={'xs'}>
      <HorizontalGroup justify={'space-between'}>
        <h1 className={cx(styles.TracePageHeaderTitle, canCollapse && styles.TracePageHeaderTitleCollapsible)}>
          <HorizontalGroup spacing={'sm'} align={'center'}>
            <Icon name={'globe'} />
            <TraceName traceName={getTraceName(trace.spans)} />
            <small>|</small>
            <small className={cx(styles.TracePageHeaderTraceId, uTxMuted)}>{formatDuration(trace.duration)}</small>
          </HorizontalGroup>
        </h1>
        <Button icon={'link'} size={'sm'} fill={'outline'}>
          Logs
        </Button>
      </HorizontalGroup>

      <HorizontalGroup>
        <small
          className={cx(
            css`
              margin: 0 0 0 0.5em;
            `
          )}
        >
          {formattedDate}
        </small>
        <small>|</small>
        <div
          className={cx(
            css`
              display: inline-flex;

              * {
                border: none;
              }
            `
          )}
        >
          <Badge text={candidateSpan?.tags.find((t) => t.key === 'http.method')?.value} color={'blue'} />
          <div className={cx(styles.TempHttpUrl)}>
            {candidateSpan?.tags.find((t) => t.key === 'http.url')?.value ||
              candidateSpan?.tags.find((t) => t.key === 'http.target')?.value}
          </div>
          {candidateSpan?.tags.find((t) => t.key === 'http.status_code')?.value && (
            <Badge text={candidateSpan?.tags.find((t) => t.key === 'http.status_code')?.value} color={'red'} />
          )}
        </div>
      </HorizontalGroup>
    </VerticalGroup>
  );

  let viewOptions: Array<{ value: SelectedView; label: string; description: string }> = [
    { value: SelectedView.TopTable, label: 'Minimap', description: 'Show the minimap' },
    { value: SelectedView.FlameGraph, label: 'Flame Graph', description: 'Show the flame graph' },
  ];

  return (
    <header className={styles.TracePageHeader}>
      <VerticalGroup spacing={'xs'}>
        <div className={styles.TracePageHeaderTitleRow}>
          {links && links.length > 0 && <ExternalLinks links={links} className={styles.TracePageHeaderBack} />}
          {canCollapse ? (
            <button
              type="button"
              className={styles.TracePageHeaderTitleLink}
              onClick={onSlimViewClicked}
              role="switch"
              aria-checked={!slimView}
            >
              <MdKeyboardArrowRight
                className={cx(
                  styles.TracePageHeaderDetailToggle,
                  !slimView && styles.TracePageHeaderDetailToggleExpanded
                )}
              />
              {title}
            </button>
          ) : (
            title
          )}
        </div>
        <Collapse label={'Span Filters'} collapsible isOpen={filtersOpen} onToggle={setFiltersOpen}>
          <InlineFieldRow>
            <InlineField label="Span Name" labelWidth={14} grow>
              <Select
                inputId="spanName"
                options={[]}
                placeholder="Select a span"
                isClearable
                aria-label={'select-span-name'}
                allowCustomValue={true}
                onChange={() => {}}
              />
            </InlineField>
            <InlineField label="Tags" labelWidth={14} grow tooltip="Values should be in logfmt.">
              <QueryField placeholder="http.status_code=200 error=true" portalOrigin="tempo" />
            </InlineField>
          </InlineFieldRow>
          <InlineFieldRow>
            <InlineField label="Min Duration" labelWidth={14} grow>
              <Input id="minDuration" value={''} placeholder={'e.g. 1.2s, 100ms'} />
            </InlineField>
            <InlineField label="Max Duration" labelWidth={14} grow>
              <Input id="maxDuration" value={''} placeholder={'e.g. 1.2s, 100ms'} />
            </InlineField>
          </InlineFieldRow>
          <HorizontalGroup justify={'space-between'} align={'flex-start'}>
            <Button size={'sm'} variant={'secondary'} fill={'outline'}>
              Critical Path
            </Button>
            <HorizontalGroup justify={'flex-end'}>
              <Button size={'sm'} variant={'secondary'} fill={'outline'}>
                Reset
              </Button>
            </HorizontalGroup>
          </HorizontalGroup>
        </Collapse>
        <HorizontalGroup justify={'space-between'}>
          <div
            className={cx(
              css`
                color: #aaa;
              `
            )}
          >
            Displaying 19/34 spans
          </div>
          <RadioButtonGroup<SelectedView> options={viewOptions} value={SelectedView.TopTable} onChange={() => {}} />
        </HorizontalGroup>
        {!hideMap && !slimView && (
          <div
            className={cx(
              css`
                width: 100%;
              `
            )}
          >
            <SpanGraph
              trace={trace}
              viewRange={viewRange}
              updateNextViewRangeTime={updateNextViewRangeTime}
              updateViewRangeTime={updateViewRangeTime}
            />
          </div>
        )}
      </VerticalGroup>
    </header>
  );
}
