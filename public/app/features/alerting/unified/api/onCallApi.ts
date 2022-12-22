import { alertingApi } from './alertingApi';
export interface OnCallIntegration {
  integration_url: string;
}
export type OnCallIntegrationsResponse = OnCallIntegration[];
export type OnCallIntegrationsUrls = string[];

export const onCallApi = alertingApi.injectEndpoints({
  endpoints: (build) => ({
    getOnCallIntegrations: build.query<OnCallIntegrationsUrls, void>({
      query: () => ({
        headers: {},
        url: '/api/plugin-proxy/grafana-oncall-app/api/internal/v1/alert_receive_channels/',
      }),
      providesTags: ['AlertmanagerChoice'],
      transformResponse: (response: OnCallIntegrationsResponse) => response.map((result) => result.integration_url),
    }),
  }),
});
export const { useGetOnCallIntegrationsQuery } = onCallApi;
