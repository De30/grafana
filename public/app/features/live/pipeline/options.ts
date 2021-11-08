export const optionsFromBackend = {
  converters: [
    { type: 'jsonAuto', description: 'automatic recursive JSON to Frame conversion' },
    { type: 'jsonExact', description: 'JSON to Frame conversion according to exact list of fields' },
    { type: 'influxAuto', description: 'accept influx line protocol', example: { frameFormat: 'labels_column' } },
    { type: 'jsonFrame', description: 'JSON-encoded Grafana data frame' },
  ],
  dataOutputs: [
    { type: 'builtin', description: 'use builtin publish handler' },
    { type: 'redirect', description: 'redirect data processing to another channel rule' },
  ],
  frameOutputs: [
    {
      type: 'managedStream',
      description: 'only send schema when structure changes (note this also requires a matching subscriber)',
      example: {},
    },
    {
      type: 'conditional',
      description: 'send to an output depending on frame values',
      example: { condition: null, output: null },
    },
    { type: 'redirect', description: 'redirect for processing by another channel rule' },
    { type: 'threshold', description: 'output field threshold boundaries cross into new channel' },
    { type: 'changeLog', description: 'output field changes into new channel' },
    { type: 'remoteWrite', description: 'output to remote write endpoint' },
  ],
  frameProcessors: [
    { type: 'keepFields', description: 'list the fields that should stay', example: { fieldNames: null } },
    { type: 'dropFields', description: 'list the fields that should be removed', example: { fieldNames: null } },
  ],
  subscribers: [
    { type: 'builtin', description: 'apply builtin feature subscribe logic' },
    { type: 'managedStream', description: 'apply managed stream subscribe logic' },
  ],
};
