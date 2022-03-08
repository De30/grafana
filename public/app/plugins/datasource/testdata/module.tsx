import { DataSourcePlugin } from '@grafana/data';
import { TestDataDataSource } from './datasource';
import { TestInfoTab } from './TestInfoTab';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';

class TestDataAnnotationsQueryCtrl {
  annotation: any;
  constructor() {}
  static template = '<span>10 random annotations will be generated for the currently selected time range.</span>';
}

export const plugin = new DataSourcePlugin(TestDataDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setAnnotationQueryCtrl(TestDataAnnotationsQueryCtrl)
  .addConfigPage({
    title: 'Setup',
    icon: 'list-ul',
    body: TestInfoTab,
    id: 'setup',
  });
