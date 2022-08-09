import React, { useRef, useState } from 'react';

import { Button, Card, Collapse, Modal } from '@grafana/ui';
import { RawQuery } from 'app/plugins/datasource/prometheus/querybuilder/shared/RawQuery';

import logqlGrammar from '../../syntax';
import { LokiQuery } from '../../types';
import { lokiQueryModeller } from '../LokiQueryModeller';
import { buildVisualQueryFromString } from '../parsing';
import { LokiOperationId } from '../types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  query: LokiQuery;
  onChange: (query: LokiQuery) => void;
  onAddQuery: (query: LokiQuery) => void;
};

export const QueryPatternsModal = (props: Props) => {
  const { isOpen, onClose, onChange, query, onAddQuery } = props;

  const [logStartersOpen, setLogStartersOpen] = useState(false);
  const [metricStartersOpen, setMetricStartersOpen] = useState(false);
  const [extraButtonsIndex, setExtraButtonsIndex] = useState<number | null>(null);

  const indexOfSelectedCard = useRef(0);

  const {
    query: { operations },
  } = buildVisualQueryFromString(query.expr);

  const hasWorkingQuery =
    operations.length > 1 ||
    (operations.length === 1 && operations[0].id === LokiOperationId.LineContains && operations[0].params[0] === '');

  const lang = { grammar: logqlGrammar, name: 'logql' };
  return (
    <>
      <Modal isOpen={isOpen} title="Kick start your query" onDismiss={onClose}>
        <div style={{ marginBottom: '10px' }}>
          Kickstart your query by selecting one of these queries. You can then continue to complete your query.
        </div>
        <Collapse
          label="Log query starters"
          isOpen={logStartersOpen}
          collapsible={true}
          onToggle={() => setLogStartersOpen((prevValue) => !prevValue)}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {lokiQueryModeller
              .getQueryPatterns()
              .filter((x) => x.type === 'logs')
              .map((x, index) => (
                <Card key={x.name} style={{ width: '49.5%', display: 'flex', flexDirection: 'column' }}>
                  <Card.Heading>{x.name}</Card.Heading>
                  <Card.Description>
                    <div style={{ backgroundColor: 'black', padding: '8px' }}>
                      <RawQuery
                        query={lokiQueryModeller.renderQuery({ labels: [], operations: x.operations })}
                        lang={lang}
                      />
                    </div>
                  </Card.Description>
                  <Card.Actions>
                    {(!extraButtonsIndex || extraButtonsIndex !== index) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (hasWorkingQuery) {
                            indexOfSelectedCard.current = index;
                            setExtraButtonsIndex(index);
                          } else {
                            const result = buildVisualQueryFromString(query.expr || '');
                            result.query.operations = x.operations;
                            onChange({
                              ...query,
                              expr: lokiQueryModeller.renderQuery(result.query),
                            });
                            onClose();
                          }
                        }}
                      >
                        Use this query
                      </Button>
                    )}
                    {extraButtonsIndex === index && (
                      <>
                        <div style={{ marginBottom: '8px' }}>
                          If you would like to use this query, you can either replace your current query or create a new
                          query.
                        </div>
                        <Button size="sm" fill="outline" onClick={() => setExtraButtonsIndex(null)}>
                          Back
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const result = buildVisualQueryFromString(query.expr || '');
                            result.query.operations = x.operations;
                            onChange({
                              ...query,
                              expr: lokiQueryModeller.renderQuery(result.query),
                            });
                            setExtraButtonsIndex(null);
                            onClose();
                          }}
                        >
                          Replace query
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const result = buildVisualQueryFromString('');
                            result.query.operations = x.operations;
                            onAddQuery({
                              ...query,
                              refId: 'kick',
                              expr: lokiQueryModeller.renderQuery(result.query),
                            });
                            setExtraButtonsIndex(null);
                            onClose();
                          }}
                        >
                          Create new query
                        </Button>
                      </>
                    )}
                  </Card.Actions>
                </Card>
              ))}
          </div>
        </Collapse>

        <Collapse
          label="Metric query starters"
          isOpen={metricStartersOpen}
          collapsible={true}
          onToggle={() => setMetricStartersOpen((prevValue) => !prevValue)}
        >
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {lokiQueryModeller
              .getQueryPatterns()
              .filter((x) => x.type === 'metric')
              .map((x) => (
                <Card key={x.name} style={{ width: '49.5%' }}>
                  <Card.Heading>{x.name}</Card.Heading>
                  <Card.Description>
                    <div style={{ backgroundColor: 'black', padding: '8px' }}>
                      <RawQuery
                        query={lokiQueryModeller.renderQuery({ labels: [], operations: x.operations })}
                        lang={lang}
                      />
                    </div>
                  </Card.Description>
                  <Card.Actions>
                    <Button size="sm">Use this query</Button>
                  </Card.Actions>
                </Card>
              ))}
          </div>
        </Collapse>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal>
    </>
  );
};
