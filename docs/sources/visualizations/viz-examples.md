+++
title = "Visualization examples"
weight = 79
aliases = ["/docs/grafana/latest/panels/visualizations/"]
+++

# Visualization examples

Here are some examples of data visualizations in Grafana. You can also explore [play.grafana.org](https://play.grafana.org) which has a large set of demo dashboards showcasing different visualizations. See [Visualization reference] for guidance on the type of visualization that best represents your data.

## Time series

Examples of time series visualization, is the default and primary way to visualize in Grafana.

{{< figure src="/static/img/docs/time-series-panel/time_series_small_example.png" max-width="700px" caption="Time series" >}}

## Bar chart

An example of the [bar chart]({{< relref "./bar-chart.md" >}}) visualization.

{{< figure src="/static/img/docs/bar-chart-panel/barchart_small_example.png" max-width="500px" caption="Bar chart" >}}

### Big numbers & stats

An example of the [Stat](stat-panel/) visualization.

{{< figure src="/static/img/docs/v66/stat_panel_dark3.png" max-width="750px" caption="Stat panel" >}}

### Gauge

In order to present a value as it relates to a min and max value you have two options. 

- First a standard [Radial Gauge]({{< relref "./gauge-panel.md" >}}) as shown below.

    {{< figure src="/static/img/docs/v66/gauge_panel_cover.png" max-width="400px" >}}

- Second, Grafana has a horizontal or vertical [Bar gauge]({{< relref "./bar-gauge-panel.md" >}}) with three different distinct display modes.

    {{< figure src="/static/img/docs/v66/bar_gauge_lcd.png" max-width="400px" >}}

### Table

An example of the [Table]({{< relref "./table/_index.md" >}}) visualization.

{{< figure src="/static/img/docs/tables/table_visualization.png" max-width="500px" lightbox="true" caption="Table visualization" >}}

### Pie chart

Examples of [Pie chart]({{< relref "./pie-chart-panel.md" >}}) visualization.

{{< figure src="/static/img/docs/pie-chart-panel/pie-chart-example.png" max-width="500px" lightbox="true" caption="Pie chart visualization" >}}

### Heatmaps

An example of the [heatmap]({{< relref "./heatmap.md" >}})  visualization.

{{< figure src="/static/img/docs/v43/heatmap_panel_cover.jpg" max-width="700px" lightbox="true" caption="Heatmap" >}}

### State timeline

An example of the [state timeline]({{< relref "./state-timeline.md" >}}) panel visualization.

{{< figure src="/static/img/docs/v8/state_timeline_strings.png" max-width="500px" caption="state timeline with string states" >}}
