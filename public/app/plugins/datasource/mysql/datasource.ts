import { map as _map } from 'lodash';

import { DataSourceInstanceSettings, ScopedVars } from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime';
import MySQLQueryModel from 'app/plugins/datasource/mysql/mysql_query_model';

import { SqlDatasource } from '../sql/datasource/datasource';
import { ResponseParser, SQLOptions, SQLQuery, SqlQueryModel } from '../sql/types';

import MySqlResponseParser from './response_parser';

export class MysqlDatasource extends SqlDatasource {
  constructor(instanceSettings: DataSourceInstanceSettings<SQLOptions>) {
    super(instanceSettings);
  }

  getQueryModel(target?: SQLQuery, templateSrv?: TemplateSrv, scopedVars?: ScopedVars): SqlQueryModel {
    return new MySQLQueryModel(target, templateSrv, scopedVars);
  }

  getResponseParser(): ResponseParser {
    return new MySqlResponseParser();
  }
}
