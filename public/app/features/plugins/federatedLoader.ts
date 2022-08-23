// Dynamically load plugins using Module Federation
type Scope = unknown;
type Factory = () => any;

type Container = {
  init(shareScope: Scope): void;
  get(module: string): Factory;
};

declare const __webpack_init_sharing__: (shareScope: string) => Promise<void>;
declare const __webpack_share_scopes__: { default: Scope };

type FederatedModule = {
  path: string;
  scope: string;
};

const moduleMap: Record<string, boolean> = {};
let initialSharingScopeCreated = false;

export async function getFederatedModule({ path, scope }: FederatedModule) {
  await loadModule(path);
  return await getExposedModule(scope);
}

function loadModule(path: string) {
  return new Promise<void>((resolve, reject) => {
    if (moduleMap[path]) {
      resolve();
      return;
    }

    try {
      const script = document.createElement('script');

      script.src = `/public/${path}.js`;
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        console.log(`Federated Module Loaded: ${path}`);
        moduleMap[path] = true;
        resolve();
      };

      script.onerror = (err) => {
        console.error(`Federated Module Error: ${path}`);
        reject(err);
      };

      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });
}

async function getExposedModule(moduleId: string) {
  if (!initialSharingScopeCreated) {
    initialSharingScopeCreated = true;
    await __webpack_init_sharing__('default');
  }
  const container: Container = (window as any)[moduleId];
  await container.init(__webpack_share_scopes__.default);
  const module = './plugin';
  const factory = await container.get(module);
  const Module = factory();

  return Module;
}
