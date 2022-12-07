export const EXPLORE_GRAPH_STYLES = ['lines', 'bars', 'points', 'stacked_lines', 'stacked_bars'] as const;

export type ExploreGraphStyle = typeof EXPLORE_GRAPH_STYLES[number];
