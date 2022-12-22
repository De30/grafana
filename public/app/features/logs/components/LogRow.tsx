import { cx } from '@emotion/css';
import React, { PureComponent } from 'react';

import {
  Field,
  LinkModel,
  LogRowModel,
  LogsSortOrder,
  TimeZone,
  DataQueryResponse,
  dateTimeFormat,
  CoreApp,
  DataFrame,
} from '@grafana/data';
import { reportInteraction } from '@grafana/runtime';
import { styleMixins, Icon, Tooltip } from '@grafana/ui';

import { checkLogsError, escapeUnescapedString } from '../utils';

import { LogDetails } from './LogDetails';
import { LogLabels } from './LogLabels';
import {
  LogRowContextRows,
  LogRowContextQueryErrors,
  HasMoreContextRows,
  LogRowContextProvider,
  RowContextOptions,
} from './LogRowContextProvider';
import { LogRowMessage } from './LogRowMessage';
import { LogRowMessageDetectedFields } from './LogRowMessageDetectedFields';
import { LogStyles } from './getLogRowStyles';

//Components

interface Props {
  row: LogRowModel;
  showDuplicates: boolean;
  showLabels: boolean;
  showTime: boolean;
  wrapLogMessage: boolean;
  styles: LogStyles;
  prettifyLogMessage: boolean;
  timeZone: TimeZone;
  enableLogDetails: boolean;
  logsSortOrder?: LogsSortOrder | null;
  forceEscape?: boolean;
  showDetectedFields?: string[];
  scrollElement?: HTMLDivElement;
  showRowMenu?: boolean;
  app?: CoreApp;
  getRows: () => LogRowModel[];
  onClickFilterLabel?: (key: string, value: string) => void;
  onClickFilterOutLabel?: (key: string, value: string) => void;
  onContextClick?: () => void;
  getRowContext: (row: LogRowModel, options?: RowContextOptions) => Promise<DataQueryResponse>;
  getFieldLinks?: (field: Field, rowIndex: number, dataFrame: DataFrame) => Array<LinkModel<Field>>;
  showContextToggle?: (row?: LogRowModel) => boolean;
  onClickShowDetectedField?: (key: string) => void;
  onClickHideDetectedField?: (key: string) => void;
  onLogRowHover?: (row?: LogRowModel) => void;
  toggleContextIsOpen?: () => void;
}

interface State {
  showContext: boolean;
  showDetails: boolean;
}

/**
 * Renders a log line.
 *
 * When user hovers over it for a certain time, it lazily parses the log line.
 * Once a parser is found, it will determine fields, that will be highlighted.
 * When the user requests stats for a field, they will be calculated and rendered below the row.
 */
export class LogRow extends PureComponent<Props, State> {
  state: State = {
    showContext: false,
    showDetails: false,
  };

  toggleContext = (method: string) => {
    const { datasourceType, uid: logRowUid } = this.props.row;
    reportInteraction('grafana_explore_logs_log_context_clicked', {
      datasourceType,
      logRowUid,
      type: method,
    });

    this.props.toggleContextIsOpen?.();
    this.setState((state) => {
      return {
        showContext: !state.showContext,
      };
    });
  };

  toggleDetails = () => {
    if (!this.props.enableLogDetails) {
      return;
    }

    reportInteraction('grafana_explore_logs_log_details_clicked', {
      datasourceType: this.props.row.datasourceType,
      type: this.state.showDetails ? 'close' : 'open',
      logRowUid: this.props.row.uid,
      app: this.props.app,
    });

    this.setState((state) => {
      return {
        showDetails: !state.showDetails,
      };
    });
  };

  renderTimeStamp(epochMs: number) {
    return dateTimeFormat(epochMs, {
      timeZone: this.props.timeZone,
    });
  }

  renderLogRow(
    context?: LogRowContextRows,
    errors?: LogRowContextQueryErrors,
    hasMoreContextRows?: HasMoreContextRows,
    updateLimit?: () => void,
    logsSortOrder?: LogsSortOrder | null
  ) {
    const {
      getRows,
      onClickFilterLabel,
      onClickFilterOutLabel,
      onClickShowDetectedField,
      onClickHideDetectedField,
      enableLogDetails,
      row,
      showDuplicates,
      showContextToggle,
      showRowMenu,
      showLabels,
      showTime,
      showDetectedFields,
      wrapLogMessage,
      prettifyLogMessage,
      styles,
      getFieldLinks,
      forceEscape,
      onLogRowHover,
      app,
      scrollElement,
    } = this.props;
    const { showDetails, showContext } = this.state;

    const { errorMessage, hasError } = checkLogsError(row);
    const logRowBackground = cx(styles.logsRow, {
      [styles.errorLogRow]: hasError,
      [styles.contextBackground]: showContext,
    });

    const processedRow =
      row.hasUnescapedContent && forceEscape
        ? { ...row, entry: escapeUnescapedString(row.entry), raw: escapeUnescapedString(row.raw) }
        : row;

    return (
      <>
        <tr
          className={logRowBackground}
          onClick={this.toggleDetails}
          onMouseEnter={() => {
            onLogRowHover && onLogRowHover(row);
          }}
          onMouseLeave={() => {
            onLogRowHover && onLogRowHover(undefined);
          }}
        >
          {showDuplicates && (
            <td className={styles.logsRowDuplicates}>
              {processedRow.duplicates && processedRow.duplicates > 0 ? `${processedRow.duplicates + 1}x` : null}
            </td>
          )}
          <td className={cx({ [styles.logsRowLevel]: !hasError })}>
            {hasError && (
              <Tooltip content={`Error: ${errorMessage}`} placement="right" theme="error">
                <Icon className={styles.logIconError} name="exclamation-triangle" size="xs" />
              </Tooltip>
            )}
          </td>
          {enableLogDetails && (
            <td title={showDetails ? 'Hide log details' : 'See log details'} className={styles.logsRowToggleDetails}>
              <Icon className={styles.topVerticalAlign} name={showDetails ? 'angle-down' : 'angle-right'} />
            </td>
          )}
          {showTime && <td className={styles.logsRowLocalTime}>{this.renderTimeStamp(row.timeEpochMs)}</td>}
          {showLabels && processedRow.uniqueLabels && (
            <td className={styles.logsRowLabels}>
              <LogLabels labels={processedRow.uniqueLabels} />
            </td>
          )}
          {showDetectedFields && showDetectedFields.length > 0 ? (
            <LogRowMessageDetectedFields
              row={processedRow}
              showDetectedFields={showDetectedFields!}
              getFieldLinks={getFieldLinks}
              wrapLogMessage={wrapLogMessage}
            />
          ) : (
            <LogRowMessage
              row={processedRow}
              getRows={getRows}
              errors={errors}
              styles={styles}
              hasMoreContextRows={hasMoreContextRows}
              updateLimit={updateLimit}
              context={context}
              contextIsOpen={showContext}
              showContextToggle={showContextToggle}
              showRowMenu={showRowMenu}
              wrapLogMessage={wrapLogMessage}
              prettifyLogMessage={prettifyLogMessage}
              onToggleContext={this.toggleContext}
              app={app}
              scrollElement={scrollElement}
              logsSortOrder={logsSortOrder}
            />
          )}
        </tr>
        {this.state.showDetails && (
          <LogDetails
            className={logRowBackground}
            showDuplicates={showDuplicates}
            getFieldLinks={getFieldLinks}
            onClickFilterLabel={onClickFilterLabel}
            onClickFilterOutLabel={onClickFilterOutLabel}
            onClickShowDetectedField={onClickShowDetectedField}
            onClickHideDetectedField={onClickHideDetectedField}
            getRows={getRows}
            row={processedRow}
            wrapLogMessage={wrapLogMessage}
            hasError={hasError}
            showDetectedFields={showDetectedFields}
            app={app}
          />
        )}
      </>
    );
  }

  render() {
    const { showContext } = this.state;
    const { logsSortOrder, row, getRowContext } = this.props;

    if (showContext) {
      return (
        <>
          <LogRowContextProvider row={row} getRowContext={getRowContext} logsSortOrder={logsSortOrder}>
            {({ result, errors, hasMoreContextRows, updateLimit, logsSortOrder }) => {
              return <>{this.renderLogRow(result, errors, hasMoreContextRows, updateLimit, logsSortOrder)}</>;
            }}
          </LogRowContextProvider>
        </>
      );
    }

    return this.renderLogRow();
  }
}
