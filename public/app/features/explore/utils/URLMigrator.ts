import { ExploreURLState } from '@grafana/data';
import { ExploreQueryParams } from 'app/types';

/*
 * The idea is that the incoming URL gets translated to an internal data structure reperesenting Explore state
 * derived from the URL.
 * This data struture is private and to be used only within Explore itself.
 */

/**
 * The previous (pre 8.4.0) query parameters structure for explore URLs.
 */
interface ExploreQueryParamsV0 {
  left: string;
  right: string;
}

const isExploreQueryParamsV0 = (params: ExploreQueryParams | ExploreQueryParamsV0): params is ExploreQueryParamsV0 => {
  return !!(params as ExploreQueryParamsV0).left;
};

export const parseExploreURL = (params: ExploreQueryParams | ExploreQueryParamsV0): ExploreURLState => {
  // TODO: if left and right are arrays, the URL used to navigate to explore is a v0 URL
  if (isExploreQueryParamsV0(params)) {
    // TODO: parse left and right according to the provious schema
  }

  // TODO: MIGRATE!

  // TODO: replace the current browser history item with an up to date version of the URL
  return JSON.parse(params.state || '{}');
};
