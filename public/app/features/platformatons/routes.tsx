import { SafeDynamicImport } from 'app/core/components/DynamicImports/SafeDynamicImport';
import { config } from 'app/core/config';
import { RouteDescriptor } from 'app/core/navigation/types';

export function getRoutes(): RouteDescriptor[] {
  if (config.featureToggles.platformatons) {
    return [
      {
        path: `/services`,
        exact: false,
        component: SafeDynamicImport(
          () => import(/* webpackChunkName: "ServicesPage" */ 'app/features/platformatons/components/ServicesPage')
        ),
      },
    ];
  }

  return [];
}
