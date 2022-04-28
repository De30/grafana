+++
title = "About alert rules"
description = "Learn about the Grafana alert rules"
keywords = ["grafana", "alerting", "rules"]
weight = 2
aliases = [
  "/docs/grafana/latest/alerting/unified-alerting/alerting-rules/state-and-health/",
  "/docs/grafana/latest/alerting/unified-alerting/fundamentals/state-and-health/"
]
+++

# About alert rules

An alerting rule is a set of evaluation criteria that determines whether an alert instance will fire. The rule consists of one or more queries and expressions, a condition, the frequency of evaluation, and optionally, the duration over which the condition is met.

While queries and expressions select the data set to evaluate, a condition sets the threshold that an alert must meet or exceed to create an alert.

An interval specifies how frequently an alerting rule is evaluated. Duration, when configured, indicates how long a condition must be met. The alert rules can also define alerting behavior in the absence of data.

## Alert rule types

Grafana supports several alert rule types, the following sections will explain their merits and demerits and help you choose the right alert type for your use-case.

### Grafana managed rules

Grafana managed rules are the most flexible alert rule type. They allow you to create alerts that can act on any data from any of your existing datasources.

In additional to supporting any datasource you can also add additional [expressions]() to transform your data and express alert conditions.

### Mimir, Loki and Cortex

To create Mimir, Loki or Cortex alerts you must have a compatible Prometheus datasource. You can check if your datasource is compatible by testing the datasource and checking the details if the ruler API is supported.

![@TODO: SCREENSHOT HERE]()

### Recording rules

Recording rules are only available for compatible Prometheus datasources like Mimir, Loki and Cortex.

A recording rule allows you to save an expression's result to a new set of time series. This is useful if you want to run alerts on aggregated data or if you have dashboards that query the same expression repeatedly.

Read more about [recording rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/) in Prometheus.

## Alert instances

Grafana alerting supports multi-dimensional alerts. Each alert rule can create multiple alert instances. This is exceptionally powerful if you are observing multiple series in a single expression.

Consider the following PromQL expression:

```
sum by(cpu) (
  rate(node_cpu_seconds_total{mode!="idle"}[1m])
)
```

A rule using this expression will create as many alert instances as the amount of CPUs we are observing after the first evaluation, allowing a single rule to report the status of each individual CPU.

![@TODO: SCREENSHOT HERE]()

## Alert states and health

The state and health of alerting rules help you understand several key status indicators about your alerts. There are three key components: alerting rule state, alert instance state, and alerting rule health. Although related, each component conveys subtly different information.

### Alert rule state

An alert rule can be in either of the following states:

| **State** | **Description**                                                                            |
| --------- | ------------------------------------------------------------------------------------------ |
| Normal    | None of the time series returned by the evaluation engine is in a Pending or Firing state. |
| Pending   | At least one time series returned by the evaluation engine is Pending.                     |
| Firing    | At least one time series returned by the evaluation engine is Firing.                      |

> **Note:** Alerts will transition first to `pending` and then `firing`, thus it will take at least two evaluation cycles before an alert is fired.

### Alert instance state

An alert instance can be in either of the following states:

| **State** | **Description**                                                                               |
| --------- | --------------------------------------------------------------------------------------------- |
| Normal    | The state of an alert that is neither firing nor pending, everything is working correctly.    |
| Pending   | The state of an alert that has been active for less than the configured threshold duration.   |
| Alerting  | The state of an alert that has been active for longer than the configured threshold duration. |
| NoData    | No data has been received for the configured time window.                                     |
| Error     | The error that occurred when attempting to evaluate an alerting rule.                         |

### Alert rule health

| **State** | **Description**                                                                    |
| --------- | ---------------------------------------------------------------------------------- |
| Ok        | No error when evaluating an alerting rule.                                         |
| Error     | An error occurred when evaluating an alerting rule.                                |
| NoData    | The absence of data in at least one time series returned during a rule evaluation. |

### Special alerts for NoData and Error

When evaluation of an alerting rule produces state NoData or Error, Grafana alerting will generate alert instances that have the following additional labels:

| **Label**      | **Description**                                                        |
| -------------- | ---------------------------------------------------------------------- |
| alertname      | Either `DatasourceNoData` or `DatasourceError` depending on the state. |
| datasource_uid | The UID of the data source that caused the state.                      |

You can handle these alerts the same way as regular alerts by adding a silence, route to a contact point, and so on.

@TODO: VALIDATE THIS STATE TRANSITION DIAGRAM

```
┌────────┐    ┌─────────┐    ┌──────────┐
│ Normal │───▶│ Pending │───▶│ Alerting │
└────────┘    └─────────┘    └──────────┘
     ▲                             │
     │                             │
     └─────────────────────────────┘
```

## Annotations and labels

Annotations and labels might seem at first glance to be similar concepts; both allow you to add additional metadata to your alert rule definition but serve difference purposes.

**Annotations** are used to add a summary, description or other metadata to include in custom [message templates]().

**Labels** on the other hand are used to **determine which notification policy** will handle the alert instances the alert rule generates.

These labels can also be used by other third-party services when you choose to configure a webhook contact point.

## Organising alerts

Alerts can be organised using Folders for Grafana managed rules, namespaces for Mimir or Loki rules and group names.

### Namespaces

When creating Grafana managed rules, the folder can be used to perform access control and grant or deny access to all rules within a specific folder.

### Groups

All rules within a group are evaluated at the same **interval**.

Alert rules and recording rules within a group will always be evaluated **sequentially**, meaning no rules will be evaluated at the same time and in order of appearance.

> If you want rules to be evaluated concurrenty and with difference intervals, consider storing them in different groups.
