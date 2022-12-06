import { CoreApp } from './app';
import { DataSourceApi, DataSourceJsonData } from './datasource';
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
  ActionLink = 'ActionLink',
  Image = 'Image',
  Link = 'Link',
  Description = 'Description',
  Tag = 'Tag',
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

export const IsDataCatalogueItemAttributeActionLink = (
  attribute: DataCatalogueItemAttribute
): attribute is DataCatalogueItemAttributeActionLink => {
  return attribute.type === DataCatalogueItemAttributeType.ActionLink;
};

export const IsDataCatalogueItemAttributeTag = (
  attribute: DataCatalogueItemAttribute
): attribute is DataCatalogueItemAttributeTag => {
  return attribute.type === DataCatalogueItemAttributeType.Tag;
};

export const IsDataCatalogueItemAttributeDescription = (
  attribute: DataCatalogueItemAttribute
): attribute is DataCatalogueItemAttributeDescription => {
  return attribute.type === DataCatalogueItemAttributeType.Description;
};

export const IsDataCatalogueItemAttributeImage = (
  attribute: DataCatalogueItemAttribute
): attribute is DataCatalogueItemAttributeImage => {
  return attribute.type === DataCatalogueItemAttributeType.Image;
};

export const IsDataCatalogueItemAttributeLink = (
  attribute: DataCatalogueItemAttribute
): attribute is DataCatalogueItemAttributeLink => {
  return attribute.type === DataCatalogueItemAttributeType.Link;
};

export class DataCatalogueItemAttributeIcon implements DataCatalogueItemAttribute {
  type = DataCatalogueItemAttributeType.Icon;
  icon: string;
  info: string;

  constructor(icon: string, info: string) {
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

export class DataCatalogueItemAttributeActionLink implements DataCatalogueItemAttribute {
  type = DataCatalogueItemAttributeType.ActionLink;
  name: string;
  url: string;

  constructor(name: string, url: string) {
    this.name = name;
    this.url = url;
  }
}

export class DataCatalogueItemAttributeImage implements DataCatalogueItemAttribute {
  type = DataCatalogueItemAttributeType.Image;
  url: string;

  constructor(url: string) {
    this.url = url;
  }
}

export class DataCatalogueItemAttributeLink implements DataCatalogueItemAttribute {
  type = DataCatalogueItemAttributeType.Link;
  url: string;
  title?: string;

  constructor(url: string, title?: string) {
    this.url = url;
    this.title = title;
  }
}

export class DataCatalogueItemAttributeTag implements DataCatalogueItemAttribute {
  type = DataCatalogueItemAttributeType.Tag;
  tag: string;

  constructor(tag: string) {
    this.tag = tag;
  }
}

export class DataCatalogueItemAttributeDescription implements DataCatalogueItemAttribute {
  type = DataCatalogueItemAttributeType.Description;
  description: string;

  constructor(description: string) {
    this.description = description;
  }
}

export interface DataCatalogueItem {
  name: string;
  type?: string;
  createAttributes?: () => Promise<void>;
  attributes?: DataCatalogueItemAttribute[];
  // @deprecated
  attrs?: Record<string, string>;
  // @deprecated
  actions?: DataCatalogueItemAction[];
}

export interface DataCatalogueFolder extends DataCatalogueItem {
  createItems?: () => Promise<void>;
  items?: DataCatalogueItem[];
}

export interface LazyDataCatalogueItem extends DataCatalogueItem {
  createAttributes: () => Promise<void>;
}

export interface LazyDataCatalogueFolder extends DataCatalogueFolder {
  createItems: () => Promise<void>;
}

/**
 * @internal
 */
export interface DataCatalogueProvider {
  getRootDataCatalogueItem(context: DataCatalogueContext): Promise<DataCatalogueItem>;
}

/**
 * @internal
 */
export const hasDataCatalogueSupport = (datasource: unknown): datasource is DataCatalogueProvider => {
  return (datasource as DataCatalogueProvider).getRootDataCatalogueItem !== undefined;
};

export const isDataCatalogueFolder = (item: DataCatalogueItem): item is DataCatalogueFolder => {
  return (item as DataCatalogueFolder).items !== undefined || (item as DataCatalogueFolder).createItems !== undefined;
};

export const IsLazyDataCatalogueFolder = (item: DataCatalogueItem): item is LazyDataCatalogueFolder => {
  return (item as LazyDataCatalogueFolder).createItems !== undefined;
};

export const IsLazyDataCatalogueItem = (item: DataCatalogueItem): item is LazyDataCatalogueItem => {
  return (item as LazyDataCatalogueItem).createAttributes !== undefined;
};

/**
 * Use the builder to create data catalogue items
 */
export class DataCatalogueBuilder implements DataCatalogueItem {
  name: string;
  type?: string;
  attributes: DataCatalogueItemAttribute[] = [];
  createAttributes?: () => Promise<void>;
  createItems?: () => Promise<void>;
  items: DataCatalogueItem[] = [];

  constructor(name?: string, type?: string) {
    this.name = name || '';
    this.type = type;
  }

  addKeyValue(key: string, value: string) {
    this.attributes.push(new DataCatalogueItemAttributeKeyValue(key, value));
    return this;
  }

  addIcon(icon: string, info: string) {
    this.attributes.push(new DataCatalogueItemAttributeIcon(icon, info));
    return this;
  }

  addAction(name: string, handler: () => void) {
    this.attributes.push(new DataCatalogueItemAttributeAction(name, handler));
    return this;
  }

  addActionLink(name: string, url: string) {
    this.attributes.push(new DataCatalogueItemAttributeActionLink(name, url));
    return this;
  }

  addRunQueryAction<TQuery extends Omit<DataQuery, 'refId'>>(
    name: string,
    query: TQuery,
    context: DataCatalogueContext
  ) {
    const { url, handler } = dataCatalogueQueryRunnerBuilder<TQuery>(query, context);
    if (handler) {
      this.addAction(name, handler);
    } else if (url) {
      this.addActionLink(name, url);
    }
    return this;
  }

  addTag(tag: string) {
    this.attributes.push(new DataCatalogueItemAttributeTag(tag));
    return this;
  }

  addDescription(description: string) {
    this.attributes.push(new DataCatalogueItemAttributeDescription(description));
    return this;
  }

  addLink(url: string, title?: string) {
    this.attributes.push(new DataCatalogueItemAttributeLink(url, title));
    return this;
  }

  addImage(url: string) {
    this.attributes.push(new DataCatalogueItemAttributeImage(url));
    return this;
  }

  loadAttributes(loader: (itemBuilder: DataCatalogueBuilder) => Promise<void>) {
    this.createAttributes = async () => {
      await loader(this);
      delete this.createAttributes;
    };
    return this;
  }

  loadItems(loader: () => Promise<DataCatalogueItem[]>) {
    this.createItems = async () => {
      this.items = await loader();
    };
    return this;
  }

  setItems(items: DataCatalogueItem[]) {
    this.createItems = async () => {
      this.items = items;
    };
    return this;
  }

  fromDataSource<TQuery extends DataQuery, TOptions extends DataSourceJsonData>(
    datasource: DataSourceApi<TQuery, TOptions>,
    context: DataCatalogueContext,
    categories: {
      data?: (item: DataCatalogueBuilder) => void;
      configuration?: (item: DataCatalogueBuilder) => void;
      status?: (item: DataCatalogueBuilder) => void;
      statistics?: (item: DataCatalogueBuilder) => void;
    } = { status: () => {} }
  ) {
    this.name = datasource.name;
    this.addKeyValue('Name', datasource.meta.name);
    datasource.meta.category && this.addKeyValue('Category', datasource.meta.category);
    this.addKeyValue('Author', datasource.meta.info.author.name);
    this.addKeyValue('Alerting', datasource.meta.alerting ? 'supported' : 'not supported');
    this.addKeyValue('Annotations', datasource.meta.annotations ? 'supported' : 'not supported');
    this.addKeyValue('Streaming', datasource.meta.streaming ? 'supported' : 'not supported');
    this.addDescription(datasource.meta.info.description);
    datasource.meta.info.version && this.addKeyValue('Version', datasource.meta.info.version);
    this.addImage(datasource.meta.info.logos.small);

    if (isDataCatalogueContextExploreLinkBuilder(context)) {
      const exploreUrl = context.createExploreUrl([]);
      this.addLink(exploreUrl, 'Open Grafana Explore');
    }

    if (datasource.meta.metrics) {
      this.addTag('metrics');
    }
    if (datasource.meta.logs) {
      this.addTag('logs');
    }
    if (datasource.meta.tracing) {
      this.addTag('traces');
    }

    const commonCategories = [];
    if (categories.data) {
      const dataCategory = new DataCatalogueBuilder('Data').addIcon('database', 'Available data sets');
      categories.data(dataCategory);
      commonCategories.push(dataCategory);
    }
    if (categories.configuration) {
      const configurationCategory = new DataCatalogueBuilder('Configuration').addIcon('cog', 'Current configuration');
      categories.configuration(configurationCategory);
      commonCategories.push(configurationCategory);
    }
    if (categories.status) {
      const statusCategory = new DataCatalogueBuilder('Runtime status')
        .addIcon('heart', 'Current status & health')
        .loadAttributes(async (item) => {
          let status;
          try {
            status = !!(await datasource.testDatasource());
          } catch (e) {
            status = false;
          }
          item.addKeyValue('Test check', status ? 'ok' : 'failed');
        });
      categories.status(statusCategory);
      commonCategories.push(statusCategory);
    }
    if (categories.statistics) {
      const statisticsCategory = new DataCatalogueBuilder('Statistics').addIcon(
        'chart-line',
        'Data statistics and summaries'
      );
      categories.statistics(statisticsCategory);
      commonCategories.push(statisticsCategory);
    }

    if (commonCategories.length) {
      this.setItems(commonCategories);
    }

    return this;
  }
}

export const dataCatalogueQueryRunnerBuilder = <TQuery extends Omit<DataQuery, 'refId'>>(
  query: TQuery,
  context: DataCatalogueContext
) => {
  if (isDataCatalogueContextWithQuery<TQuery & { refId: string }>(context)) {
    return {
      handler: () => {
        context.changeQuery({ ...query, refId: context.queryRefId });
        context.runQuery();
        context.closeDataCatalogue();
      },
    };
  } else if (isDataCatalogueContextExploreLinkBuilder(context)) {
    return {
      url: context.createExploreUrl([{ ...query, refId: 'A' }]),
    };
  } else {
    return {};
  }
};

export interface DataCatalogueContext {
  closeDataCatalogue: () => void;
  app?: CoreApp;
}

export interface DataCatalogueContextWithQuery<TQuery extends DataQuery> extends DataCatalogueContext {
  queryRefId: string;
  changeQuery: (query: TQuery) => void;
  runQuery: () => void;
}

export const isDataCatalogueContextWithQuery = <TQuery extends DataQuery>(
  context: DataCatalogueContext
): context is DataCatalogueContextWithQuery<TQuery> => {
  const contextWithQuery = context as DataCatalogueContextWithQuery<TQuery>;
  return !!contextWithQuery.queryRefId && !!contextWithQuery.changeQuery && !!contextWithQuery.runQuery;
};

export interface DataCatalogueContextWithExploreLinkBuilder extends DataCatalogueContext {
  createExploreUrl: (queries: DataQuery[]) => string;
}

export const isDataCatalogueContextExploreLinkBuilder = (
  context: DataCatalogueContext
): context is DataCatalogueContextWithExploreLinkBuilder => {
  return (context as DataCatalogueContextWithExploreLinkBuilder).createExploreUrl !== undefined;
};
