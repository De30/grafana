import { css } from '@emotion/css';
import React, { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import {
  Button,
  Field,
  HorizontalGroup,
  Input,
  Label,
  Modal,
  PanelContainer,
  Select,
  TextArea,
  useStyles2,
} from '@grafana/ui';
import { CloseButton } from 'app/core/components/CloseButton/CloseButton';

import { Table } from '../components/Table';

const getStyles = (theme: GrafanaTheme2) => ({
  panelContainer: css`
    position: relative;
    padding: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(2)};
  `,
  linksToContainer: css`
    flex-grow: 1;
    /* This is the width of the textarea minus the sum of the label&description fields,
     * so that this element takes exactly the remaining space and the inputs will be
     * nicely aligned with the textarea
    **/
    max-width: ${theme.spacing(80 - 64)};
    margin-top: ${theme.spacing(3)};
    text-align: right;
    padding-right: ${theme.spacing(1)};
  `,
  // we can't use HorizontalGroup because it wraps elements in divs and sets margins on them
  horizontalGroup: css`
    display: flex;
  `,
  label: css`
    max-width: ${theme.spacing(32)};
  `,
  description: css`
    max-width: ${theme.spacing(50)};
  `,
  table: css`
    max-width: ${theme.spacing(80)};
  `,
});

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export const AddCorrelationFormMockUp = ({ onClose }: Props) => {
  const styles = useStyles2(getStyles);

  const FIELDS = [
    { label: 'Time', value: 1 },
    { label: 'Log line', value: 2 },
  ];

  const [data, setData] = useState({
    sourceDatasource: 0,
    targetDatasource: 0,
    sourceQuery: '',
    targetQuery: '',
    variablesInTarget: false,
    showSourceQuery: false,
    showSampler: false,
    sampleResult: false,
    transformation: [0, 0],
    showTransformation: [false, false],
    transformationOption: ['', ''],
    field: [0, 0],

    showTransformations: false,
    globalTransformation: 0,
    globalTransformationDefined: false,

    dynamicFields: FIELDS,
  });

  const [showStep, setShowStep] = useState(1);

  const LOGFMT_FIELDS = [
    { label: 'app', value: 3 },
    { label: 'event', value: 4 },
    { label: 'traceId', value: 5 },
  ];

  const TRANSFORMATIONS = [
    { label: 'regex', value: 1 },
    { label: 'lofgmt', value: 2 },
  ];

  const FieldValuePicker = (row) => {
    return (
      <>
        <HorizontalGroup>
          <Label>Field:</Label>
          {data.sourceQuery ? (
            <Select
              onChange={(event) => {
                const field = data.field.concat();
                field[row.row.index] = event.value;
                setData({ ...data, field });
              }}
              options={data.dynamicFields}
              value={data.field[row.row.index]}
            />
          ) : (
            <Input />
          )}
        </HorizontalGroup>
      </>
    );
  };

  const TransformationPicker = (props) => {
    const { row } = props;
    return data.showTransformation[row.row.index] ? (
      <HorizontalGroup>
        <Label>Transformation:</Label>
        <Select
          onChange={() => {
            const transformation = data.transformation.concat();
            transformation[row.row.index] = 2;
            setData({ ...data, transformation });
          }}
          options={TRANSFORMATIONS}
          value={data.transformation[row.row.index]}
        />
        {data.transformation[row.row.index] !== 0 && (
          <Input
            placeholder="name"
            value={data.transformationOption[row.row.index]}
            onClick={() => {
              const transformationOption = data.transformationOption.concat();
              transformationOption[row.row.index] = row.row.index === 0 ? 'traceId' : 'app';
              setData({ ...data, transformationOption });
            }}
          />
        )}
      </HorizontalGroup>
    ) : (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          const showTransformation = data.showTransformation.concat();
          showTransformation[row.row.index] = true;
          setData({ ...data, showTransformation });
        }}
      >
        transform
      </Button>
    );
  };

  const ValuePreview = (row) => {
    let preview = 'no sample or field selected';
    if (data.sampleResult && data.field[row.row.index] !== 0) {
      if (data.field[row.row.index] === 2) {
        return 'app=foo event=error traceId=16f15cd14';
      } else if (data.field[row.row.index] === 3) {
        return 'foo';
      } else if (data.field[row.row.index] === 4) {
        return 'error';
      } else if (data.field[row.row.index] === 5) {
        return '16f15cd14';
      }
    }

    return (
      <div>
        <HorizontalGroup>{preview}</HorizontalGroup>
      </div>
    );
  };

  const RowSelector = (row) => {
    return (
      <Button
        icon="plus"
        variant="secondary"
        onClick={() => {
          setData({ ...data, showSampler: false, sampleResult: true });
        }}
      />
    );
  };

  const FieldValueSelector = (row) => {
    return (
      <span>{row.cell.value}</span>
      // <Button
      //   variant="secondary"
      //   onClick={() => {
      //     const field = data.field.concat();
      //     const M = {
      //       time: 1,
      //       line: 2,
      //       app: 3,
      //       event: 4,
      //       traceId: 5,
      //     };
      //     field[row.row.index] = M[row.cell.column.id];
      //     setData({ ...data, showSampler: false, sampleResult: true });
      //   }}
      // >
      //   {row.cell.value}
      // </Button>
    );
  };

  const step1View = (
    <>
      <div>
        <h5>Target query</h5>
        <p>Define the query you would like to be run when the data link is clicked.</p>
      </div>
      <Field label="Target data source" className={styles.label}>
        <Select
          onChange={() => setData({ ...data, targetDatasource: 2 })}
          options={[{ label: 'Data source 2', value: 2 }]}
          value={data.targetDatasource}
        />
      </Field>
      {data.targetDatasource === 2 && (
        <div>
          <Field label="Target query">
            <Input
              value={data.targetQuery}
              onClick={() => {
                if (!data.variablesInTarget) {
                  setData({
                    ...data,
                    targetQuery:
                      'SELECT traceId FROM traces WHERE traceId=${traceId} AND applicationName=${applicationName}',
                    variablesInTarget: true,
                  });
                } else {
                  setData({ ...data, targetQuery: 'SELECT * FROM traces', variablesInTarget: false });
                }
              }}
            />
          </Field>
          {data.variablesInTarget && (
            <p>
              You have used following variables:<pre>traceId applicationName</pre>Go to the next step to define how
              value is populated for each variable.
            </p>
          )}
          <HorizontalGroup justify="flex-end">
            <Button
              variant="primary"
              onClick={() => {
                setShowStep(2);
              }}
            >
              Next
            </Button>
          </HorizontalGroup>
        </div>
      )}
    </>
  );

  const step2View = (
    <>
      <div>
        <div>
          <h5>Source data</h5>
          <p>Define how target query is filled with data</p>
          <Field label="Source data source" className={styles.label}>
            <Select
              onChange={() => setData({ ...data, sourceDatasource: 2 })}
              options={[{ label: 'Data source 1', value: 2 }]}
              value={data.sourceDatasource}
            />
          </Field>
          {data.sourceDatasource !== 0 && (
            <div>
              <h6>Selected sample</h6>
              <p>Use a sample data point from data source query to get suggestions and apply transformations.</p>
              {!data.sampleResult && (
                <p>
                  <Button variant="secondary" onClick={() => setData({ ...data, showSampler: true })}>
                    select a sample
                  </Button>
                </p>
              )}
              {data.sampleResult && (
                <>
                  <div>
                    <Table
                      columns={[
                        {
                          id: 'time',
                          header: 'time',
                        },
                        {
                          id: 'line',
                          header: 'log line',
                        },
                      ]}
                      data={[
                        {
                          time: '2022-10-10 11:11',
                          line: 'app=foo event=error traceId=16f15cd14',
                          app: 'foo',
                          event: 'error',
                          traceId: '16f15cd14',
                        },
                      ]}
                    ></Table>
                    {data.variablesInTarget && (
                      <p style={{ paddingTop: 10 }}>Extract more fields by adding transformations</p>
                    )}
                    {data.showTransformations && (
                      <div>
                        <HorizontalGroup>
                          <Label>Transformation:</Label>
                          <Select
                            onChange={() => {
                              setData({ ...data, globalTransformation: 2 });
                            }}
                            options={TRANSFORMATIONS}
                            value={data.globalTransformation}
                          />
                          {data.globalTransformation !== 0 && (
                            <>
                              <Label>Field:</Label>
                              <Select
                                onChange={() => {
                                  setData({
                                    ...data,
                                    globalTransformationDefined: true,
                                    dynamicFields: FIELDS.concat(data.globalTransformationDefined ? [] : LOGFMT_FIELDS),
                                  });
                                }}
                                options={FIELDS}
                              />
                            </>
                          )}
                          <Button
                            icon="plus"
                            variant="secondary"
                            size="sm"
                            onClick={() => setData({ ...data, showTransformations: true })}
                          ></Button>
                        </HorizontalGroup>
                      </div>
                    )}
                    {!data.showTransformations && data.variablesInTarget && (
                      <Button
                        icon="plus"
                        variant="secondary"
                        size="sm"
                        onClick={() => setData({ ...data, showTransformations: true })}
                      >
                        add new transformation
                      </Button>
                    )}
                    {!data.showTransformations && !data.variablesInTarget && (
                      <p>
                        You don't have any variables in your target query. Go to the next step to define where the data
                        link is displayed.
                      </p>
                    )}
                  </div>
                  {data.globalTransformationDefined && (
                    <>
                      <hr />
                      <h6>Fields extracted from transformations</h6>
                      <Table
                        columns={[
                          { id: 'app', header: 'app' },
                          { id: 'event', header: 'event' },
                          { id: 'traceId', header: 'traceId' },
                        ]}
                        data={[
                          {
                            time: '2022-10-10 11:11',
                            line: 'app=foo event=error traceId=16f15cd14',
                            app: 'foo',
                            event: 'error',
                            traceId: '16f15cd14',
                          },
                        ]}
                      ></Table>
                    </>
                  )}
                </>
              )}
              {data.variablesInTarget && (
                <>
                  <hr />
                  <Table
                    columns={[
                      {
                        id: 'variable',
                        header: 'Variable name',
                      },
                      {
                        id: 'value',
                        header: 'Value',
                        cell: FieldValuePicker,
                      },
                      { id: 'preview', header: 'Sample preview', cell: ValuePreview },
                    ]}
                    data={[
                      {
                        variable: 'traceId',
                        value: '',
                      },
                      {
                        variable: 'applicationName',
                        value: '',
                      },
                    ]}
                  />
                </>
              )}
            </div>
          )}
        </div>
        <HorizontalGroup justify="flex-end">
          <Button variant="secondary" onClick={() => setShowStep(1)}>
            Back
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowStep(3);
            }}
          >
            Next
          </Button>
        </HorizontalGroup>
      </div>
    </>
  );

  const step3View = (
    <>
      <div>
        <h5>Data Link</h5>
        <p>Determine where the data links button will be displayed when source query results are displayed.</p>
      </div>

      <div>
        <div>
          <Field label="Label" className={styles.label}>
            <Input placeholder="i.e. Tempo traces" />
          </Field>

          <Field label="Description" className={styles.description}>
            <TextArea />
          </Field>

          {!data.sourceQuery && (
            <HorizontalGroup>
              <Field
                label="Target field"
                className={styles.label}
                description="This determines where the link is displayed on the results for the source query."
              >
                <Input />
              </Field>
              <Button
                variant="secondary"
                size="sm"
                icon="question-circle"
                onClick={() => setData({ ...data, showSourceQuery: true })}
              />
            </HorizontalGroup>
          )}

          {data.sourceQuery && (
            <>
              <Field
                label="Target field"
                description="This determines where the link is displayed on the results for the source query."
              >
                <Select className={styles.label} onChange={() => setData({ ...data })} options={FIELDS} />
              </Field>
            </>
          )}
        </div>

        <HorizontalGroup justify="flex-end">
          <Button variant="secondary" onClick={() => setShowStep(data.variablesInTarget ? 2 : 1)}>
            Back
          </Button>
          <Button variant="primary">Save</Button>
        </HorizontalGroup>
      </div>
    </>
  );

  return (
    <PanelContainer className={styles.panelContainer}>
      <CloseButton onClick={onClose} />
      {showStep === 1 ? step1View : showStep === 2 ? step2View : step3View}

      <Modal title="Sample source query" isOpen={data.showSourceQuery}>
        <div>
          <p>Write a sample query to get a list of available fields.</p>
          <Field label="Source query">
            <Input
              value={data.sourceQuery}
              onClick={() => setData({ ...data, sourceQuery: 'SELECT log_line FROM logs' })}
            />
          </Field>
          <Button variant="secondary" onClick={() => setData({ ...data, showSourceQuery: false })}>
            OK
          </Button>
        </div>
      </Modal>

      <Modal title="Sampler" isOpen={data.showSampler}>
        <div>
          <p>Write a sample source query that returns data containing value for your variables</p>
          <Field label="Source query">
            <Input
              value={data.sourceQuery}
              onClick={() => setData({ ...data, sourceQuery: 'SELECT log_line FROM logs' })}
            />
          </Field>
          {data.sourceQuery && (
            <>
              <p>Select a sample row that contains the value for the variable</p>
              <Table
                columns={[
                  { id: 'selector', header: '', cell: RowSelector },
                  {
                    id: 'time',
                    header: 'time',
                    cell: FieldValueSelector,
                  },
                  {
                    id: 'line',
                    header: 'log line',
                    cell: FieldValueSelector,
                  },
                ]}
                data={[
                  {
                    time: '2022-10-10 10:10',
                    line: 'app=foo event=request traceId=16f15cd14',
                  },
                  {
                    time: '2022-10-10 11:11',
                    line: 'app=foo event=error traceId=16f15cd14',
                  },
                ]}
              ></Table>
            </>
          )}
        </div>
      </Modal>
    </PanelContainer>
  );
};
