---
aliases:
  - /docs/grafana/latest/alerting/notifications/mute-timings/
  - /docs/grafana/latest/alerting/unified-alerting/notifications/mute-timings/
description: Mute timings
keywords:
  - grafana
  - alerting
  - guide
  - mute
  - mute timings
  - mute time interval
title: Mute timings
weight: 450
---

# Mute timings

A mute timing is a recurring interval of time when no new notifications for a policy are generated or sent. Use them to prevent alerts from firing a specific and reoccurring period, for example, a regular maintenance period.

Similar to silences, mute timings do not prevent alert rules from being evaluated, nor do they stop alert instances from being shown in the user interface. They only prevent notifications from being created.

You can configure Grafana managed mute timings as well as mute timings for an [external Alertmanager data source]({{< relref "../../../datasources/alertmanager.md" >}}). For more information, see [Alertmanager documentation]({{< relref "../../fundamentals/alertmanager.md" >}}).

## Mute timings vs silences

The following table highlights the key differences between mute timings and silences.

| Mute timing                                        | Silence                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Uses time interval definitions that can reoccur    | Has a fixed start and end time                                               |
| Is created and then added to notification policies | Uses labels to match against an alert to determine whether to silence or not |

See also:

- [Create a mute timing]({{< relref "./create-mute-timing.md" >}})
- [Mute time interval]({{< relref "./time-interval.md" >}})
