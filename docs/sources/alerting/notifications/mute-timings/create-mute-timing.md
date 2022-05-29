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
title: Create mute timings
weight: 450
---

# Create a mute timing

A mute timing is a recurring interval of time when no new notifications are generated or sent. After you create a mute timings, add it to a notification policy. For more information, see [mute time interval]({{< relref "./time-interval.md" >}}).

To create a mute timing

1. In the Grafana menu, click the **Alerting** (bell) icon to open the Alerting page listing existing alerts.
1. Click **Notification policies**.
1. From the **Alertmanager** dropdown, select an external Alertmanager. By default, the Grafana Alertmanager is selected.
1. At the bottom of the page there will be a section titled **Mute timings**. Click the **Add mute timing** button.
1. You will be redirected to a form to create a [time interval](#time-intervals) to match against for your mute timing.
1. Click **Submit** to create the mute timing.

## Add mute timing to a notification policy

To add a mute timing to a notification policy

1. Identify the notification policy you would like to add the mute timing to and click the **Edit** button for that policy.
1. From the Mute Timings dropdown select the mute timings you would like to add to the route.
1. Click the **Save policy** button to save.
