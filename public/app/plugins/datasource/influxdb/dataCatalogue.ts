import { DataCatalogueBuilder, DataCatalogueContext } from '@grafana/data';

import InfluxDatasource from './datasource';
import { getAllMeasurementsForTags, getAllPolicies, getFieldKeysForMeasurement } from './influxQLMetadataQuery';

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

export const getRootDataCatalogueItem = async ({
  datasource,
  context,
}: {
  datasource: InfluxDatasource;
  context: DataCatalogueContext;
}) => {
  return new DataCatalogueBuilder()
    .fromDataSource(datasource)
    .addKeyValue('Database', datasource.database)
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
              return new DataCatalogueBuilder(measurement, 'Measurement').loadItems(async () => {
                const fields = await getFieldKeysForMeasurement(measurement, undefined, datasource);
                return fields.map((field) => new DataCatalogueBuilder(field, 'Field'));
              });
            });
          }),
      ];
    });
};
