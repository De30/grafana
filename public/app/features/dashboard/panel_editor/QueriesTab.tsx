// Libraries
import React, { PureComponent } from 'react';
// Components
import { CustomScrollbar } from '@grafana/ui';
import { QueriesContainer } from '../../query/QueriesContainer';
// Services
import { backendSrv } from 'app/core/services/backend_srv';
// Types
import { PanelModel } from '../state/PanelModel';
import { DashboardModel } from '../state/DashboardModel';
import { DefaultTimeRange, LoadingState, PanelData } from '@grafana/data';
import { Unsubscribable } from 'rxjs';

interface Props {
  panel: PanelModel;
  dashboard: DashboardModel;
}

interface State {
  scrollTop: number;
  data: PanelData;
}

export class QueriesTab extends PureComponent<Props, State> {
  backendSrv = backendSrv;
  querySubscription: Unsubscribable | null;

  state: State = {
    scrollTop: 0,
    data: { state: LoadingState.NotStarted, series: [], timeRange: DefaultTimeRange },
  };

  componentWillUnmount() {
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
      this.querySubscription = null;
    }
  }

  onPanelDataUpdate(data: PanelData) {
    this.setState({ data });
  }

  onScrollBottom = () => {
    this.setState({ scrollTop: 1000 });
  };

  setScrollTop = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    this.setState({ scrollTop: target.scrollTop });
  };

  render() {
    const { scrollTop } = this.state;

    return (
      <CustomScrollbar
        autoHeightMin="100%"
        autoHide={true}
        updateAfterMountMs={300}
        scrollTop={scrollTop}
        setScrollTop={this.setScrollTop}
      >
        <QueriesContainer panel={this.props.panel} dashboard={this.props.dashboard} />
      </CustomScrollbar>
    );
  }
}
