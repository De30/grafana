export const DBConfig = {
  name: 'Grafana',
  version: 1,
  objectStoresMeta: [
    {
      store: 'social',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: false } },
        { name: 'blob', keypath: 'blob', options: { unique: false } },
        { name: 'created_at', keypath: 'created_at', options: { unique: false } },
      ],
    },
  ],
};
