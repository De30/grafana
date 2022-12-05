import { css } from '@emotion/css';
import React from 'react';

import {
  DataCatalogueItem,
  DataCatalogueItemAttributeAction,
  DataCatalogueItemAttributeDescription,
  DataCatalogueItemAttributeKeyValue,
  GrafanaTheme2,
  IsDataCatalogueItemAttributeAction,
  IsDataCatalogueItemAttributeDescription,
  IsDataCatalogueItemAttributeImage,
  IsDataCatalogueItemAttributeKeyValue,
  IsDataCatalogueItemAttributeTag,
} from '@grafana/data';
import { Button, Tag, useStyles2 } from '@grafana/ui';

type Props = {
  item: DataCatalogueItem;
};

const getStyles = (theme: GrafanaTheme2) => ({
  table: css`
    border-radius: ${theme.shape.borderRadius()};
    background-color: ${theme.colors.background.primary};
    width: 100%;

    td {
      padding: ${theme.spacing(1)};
      border: solid 1px ${theme.colors.border.medium};
    }
  `,
  tag: css`
    margin-right: 5px;
  `,
});

export const DataCatalogueItemDetailsRenderer = (props: Props) => {
  const { item } = props;

  const tableAttributes = (item.attributes || []).filter(IsDataCatalogueItemAttributeKeyValue);
  const actions = (item.attributes || []).filter(IsDataCatalogueItemAttributeAction);
  const descriptions = (item.attributes || []).filter(IsDataCatalogueItemAttributeDescription);
  const images = (item.attributes || []).filter(IsDataCatalogueItemAttributeImage);
  const tags = (item.attributes || []).filter(IsDataCatalogueItemAttributeTag);

  const styles = useStyles2(getStyles);

  return (
    <div>
      <span>
        {item.type ? item.type + ': ' : ''}
        {item.name}
      </span>
      {images.length > 0 && <img src={images[0].url} style={{ maxWidth: 50, maxHeight: 50, float: 'right' }} />}
      {tags && (
        <div>
          {tags.map((tag, index) => (
            <Tag className={styles.tag} key={index} name={tag.tag} />
          ))}
        </div>
      )}
      {descriptions.map(({ description }: DataCatalogueItemAttributeDescription, index) => {
        return (
          <p key={index}>
            <i>{description}</i>
          </p>
        );
      })}
      {tableAttributes && (
        <table className={styles.table}>
          {tableAttributes.map(({ key, value }: DataCatalogueItemAttributeKeyValue) => {
            return (
              <tr>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            );
          })}
        </table>
      )}
      {actions.length > 0 && (
        <div>
          <div>Actions:</div>
          <table className={styles.table}>
            {actions.map(({ name, handler }: DataCatalogueItemAttributeAction, index) => {
              return (
                <tr>
                  <td>{name}</td>
                  <td>
                    <Button icon="play" key={index} variant="secondary" onClick={handler} />
                  </td>
                </tr>
              );
            })}
          </table>
        </div>
      )}
    </div>
  );
};
