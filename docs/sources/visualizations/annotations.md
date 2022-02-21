+++
title = "Reference: Annotations"
description = "Annotations visualization documentation"
keywords = ["grafana", "Annotations", "panel", "documentation"]
aliases = ["/docs/grafana/latest/features/panels/anotations/", "/docs/grafana/latest/panels/visualizations/annotations/"]
weight = 105
+++

# Reference: Annotations visualization

The Annotations visualization displays a list of available annotations you can use to view annotated data. For instructions on how to select the Annotations visualization, see [Add visualization to a panel]({{< relref "./add-visualization.md" >}}) topic.

You can refine your visualization using the following options.

## Display

The display options control additional meta-data included in the annotations panel display.

- **Show user -** Show or hide which user has created the annotation.
- **Show time -** Show or hide the time the annotation creation time.
- **Show Tags -** Show or hide the tags associated with an annotation. _NB_: You can use the tags to live-filter the annotation list on the panel itself.
- **Debug info -** Show or hide the debug information.

## Navigate

The navigate options specify time ranges.

- **Time before -** Set the time range before the annotation. Use duration string values like "1h" = 1 hour, "10m" = 10 minutes, etc. Default is 10m.
- **Time after -** Set the time range after the annotation. Default is 10m.
- **To Panel -** Enable this option if you want to go directly to a full-screen view of the panel with the corresponding annotation. Otherwise, you will see the annotation in the context of the complete dashboard. 

## Search

The search options ??.

- **Only this dashboard -** Limits the list to the annotations on the current dashboard. Otherwise, returns a list annotations from all dashboards in the current organization.
- **Time after -** Set the time range after the annotation. Default is 10m.
- **Tags -** Filters the annotations by tags. Add multiple tags to refine the list. Optionally, leave the tag list empty and filter on the fly by selecting tags that are listed as part of the results on the panel itself.
- **Max Items -** Limit the number of results returned. Default is 10 items.
