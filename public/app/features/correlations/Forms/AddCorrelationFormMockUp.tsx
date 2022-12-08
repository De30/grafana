import { css } from '@emotion/css';
import React, { useEffect, useState } from 'react';

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
    variablesMap: {
      Time: undefined,
      'Log line': undefined,
      app: undefined,
      traceId: undefined,
      event: undefined,
    },
    showTransformations: false,
    globalTransformation: 0,
    globalTransformationDefined: false,

    dynamicFields: FIELDS,
  });

  const [showStep, setShowStep] = useState(1);

  // useEffect(() => {
  //   setData({
  //     ...data,
  //     sourceDatasource: 1,
  //     targetDatasource: 2,
  //     sourceQuery: 'test',
  //     targetQuery: 'test',
  //     sampleResult: true,
  //     variablesInTarget: true,
  //   });
  //   setShowStep(2);
  // }, []);

  const LOGFMT_FIELDS = [
    { label: 'app', value: 3 },
    { label: 'event', value: 4 },
    { label: 'traceId', value: 5 },
  ];

  const TRANSFORMATIONS = [
    { label: 'regex', value: 1 },
    { label: 'lofgmt', value: 2 },
  ];

  const VariablePicker = (row) => {
    return (
      <>
        <HorizontalGroup>
          <Label>Map to:</Label>
          {data.sourceQuery ? (
            <Select
              onChange={(event) => {
                const newMap = { ...data.variablesMap };
                newMap[row.row.cells[0].value] = event.label;
                setData({ ...data, variablesMap: newMap });
              }}
              options={[
                { label: 'traceId', value: 'traceId' },
                { label: 'applicationName', value: 'applicationName' },
              ]}
              value={{
                label: data.variablesMap[row.row.cells[0].value],
                value: data.variablesMap[row.row.cells[0].value],
              }}
            />
          ) : (
            <Input />
          )}
        </HorizontalGroup>
      </>
    );
  };

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
    if (data.sampleResult) {
      if (row.row.cells[0].value === 'log line') {
        preview = 'app=foo event=error traceId=16f15cd14';
      } else if (row.row.cells[0].value === 'app') {
        preview = 'foo';
      } else if (row.row.cells[0].value === 'event') {
        preview = 'error';
      } else if (row.row.cells[0].value === 'traceId') {
        preview = '16f15cd14';
      } else if (row.row.cells[0].value === 'time') {
        preview = '2022-10-10 11:11';
      }
    }

    return (
      <div>
        <HorizontalGroup>
          {preview}
          {((!data.showTransformations && !data.globalTransformationDefined) ||
            row.row.cells[0].value !== 'log line') && (
            <Button
              icon="process"
              variant="secondary"
              onClick={() => setData({ ...data, showTransformations: true })}
            ></Button>
          )}
          {!data.showTransformations && data.globalTransformationDefined && row.row.cells[0].value === 'log line' && (
            <Button variant="secondary" onClick={() => setData({ ...data, showTransformations: true })}>
              edit logfmt
            </Button>
          )}
          {data.showTransformations && row.row.cells[0].value === 'log line' && (
            <div>
              <HorizontalGroup>
                <Select
                  onChange={() => {
                    setData({ ...data, globalTransformation: 2, globalTransformationDefined: true });
                  }}
                  options={TRANSFORMATIONS}
                  value={data.globalTransformation}
                />
              </HorizontalGroup>
            </div>
          )}
        </HorizontalGroup>
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
    return <span>{row.cell.value}</span>;
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
                  </div>
                </>
              )}
              {data.variablesInTarget && data.sampleResult && (
                <>
                  <hr />
                  <Table
                    columns={[
                      {
                        id: 'field',
                        header: 'Field',
                      },
                      { id: 'preview', header: 'Sample preview', cell: ValuePreview },
                      {
                        id: 'variable',
                        header: 'Variable',
                        cell: VariablePicker,
                      },
                    ]}
                    data={[
                      {
                        field: 'time',
                        variable: '',
                      },
                      {
                        field: 'log line',
                        variable: '',
                      },
                    ].concat(
                      data.globalTransformationDefined
                        ? [
                            {
                              field: 'app',
                              variable: '',
                            },
                            {
                              field: 'event',
                              variable: '',
                            },
                            {
                              field: 'traceId',
                              variable: '',
                            },
                          ]
                        : []
                    )}
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
