+++
title = "About Grafana alerting"
description = "Learn about the basic concepts of Grafana alerting"
keywords = ["grafana", "alerting", "concepts", "basics"]
weight = 1
+++

# About Grafana alerting

Grafana Alerting consists of several individual concepts that are at the core of a flexible and powerful alerting engine.

In this document we will explain how to create [Alert rules](), their relationship with [alert instances]() and the various alert rule [states and transitions](), [notification policies]() and [contact points]().

These three individual concepts are the minimum necessities to successfully create alerts and receive notifications.

We will also touch on various other concepts such as [Silences]() and [Mute timings]() to more granularly manage alert notifications, [role based access control]() to limit access and manage permissions and additional advanced topics such as [external alertmanagers]() and [high availability]().

## Overview

```
                                                                    ╔═══════════════╗
                                                                    ║ Contact Point ║
                                                                    ╚═══════════════╝
                                                                         ┌───────┐
                                                                   ┌────▶│ Slack │
                                      ┌───────────────────────┐    │     └───────┘
┌────────────┐    ┌────────────┐      │                       │    │     ┌───────┐
│ Alert rule │───▶│   Labels   │─────▶│  Notification policy  │────┼────▶│ Email │
└────────────┘    └────────────┘      │                       │    │     └───────┘
                 severity=warning     └───────────────────────┘    │     ┌───────────┐
                                                                   └────▶│ Pagerduty │
                                                                         └───────────┘
```

As shown in the diagram above, Grafana alerting uses [Labels]() to match an alert rule and its instances to a specific notification policy. This concept of labels and label matchers is important and is also used in [silences]().

Each notification policy specifies a set of [label matchers]() to indicate what alerts they are responsible for.

A notification policy has a [contact point]() assigned to it that consists of one or more [receivers]().
