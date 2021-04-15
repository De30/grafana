import { GraphiteDatasource } from './datasource';
import { GraphiteQueryCtrl } from './query_ctrl';
import { DataSourcePlugin } from '@grafana/data';
import { ConfigEditor } from './configuration/ConfigEditor';
import { MetricTankMetaInspector } from './MetricTankMetaInspector';
import { QueryEditor } from './components/QueryEditor';

class AnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
}

const ENABLE_REACT_QUERY_EDITOR = true;

const plugin = new DataSourcePlugin(GraphiteDatasource)
  .setConfigEditor(ConfigEditor)
  .setMetadataInspector(MetricTankMetaInspector)
  .setAnnotationQueryCtrl(AnnotationsQueryCtrl);

if (ENABLE_REACT_QUERY_EDITOR) {
  plugin.setQueryEditor(QueryEditor);
} else {
  plugin.setQueryCtrl(GraphiteQueryCtrl);
}

export { plugin };
