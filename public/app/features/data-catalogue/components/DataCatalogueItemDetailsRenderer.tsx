import { css } from '@emotion/css';
import React from 'react';

import {
  DataCatalogueItem,
  DataCatalogueItemAttributeAction,
  DataCatalogueItemAttributeActionLink,
  DataCatalogueItemAttributeKeyValue,
  DataCatalogueItemAttributeKeyValueFormat,
  GrafanaTheme2,
  isDataCatalogueFolder,
  IsDataCatalogueItemAttributeAction,
  IsDataCatalogueItemAttributeActionLink,
  IsDataCatalogueItemAttributeCustom,
  IsDataCatalogueItemAttributeDescription,
  IsDataCatalogueItemAttributeImage,
  IsDataCatalogueItemAttributeKeyValue,
  IsDataCatalogueItemAttributeLink,
  IsDataCatalogueItemAttributeTag,
} from '@grafana/data';
import { Button, LinkButton, Tag, useStyles2 } from '@grafana/ui';

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

  const isFolder = isDataCatalogueFolder(props.item);

  const tableAttributes = (item.attributes || []).filter(IsDataCatalogueItemAttributeKeyValue);
  const actions = (item.attributes || []).filter(IsDataCatalogueItemAttributeAction);
  const actionLinks = (item.attributes || []).filter(IsDataCatalogueItemAttributeActionLink);
  const descriptions = (item.attributes || []).filter(IsDataCatalogueItemAttributeDescription);
  const links = (item.attributes || []).filter(IsDataCatalogueItemAttributeLink);
  const images = (item.attributes || []).filter(IsDataCatalogueItemAttributeImage);
  const tags = (item.attributes || []).filter(IsDataCatalogueItemAttributeTag);
  const custom = (item.attributes || []).filter(IsDataCatalogueItemAttributeCustom);

  const sparseContent = tableAttributes.length + actions.length + descriptions.length + links.length === 0;

  const styles = useStyles2(getStyles);

  return (
    <div>
      {images.length > 0 && (
        <img alt="data source logo" src={images[0].url} style={{ maxWidth: 50, maxHeight: 50, float: 'right' }} />
      )}
      <p>
        {item.type ? item.type + ': ' : ''}
        {item.name}
      </p>
      {tags && (
        <p>
          {tags.map((tag, index) => (
            <Tag className={styles.tag} key={index} name={tag.tag} />
          ))}
        </p>
      )}
      {descriptions.map(({ description }, index) => {
        return (
          <p key={index}>
            <i>{description}</i>
          </p>
        );
      })}
      {links.map(({ url, title }, index) => {
        return (
          <p key={index}>
            <LinkButton variant="secondary" href={url} target="_blank" rel="noreferrer">
              {title || url}
            </LinkButton>
          </p>
        );
      })}
      {tableAttributes && (
        <table className={styles.table}>
          {tableAttributes.map(({ key, value, format }: DataCatalogueItemAttributeKeyValue, index) => {
            return (
              <tr key={index}>
                <td>{key}</td>
                <td>
                  {format === DataCatalogueItemAttributeKeyValueFormat.Code ? <pre>{value}</pre> : <span>{value}</span>}
                </td>
              </tr>
            );
          })}
        </table>
      )}
      {custom && custom.length > 0 && custom.map((customAttribute) => customAttribute.component)}
      {actions.length + actionLinks.length > 0 && (
        <div>
          <p>Actions:</p>
          <table className={styles.table}>
            {actions.map(({ name, handler }: DataCatalogueItemAttributeAction, index) => {
              return (
                <tr key={`action_${index}`}>
                  <td>{name}</td>
                  <td>
                    <Button icon="play" key={index} variant="secondary" onClick={handler} />
                  </td>
                </tr>
              );
            })}
            {actionLinks.map(({ name, url }: DataCatalogueItemAttributeActionLink, index) => {
              return (
                <tr key={`actionLink_${index}`}>
                  <td>{name}</td>
                  <td>
                    <LinkButton icon="play" key={index} variant="secondary" href={url} />
                  </td>
                </tr>
              );
            })}
          </table>
        </div>
      )}

      {sparseContent && isFolder ? 'Select one of the sub-items on the left.' : ''}
    </div>
  );
};
