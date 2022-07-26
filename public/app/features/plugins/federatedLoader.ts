// Dynamically load plugins using Module Federation

// @ts-ignore
declare let __webpack_init_sharing__;
// @ts-ignore
declare let __webpack_share_scopes__;

type FederatedModule = {
  path: string;
  baseURL: string;
  scope: string;
};

// plugins can contain nested plugins which live on a subpath to the root plugin.
// This function naively attempts to resolve the module by comparing against baseUrl.
function getModuleName(path: string, baseURL: string) {
  const strippedPath = path.replace('/module', '');
  const strippedBaseURL = baseURL.replace('public/', '');

  if (strippedPath === strippedBaseURL) {
    return './plugin';
  }

  const moduleName = `.${strippedPath.replace(strippedBaseURL, '')}/plugin`;
  return moduleName;
}

export async function importFederatedModule({ path, baseURL, scope }: FederatedModule) {
  // @ts-ignore
  if (!window[scope]) {
    await new Promise<void>((resolve, reject) => {
      const element = document.createElement('script');

      element.src = `/public/${path}.js`;
      element.type = 'text/javascript';
      element.async = true;

      element.onload = () => {
        console.log(`Federated Module Loaded: ${path}`);
        resolve();
      };

      element.onerror = (err) => {
        console.error(`Federated Module Error: ${path}`);
        reject(err);
      };

      document.body.appendChild(element);
    });
  }

  await __webpack_init_sharing__('default');
  // @ts-ignore
  const container = window[scope];
  await container.init(__webpack_share_scopes__.default);
  const module = getModuleName(path, baseURL);
  const factory = await container.get(module);
  const Module = factory();

  return Module;
}
