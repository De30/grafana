import React from 'react';
import { ColorValueEditor, HorizontalGroup } from '@grafana/ui';
import { AnnotationQuery, DataSourceInstanceSettings } from '@grafana/data';
import { DataSourcePicker, getDataSourceSrv } from '@grafana/runtime';
import { useAsync } from 'react-use';
import StandardAnnotationQueryEditor from 'app/features/annotations/components/StandardAnnotationQueryEditor';
import { AngularEditorLoader } from '../dashboard/components/AnnotationSettings/AngularEditorLoader';
import {
  QueryOperationRow,
  QueryOperationRowRenderProps,
} from 'app/core/components/QueryOperationRow/QueryOperationRow';
import { QueryEditorRowHeader } from '../query/components/QueryEditorRowHeader';
import { QueryOperationAction } from '../../core/components/QueryOperationRow/QueryOperationAction';

type Props = {
  annotation: AnnotationQuery;
  updateAnnotation: (annotation: AnnotationQuery) => void;
};

export const AnnotationQueryEditor: React.FC<Props> = ({ updateAnnotation, annotation }) => {
  const { value: ds } = useAsync(() => {
    return getDataSourceSrv().get(annotation.datasource);
  }, [annotation.datasource]);

  const onUpdate = (annotation: AnnotationQuery) => {
    updateAnnotation(annotation);
  };

  const onDataSourceChange = (ds: DataSourceInstanceSettings) => {
    onUpdate({
      ...annotation,
      datasource: ds.name,
    });
  };

  const onColorChange = (color: string) => {
    onUpdate({
      ...annotation,
      iconColor: color,
    });
  };

  const renderHeader = (props: QueryOperationRowRenderProps) => {
    // @ts-ignore
    return (
      <QueryEditorRowHeader
        query={annotation.target || { refId: '' }}
        queries={[]}
        onChangeDataSource={onDataSourceChange}
        dataSource={ds}
        disabled={false}
        onClick={() => {}}
        onChange={() => {}}
        collapsedText=""
        renderExtras={undefined}
        alerting={false}
      />
    );
  };

  const renderActions = (props: QueryOperationRowRenderProps) => {
    return (
      <HorizontalGroup width="auto">
        <ColorValueEditor value={annotation?.iconColor} onChange={onColorChange} />
        <QueryOperationAction title="Remove query" icon="trash-alt" onClick={() => {}} />
      </HorizontalGroup>
    );
  };

  return (
    <div>
      <QueryOperationRow
        id=""
        draggable={false}
        index={0}
        headerElement={renderHeader}
        actions={renderActions}
        onOpen={() => {}}
      >
        <div style={{ paddingTop: '20px' }}>
          {ds?.annotations && (
            <StandardAnnotationQueryEditor datasource={ds} annotation={annotation} onChange={onUpdate} />
          )}
          {ds && !ds.annotations && <AngularEditorLoader datasource={ds} annotation={annotation} onChange={onUpdate} />}
        </div>
      </QueryOperationRow>
    </div>
  );
};

AnnotationQueryEditor.displayName = 'AnnotationQueryEditor';
