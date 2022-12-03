import { CoreApp } from './app';
import { DataQuery } from './query';

export interface DataCatalogueItemAction {
  name: string;
  handler: () => void;
  icon?: string;
}

export enum DataCatalogueItemAttributeType {
  KeyValue = 'KeyValue',
  Icon = 'Icon',
  Action = 'Action',
}

export interface DataCatalogueItemAttribute {
  type: DataCatalogueItemAttributeType;
}

export class DataCatalogueItemAttributeKeyValue implements DataCatalogueItemAttribute {
  type = DataCatalogueItemAttributeType.KeyValue;
  key: string;
  value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }
}

export const IsDataCatalogueItemAttributeKeyValue = (
  attribute: DataCatalogueItemAttribute
): attribute is DataCatalogueItemAttributeKeyValue => {
  return attribute.type === DataCatalogueItemAttributeType.KeyValue;
};

export const IsDataCatalogueItemAttributeIcon = (
  attribute: DataCatalogueItemAttribute
): attribute is DataCatalogueItemAttributeIcon => {
  return attribute.type === DataCatalogueItemAttributeType.Icon;
};

export const IsDataCatalogueItemAttributeAction = (
  attribute: DataCatalogueItemAttribute
): attribute is DataCatalogueItemAttributeAction => {
  return attribute.type === DataCatalogueItemAttributeType.Action;
};

export class DataCatalogueItemAttributeIcon implements DataCatalogueItemAttribute {
  type = DataCatalogueItemAttributeType.Icon;
  icon: string;
  name: string;
  info: string;

  constructor(name: string, icon: string, info: string) {
    this.name = name;
    this.icon = icon;
    this.info = info;
  }
}

export class DataCatalogueItemAttributeAction implements DataCatalogueItemAttribute {
  type = DataCatalogueItemAttributeType.Action;
  name: string;
  handler: () => void;

  constructor(name: string, handler: () => void) {
    this.name = name;
    this.handler = handler;
  }
}

export interface DataCatalogueItem {
  name: string;
  attributes?: DataCatalogueItemAttribute[];
  // @deprecated
  attrs?: Record<string, string>;
  // @deprecated
  actions?: DataCatalogueItemAction[];
}

export interface DataCatalogueFolder extends DataCatalogueItem {
  items(): Promise<DataCatalogueItem[]>;
}

/**
 * @internal
 */
export interface DataCatalogueProvider<TQuery extends DataQuery> {
  getRootDataCatalogueFolder(context: DataCatalogueContext<TQuery>): Promise<DataCatalogueFolder>;
}

/**
 * @internal
 */
export const hasDataCatalogueSupport = <TQuery extends DataQuery>(
  datasource: unknown
): datasource is DataCatalogueProvider<TQuery> => {
  return (datasource as DataCatalogueProvider<TQuery>).getRootDataCatalogueFolder !== undefined;
};

export const isDataCatalogueFolder = (item: DataCatalogueItem): item is DataCatalogueFolder => {
  return (item as DataCatalogueFolder).items !== undefined;
};

export class DataCatalogueItemBuilder implements DataCatalogueItem {
  name: string;
  attributes: DataCatalogueItemAttribute[] = [];

  constructor(name: string) {
    this.name = name;
  }

  addKeyValue(key: string, value: string) {
    this.attributes.push(new DataCatalogueItemAttributeKeyValue(key, value));
    return this;
  }

  addIcon(name: string, icon: string, info: string) {
    this.attributes.push(new DataCatalogueItemAttributeIcon(name, icon, info));
    return this;
  }

  addAction(name: string, handler: () => void) {
    this.attributes.push(new DataCatalogueItemAttributeAction(name, handler));
    return this;
  }

  // @deprecated
  addAttr(name: string, value: string) {
    this.attributes.push(new DataCatalogueItemAttributeKeyValue(name, value));
    return this;
  }

  // @deprecated
  addActions(name: string, handler: () => void) {
    this.attributes.push(new DataCatalogueItemAttributeAction(name, handler));
    return this;
  }
}

export class DataCatalogueFolderBuilder extends DataCatalogueItemBuilder implements DataCatalogueFolder {
  private _itemsLoader?: () => Promise<DataCatalogueItem[]>;

  loadItems(loader: () => Promise<DataCatalogueItem[]>) {
    this._itemsLoader = loader;
    return this;
  }

  setItems(items: DataCatalogueItem[]) {
    this._itemsLoader = async () => items;
    return this;
  }

  async items(): Promise<DataCatalogueItem[]> {
    if (this._itemsLoader) {
      const results = await this._itemsLoader();
      console.log(results);
      return results;
    } else {
      return [];
    }
  }
}

export type DataCatalogueContext<TQuery extends DataQuery> = {
  closeDataCatalogue: () => void;
  app?: CoreApp;
  // query context
  queryRefId?: string;
  changeQuery?: (query: TQuery) => void;
  runQuery?: () => void;
};
