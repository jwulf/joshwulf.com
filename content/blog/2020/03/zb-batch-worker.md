+++
author = "Josh Wulf"
categories = ["javascript", "programming", "zeebe", "typescript"]
date = "2020-03-03"
title = "The Zeebe Node Batch Worker"
description = "A new Zeebe Node worker allows you to batch access to external resources, for great justice."
linktitle = ""
images = ["/img/2020/03/batch-worker-feature.jpg"]
type = "post"
[twitter]
  card = "A new Zeebe Node worker allows you to batch access to external resources, for great justice."
  site = "@sitapati"
  title = "The Zeebe Node Batch Worker"
  description = "A new Zeebe Node worker allows you to batch access to external resources, for great justice."
  image = "https://www.joshwulf.com/img/2020/03/batch-worker-feature.jpg"
+++

_[Zeebe](https://zeebe.io) is a workflow engine for orchestrating microservices, using BPMN models to define complex workflows that can be monitored operationally using a graphical representation of the process state._

Thanks to [a feature request from Jimmy Beaudoin](https://github.com/creditsenseau/zeebe-client-node-js/issues/134), the 0.23.0-alpha.1 release of the [Zeebe Node client](https://npmjs.org/zeebe-node) introduces a new worker - the `ZBBatchWorker`.

## Motivation 

Sometimes you have external resources that your microservices access - maybe a database or a rate-limited or pay-per-call API.

In these cases, you want to batch up calls that make logical sense and can happen at the same time. These calls are _not_ correlated in your BPMN model. The workflows know nothing about each other, but they do require access to the same resources.

In this case, the worker that accesses the external resource is the point where correlation can take place. It knows when these calls are taking place, and can buffer and batch these calls, dispatch them to the external system, then update each of the processes.

The `ZBBatchWorker` class encapsulates this functionality. 

It buffers jobs in the worker until either a minimum batch size is reached, or the maximum batch timeout is reached, then executes its job handler function on an _array_ of jobs. The `ZBWorker`, in contrast, executes its job handler immediately on a single job.

## Creating a ZBBatchWorker

Here is how you create a `ZBBatchWorker`:

{{< gist jwulf 36f027a4db515b7f21c5d64a8c5f855f >}}

Note that the `timeout` value must be greater than the `jobBatchMaxTime`. The `timeout` is the amount of time that the worker tells the broker it needs to complete the task.

In this example, for each job that the worker pulls from the broker, it tells the broker that it needs 80 seconds to complete it, max. After 80 seconds, the broker will make that job available to another `activateJobs` call from a worker. So the batch worker should make sure it gets the job done before then.

If you set the `timeout` less than the `jobBatchMaxTime`, the worker will emit a warning message to the logs. I considered having it throw, but what do I know - someone may come up with a crazy, innovative way to exploit this behaviour, and I'm all about that.

You want to ensure you allow enough time to deal with any retry logic (related to the external API) that you put in your handler.

## The ZBBatchWorker handler

The `ZBWorker` handler takes a job - a read-only JavaScript object with the job data, a `complete` object - with methods to signal the completion state of the job, and an instance of the `worker` - to allow you to log from the handler using the worker's configured log.

The `ZBBatchWorker` handler, on the other hand, takes _an array_ of jobs, and an instance of the worker.

To allow you to signal the completion state of each of the individual jobs in the batch, the jobs in the array have the complete methods attached to them. 

So, here is a handler that demonstrates doing nothing more than completing each job with `success`:

{{< gist jwulf 5141d26d600cbec3a90819d2dc81a0e9 >}}

## Unhandled Exceptions

You need to carefully manage exceptions in your handler.

The `ZBWorker` will fail a job if an unhandled exception takes place in the job handler, and it has an option to fail the entire workflow if you want that behaviour.

With the `ZBBatchWorker`, we don't know what state the job batch is in, or how your handler will act after throwing an unhandled exception. So, no action is taken by the library.

It also cannot catch errors deep in the handler code, for example inside `map` or `forEach` predicate functions, so you gotta manage that.

## Internal Implementation Details

There is no API in the broker for batching jobs. You can request a maximum number of jobs at a time, but there is no guarantee about a minimum. You cannot send a request that will be fulfilled when there are enough available jobs. 

So, all the management of the batching takes place on the client.

To implement this, I used a pattern that I described in the "[Valid Use of Variables](https://joshwulf.com/blog/2020/02/shun-the-mutant#valid-use-of-variables)" section of the article "[Shun the Mutant - The case for `const`](https://joshwulf.com/blog/2020/02/shun-the-mutant)", wrapping the batching functionality into a small state machine with an API:

Here is a BPMN diagram of the state machine:

{{< cawemo 20e50f02-50cc-4005-96d6-bf50380f4097 >}}

_BPMN is great for representing the operation of state machines - the directed evolution of state over time. The embedded diagram was created using the [Camunda Modeler](https://bpmn.io/modeler/), and is hosted on [Cawemo](https://cawemo.com/)._

And the code that implements it:

{{< gist jwulf b789f4da4df827e7007c5e4e7e1b938f >}}

It has two variables in it, but these are "true variables". It is a _state machine_, so it has to model _actual_ variables in the system. One represents the batched jobs. The other is the batch timer. 

The batch timer is started when the first job is pushed into the batch array. From that point, two things will trigger the execution of the job handler on the array of batched jobs: either a job will be pushed in via the `batch` API method that takes the count of jobs to the maximum batch size, or the timer will trigger the execution.

## Race conditions?

That's not a lot of code, but a lot of thought has gone into it.

I am still slightly concerned about race conditions in this code at high volumes. I gotta admit - my knowledge of how the Node.js event loop and timers work is not complete. Even after reading through [The Node.js Event Loop, Timers, and `process.nextTick()`](https://nodejs.org/uk/docs/guides/event-loop-timers-and-nexttick/), I'm still not 100% clear if this code is susceptible to interrupts that cause its internal state to become inconsistent.

The issue is that two different triggers can cause the execution (timer interrupt, or call to `batch`), and consumers can call `batch` while the execution is taking place.

I _think_ that I have guaranteed synchronous execution through `execute` up to the handler invocation before another call to `batch` is processed - but I'm not sure.

I'm _pretty sure_ that if the handler does any I/O, then at _that_ point the execution will yield to the event loop - and all my state machine's mutating code happens before then.

I pass in a _copy_ of the batched jobs and scrub the state's batched jobs before calling the handler, so that _should_ take care of it.

Anyway, you'll be glad to know that I'm thinking like this about your run-time state and data while you use the library, _and_ I will get completely flat on this.

Managing state and time are the biggest sources of complexity in an application, so I've encapsulated all of that with respect to this concern inside a state machine.

The complexity of managing this state is not leaked out into the application, and although the race condition that I'm concerned about is not easy to test for, it _is_ easy to reason about in such a small bounded context. So all I need to do to be sure that this works as advertised is to increase my understanding of the event loop.

**About me**: _I’m a Developer Advocate at [Camunda](https://camunda.com), working primarily on the [Zeebe Workflow engine for Microservices Orchestration](https://zeebe.io), and the maintainer of the [Zeebe Node.js client](https://www.npmjs.com/package/zeebe-node). In my spare time, I build [Magikcraft](https://github.com/Magikcraft), a platform for programming with JavaScript in Minecraft._
