export interface DataCatalogueItemAction {
  name: string;
  handler: () => void;
  icon?: string;
}

export interface DataCatalogueItem {
  name: string;
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
export interface DataCatalogueProvider {
  getRootDataCatalogueFolder(): Promise<DataCatalogueFolder>;
}

/**
 * @internal
 */
export const hasDataCatalogueSupport = (datasource: unknown): datasource is DataCatalogueProvider => {
  return (datasource as DataCatalogueProvider).getRootDataCatalogueFolder !== undefined;
};

export const isDataCatalogueFolder = (item: DataCatalogueItem): item is DataCatalogueFolder => {
  return (item as DataCatalogueFolder).items !== undefined;
};

export class DataCatalogueItemBuilder implements DataCatalogueItem {
  name: string;
  attrs?: Record<string, string>;
  actions?: DataCatalogueItemAction[];

  constructor(name: string) {
    this.name = name;
  }

  addAttr(name: string, value: string) {
    if (!this.attrs) {
      this.attrs = {};
    }
    this.attrs[name] = value;
    return this;
  }

  addActions(name: string, handler: () => void) {
    if (!this.actions) {
      this.actions = [];
    }
    this.actions.push({ name, handler });
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
