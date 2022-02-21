+++
title = "Visualization reference"
weight = 76
aliases = ["/docs/grafana/latest/panels/visualizations/"]
+++

# Visualization reference

Broadly speaking, you can categorize the various visualizations supported by Grafana into the following categories:

- Graphs & charts
- Stats & numbers
- Misc
- Widgets

You can always add more visualization types by installing the [panel plugins](https://grafana.com/grafana/plugins/?type=panel).

## Graphs and charts

The following table lists graph and chart visualizations in Grafana and provides guidance on when to use them.

| Visualization type | Description |
| --------------------- | ------- |
| Time series               | The [Time series]({{< relref "./time-series/_index.md" >}}) visualization is the default and main Graph visualization. It replaced the Graph visalization. |
| State timeline              |Select the [State timeline]({{< relref "./state-timeline.md" >}}) visualization to display state changes over time.  |
| Status history                 | Select the [Status history]({{< relref "./status-history.md" >}}) visualization to display periodic state over time.  | 
| Bar chart                  | Select the [Bar chart]({{< relref "./bar-chart.md" >}}) visualization to display any categorical data.  |
| Histogram              |Select the [Histogram]({{< relref "./histogram.md" >}}) visualization to calculate and show the value distribution in a bar chart.  |
| Heatmap                   | Select the [Heatmap]({{< relref "./heatmap.md" >}}) visualization to display data in two dimensions. This visualization is typically used to show the the magnitude of an event.   |
| Pie chart                 |  Select the [Pie chart]({{< relref "./pie-chart-panel.md" >}}) visualization to display data used where proportionality is important.   |        red |
| Candlestick                  |  Select the [Candlestick]({{< relref "./candlestick.md" >}}) visualization to display financial data where the focus is on price or data movement.  |
  
## Stats and numbers

The following table lists stats and numbers visualizations in Grafana and provides guidance on when to use them.

| Visualization type | Description |
| --------------------- | ------- |
| Stat               | Select the [Stat]({{< relref "./stat-panel.md" >}}) visualization to display big stats and optionally sparkline data. |
| Gauge              |Select the [Gauge]({{< relref "./gauge-panel.md" >}}) visualization to display a normal radial gauge.
| Bar gauge          |Select the [Bar gauge]({{< relref "./bar-gauge-panel.md" >}}) visualization to display a horizontal or vertical bar gauge.  |

## Miscellaneous

The following table lists miscellaneous visualizations in Grafana and provides guidance on when to use them.

| Visualization type | Description |
| --------------------- | ------- |
| Table               | Select the [Table]({{< relref "./table/_index.md" >}}) visualization to display data in a tabular form. It is the main and only table visualization. |
| Logs              |Select the [Logs]({{< relref "./logs-panel.md" >}}) visualization to display log data. It is the main visualization for logs.
| Node Graph          |Select the [Node Graph]({{< relref "./node-graph.md" >}}) visualization to display directed graphs or networks.  |

## Widgets

The following table lists supported widget visualizations in Grafana and provides guidance on when to use them.

| Visualization type | Description |
| --------------------- | ------- |
| Dashboard list               | Select the [Dashboard list]({{< relref "./dashboard-list-panel.md" >}}) visualization to list Grafana dashboards. |
| Alert list              |Select the [Logs]({{< relref "./logs-panel.md" >}}) visualization to display log data. It is the main visualization for logs. |
| Text panel          |Select the [Text panel]({{< relref "./text-panel.md" >}}) visualization to display data in markdown and html.  |
| News panel          |Select the [News panel]({{< relref "./news-panel.md" >}}) visualization to display RSS feeds.  |

See also, [Visualization examples]({{< relref "./viz-examples.md" >}}).
