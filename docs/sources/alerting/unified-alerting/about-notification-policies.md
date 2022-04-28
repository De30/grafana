# About notification policies

Notification policies are the glue between the alert rule instances and contact points. Alert rule instances are matched to a notification policy via [labels]() and label matchers.

Even though multiple notification policies can be created, the entire decision tree that determines what policy handles a particular alert instance is in fact a tree structure.

SOMETHING HERE ABOUT THE DECISION TREE, MAYBE A DIAGRAM?

## Root policy

The root policy is always available by default and will **match all alert instances**. It cannot have any mute timings assigned.

## Label matchers

## Grouping

## Timing options

## Mute timings
