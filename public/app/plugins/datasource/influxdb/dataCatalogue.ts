import { DataCatalogueBuilder, DataCatalogueContext } from '@grafana/data';

import InfluxDatasource from './datasource';
import { getAllMeasurementsForTags, getAllPolicies, getFieldKeysForMeasurement } from './influxQLMetadataQuery';
import { InfluxQuery } from './types';

const RETENTION_POLICY_INFO = `A retention policy (RP) is the part of InfluxDB data structure that describes for how long InfluxDB keeps data. InfluxDB compares your local server’s timestamp to the timestamps on your data and deletes data that are older than the RP’s DURATION. A single database can have several RPs and RPs are unique per database.`;
const RETENTION_POLICY_LINK = {
  url: `https://docs.influxdata.com/influxdb/v1.8/concepts/glossary/#retention-policy-rp`,
  title: 'Read more about InfluxDB retention policies',
};

const MEASUREMENT_INFO = `The part of the InfluxDB data structure that describes the data stored in the associated fields. Measurements are strings.`;
const MEASUREMENT_LINK = {
  url: `https://docs.influxdata.com/influxdb/v1.8/concepts/glossary/#measurement`,
  title: 'Read more about InfluxDB measurements',
};

export const getDataCatalogueCategories = ({
  datasource,
  context,
}: {
  datasource: InfluxDatasource;
  context: DataCatalogueContext;
}) => {
  const dataCategoryFactory = (item: DataCatalogueBuilder) => {
    item
      .addDescription(
        'The InfluxDB data model is made up of measurements, tags, and fields. This model constitutes the shape InfluxDB expects from data. Here, Jacob Marble discusses what each of those components are, and how to use them with InfluxDB.'
      )
      .addLink(
        'https://docs.influxdata.com/resources/videos/data-model-building-blocks/',
        'Learn more about InfluxDB data model'
      )
      .loadItems(async () => {
        return [
          new DataCatalogueBuilder('Retention policies')
            .addDescription(RETENTION_POLICY_INFO)
            .addLink(RETENTION_POLICY_LINK.url, RETENTION_POLICY_LINK.title)
            .loadItems(async () => {
              const policies = await getAllPolicies(datasource);
              return policies.map((policy) => {
                return new DataCatalogueBuilder(policy);
              });
            }),
          new DataCatalogueBuilder('Measurements')
            .addDescription(MEASUREMENT_INFO)
            .addLink(MEASUREMENT_LINK.url, MEASUREMENT_LINK.title)
            .loadItems(async () => {
              const measurements = await getAllMeasurementsForTags(undefined, [], datasource);
              return measurements.map((measurement) => {
                return new DataCatalogueBuilder(measurement, 'Measurement')
                  .addDescription('Select a field from the left.')
                  .loadItems(async () => {
                    const fields = await getFieldKeysForMeasurement(measurement, undefined, datasource);
                    return fields.map((field) =>
                      new DataCatalogueBuilder(field, 'Field')
                        .addKeyValue('measurement', measurement)
                        .addKeyValue('field', field)
                        .addRunQueryAction(
                          'Get mean distribution for this value',
                          getSampleQuery(measurement, field),
                          context
                        )
                    );
                  });
              });
            }),
        ];
      });
  };

  const configurationCategoryFactory = (item: DataCatalogueBuilder) => {
    item.addKeyValue('Database', datasource.database);
    item.addKeyValue('Flux', datasource.isFlux ? 'yes' : 'no');
    item.addKeyValue('HTTP mode', datasource.httpMode);
    item.addKeyValue('Access', datasource.access);
    datasource.interval && item.addKeyValue('Interval', datasource.interval);
  };

  return {
    data: dataCategoryFactory,
    configuration: configurationCategoryFactory,
  };
};

const getSampleQuery = (measurement: string, field: string): Omit<InfluxQuery, 'refId'> => {
  return {
    policy: 'default',
    resultFormat: 'time_series',
    orderByTime: 'ASC',
    tags: [],
    groupBy: [
      {
        type: 'time',
        params: ['$__interval'],
      },
      {
        type: 'fill',
        params: ['null'],
      },
    ],
    select: [
      [
        {
          type: 'field',
          params: [field],
        },
        {
          type: 'mean',
          params: [],
        },
      ],
    ],
    measurement: measurement,
  };
};
