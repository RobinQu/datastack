# Working with cluster

It's important wiht use `StackCluster` if you are dealing with clustering. It comes with some goodness you need:

1. subscription events along with other messages will be propagated across other clusters, which may be on different machines.
2. workers will be taken care of

## Sync Message

When a sync message is initiated:

1. app.sync()
2. cluster master got the sync message
  1. cluster.broadcast() to tell other workers in the same cluster
  2. cluster.hub.publish() to tell other clusters
  
  
When other cluster master received a sync messaege:

1. cluster.boardcast() to tell all workers with the cluster