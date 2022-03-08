import React from 'react';
import { CollapsableSection, ColorValueEditor, Field, HorizontalGroup } from '@grafana/ui';
import { AnnotationQuery, DataSourceInstanceSettings } from '@grafana/data';
import { DataSourcePicker, getDataSourceSrv } from '@grafana/runtime';
import { useAsync } from 'react-use';
import StandardAnnotationQueryEditor from 'app/features/annotations/components/StandardAnnotationQueryEditor';
import { AngularEditorLoader } from '../dashboard/components/AnnotationSettings/AngularEditorLoader';

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

  return (
    <div>
      <Field label="Data source" htmlFor="data-source-picker">
        <DataSourcePicker
          width={50}
          annotations
          variables
          current={annotation.datasource}
          onChange={onDataSourceChange}
        />
      </Field>
      <Field label="Color" description="Color to use for the annotation event markers">
        <HorizontalGroup>
          <ColorValueEditor value={annotation?.iconColor} onChange={onColorChange} />
        </HorizontalGroup>
      </Field>
      <CollapsableSection isOpen={true} label="Query">
        {ds?.annotations && (
          <StandardAnnotationQueryEditor datasource={ds} annotation={annotation} onChange={onUpdate} />
        )}
        {ds && !ds.annotations && <AngularEditorLoader datasource={ds} annotation={annotation} onChange={onUpdate} />}
      </CollapsableSection>
    </div>
  );
};

AnnotationQueryEditor.displayName = 'AnnotationQueryEditor';
