import React, { PureComponent } from 'react';
import { InlineField, Switch, Input } from '@grafana/ui';
import { QueryEditorProps, BrowseRequest, DataSourceSelectItem } from '@grafana/data';
import { GrafanaDatasource } from '../datasource';
import { GrafanaQuery } from '../types';
import DataSourcePicker from 'app/core/components/Select/DataSourcePicker';
import { getDatasourceSrv } from 'app/features/plugins/datasource_srv';

type Props = QueryEditorProps<GrafanaDatasource, GrafanaQuery>;

const labelWidth = 12;

export class BrowseQueryEditor extends PureComponent<Props> {
  datasources = getBrowseDatasources();

  onChangeDataSource = (ds: DataSourceSelectItem) => {
    console.log('DS', ds);
  };

  render() {
    const { query } = this.props;
    const browse = query.browse ?? ({} as BrowseRequest);

    return (
      <>
        <div className="gf-form">
          <InlineField label="Datasource" labelWidth={labelWidth}>
            <DataSourcePicker datasources={this.datasources} onChange={this.onChangeDataSource} current={null} />
          </InlineField>
          <InlineField label="Scope" grow={true}>
            <div>[scopes]</div>
          </InlineField>
        </div>
        <div className="gf-form">
          <InlineField label="Path" labelWidth={labelWidth} grow={true}>
            <Input value={browse.path} />
          </InlineField>
          <InlineField label="Verbose">
            <Switch
              label="Verbose"
              checked={browse.verbose}
              onChange={() => {
                console.log('toggle');
              }}
            />
          </InlineField>
          <InlineField label="Values">
            <Switch
              label="Values"
              checked={browse.values}
              onChange={() => {
                console.log('toggle');
              }}
            />
          </InlineField>
        </div>
      </>
    );
  }
}

export const getBrowseDatasources = (): DataSourceSelectItem[] => {
  return getDatasourceSrv()
    .getExternal()
    .map(
      (ds: any) =>
        ({
          value: ds.name,
          name: ds.name,
          meta: ds.meta,
        } as DataSourceSelectItem)
    );
};
