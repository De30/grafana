import React, { PureComponent } from 'react';

import {
  AppEvents,
  FeatureState,
  fieldReducers,
  getFieldDisplayName,
  PanelProps,
  ReducerID,
  ActionRequest,
} from '@grafana/data';
import { FormPanelOptions, TargetType } from './types';
import { FeatureInfoBox, Label, InlineField, Input, Button, Spinner } from '@grafana/ui';
import { FormSection } from './runtime';
import { getFieldMap } from './utils';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { appEvents } from 'app/core/core';
import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';

interface Props extends PanelProps<FormPanelOptions> {}

interface State {
  sections: FormSection[];
  changed?: boolean;
  saving?: boolean;
}

export class FormPanel extends PureComponent<Props, State> {
  state: State = {
    sections: [],
  };

  constructor(props: Props) {
    super(props);
  }

  componentDidMount() {
    this.initSections();
  }

  componentDidUpdate(oldProps: Props) {
    if (oldProps.options !== this.props.options) {
      this.initSections();
    } else if (oldProps.data !== this.props.data) {
      console.log('DATA changed!');
    }
  }

  initSections() {
    const { data, options } = this.props;
    const byId = getFieldMap(data.series);
    const reduce = fieldReducers.get(ReducerID.last).reduce!;
    const sections: FormSection[] = (options.sections ?? []).map(s => {
      return {
        config: s,
        values: (s.values ?? []).map(v => {
          const field = byId[v.path];
          const last = field ? reduce(field, true, false)[ReducerID.last] : undefined;
          let title = s.title!;
          if (!s.title) {
            if (field) {
              title = getFieldDisplayName(field);
            } else {
              title = v.path;
            }
          }

          return {
            title,
            config: v,
            field,
            last,
          };
        }),
      };
    });

    this.setState({ sections });
  }

  onSave = async () => {
    const { options } = this.props;
    let url = options.url;
    if (options.target === TargetType.DS) {
      // Find the current panel
      const panel = getDashboardSrv()
        .getCurrent()
        .panels.find(p => p.id === this.props.id);
      if (!panel) {
        appEvents.emit(AppEvents.alertWarning, ['Error getting dashboard']);
        return;
      }
      const ds = await getDataSourceSrv().get(panel.datasource);
      if (!ds?.id) {
        appEvents.emit(AppEvents.alertWarning, ['Invalid datasource']);
        return;
      }
      url = `api/datasources/${ds.id}/resources/form`; // NOTE: assume 'form' endpoint
    }

    if (!url) {
      appEvents.emit(AppEvents.alertWarning, ['Invalid URL']);
    }
    const data: ActionRequest = {
      page: window.location.pathname,
      id: options.id,
      comment: 'TODO add a comment field',
      action: [],
    };

    for (const s of this.state.sections) {
      for (const v of s.values) {
        data.action.push({
          path: v.config.path,
          value: v.edit,
        });
      }
    }

    console.log('SEND', data, ' >>> TO >>> ', url);

    this.setState({ saving: true });
    const rsp = await getBackendSrv()
      .fetch({
        url: url!,
        method: 'POST',
        data,
      })
      .toPromise();
    console.log('PROCESS', rsp);
    this.setState({ saving: false });
  };

  render() {
    const { options } = this.props;
    const { labelWidth, sections } = options;

    if (!sections?.length) {
      return (
        <FeatureInfoBox title="Forms panel" featureState={FeatureState.alpha}>
          <p>This panel is in active development. The behavior will evolve for a while...</p>
          <p>NOTE: no fields are configured, use the panel editor to define a set of fields</p>
        </FeatureInfoBox>
      );
    }

    return (
      <>
        {sections.map((section, idx) => {
          return (
            <div key={idx}>
              <Label description={section.description}>{section.title}</Label>
              {section.values.map((v, idx2) => {
                return (
                  <InlineField key={`${idx}/${idx2}`} label={v.title ?? 'Title'} labelWidth={labelWidth} grow>
                    <Input placeholder="Inline input" />
                  </InlineField>
                );
              })}
            </div>
          );
        })}
        <div>
          <Button onClick={this.onSave} variant={this.state.changed ? 'primary' : 'secondary'}>
            {this.state.saving ? <Spinner /> : 'Save'}
          </Button>
        </div>
      </>
    );
  }
}
