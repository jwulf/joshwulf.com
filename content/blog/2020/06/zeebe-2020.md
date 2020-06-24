+++
author = "Josh Wulf"
categories = ["javascript", "programming", "zeebe", "typescript"]
date = "2020-06-23"
title = "Writing a Zeebe Client in 2020"
description = "Some architectural lessons from 18 months of maintaining the Zeebe Node.js client."
linktitle = ""
images = ["/img/2019/01/zeebe.png"]
type = "post"
[twitter]
  card = "Some architectural lessons from 18 months of maintaining the Zeebe Node.js client."
  site = "@sitapati"
  title = "Writing a Zeebe Client in 2020"
  description = "Some architectural lessons from 18 months of maintaining the Zeebe Node.js client."
  image = "https://www.joshwulf.com/img/2019/01/zeebe.png"
+++

The last time we wrote about creating a Zeebe Client was in November, 2018 in the article "[Generating a Zeebe-Python Client Stub in Less Than An Hour: A gRPC + Zeebe Tutorial](https://zeebe.io/blog/2018/11/grpc-generating-a-zeebe-python-client/)".

As of June 18, 2020, we have Zeebe client libraries in [Java](https://github.com/zeebe-io/zeebe/tree/master/clients/java) and [Go](https://github.com/zeebe-io/zeebe/tree/master/clients/go), maintained by the core Zeebe Engineering team, as well as community-supported clients in [C#](https://github.com/zeebe-io/zeebe-client-csharp), [Delphi](https://github.com/syconpmm/DelphiZeeBeClient), [Node.js](https://github.com/CreditSenseAU/zeebe-client-node-js), [Python](https://pypi.org/project/zeebe-grpc/), [Ruby](https://github.com/zeebe-io/zeebe-client-ruby), and [Rust](https://github.com/xmclark/zeebest); as well as [Workit](https://github.com/VilledeMontreal/workit) - a Node.js client that can talk to both Zeebe and Camunda - and a [Zeebe GitHub Action](https://github.com/marketplace/actions/zeebe-action).

If you are interested in creating a new Zeebe client library in your favorite language, the 2018 article is still a great place to get started. 

In this article I want to share some observations from developing the Node.js library over the past 18 months.

## Managing the gRPC Channel

If you are writing a Zeebe client, the first place to start is by getting the gRPC Protocol definition for the Zeebe API. The 0.23.2 broker protocol is [here](https://github.com/zeebe-io/zeebe/blob/0.23.2/gateway-protocol/src/main/proto/gateway.proto).

This file contains the remote procedures that your library will call on the Zeebe Gateway, and definitions of the request and response objects (_messages_ in gRPC terms).

The first thing that your client will do is construct a gRPC channel, using your language's implementation of gRPC. No application programmer wants to deal with that low-level, so that's what your client library will do. 

Then, your client will provide an API to the programmer, onte that exposes the Zeebe API in some form.

With the gRPC channel, you may find yourself tuning various low-level connection parameters, especially when you connect to Camunda Cloud. The connection to a Zeebe broker is direct, whereas the connection to Camunda Cloud passes through an nginx proxy. This changes the connection characteristics.

## Binding the API to a Cluster 

You will probably want to manage the cluster connection details in one place. Users of your library will want to work with a specific broker cluster, and they will not want to provide the connection details with every call - so your library will probably take the connection details and return an API that is bound to that cluster.

## What Abstractions?

These first two - the gRPC channel and the connection details - are fairly straight-forward and obvious.

Beyond that, there are some philosophical design choices to make about your library implementation. That is: how much and what kind of abstraction it will provide over the Zeebe API.

The Zeebe API has methods to deploy a workflow definition to the broker, create (and start) a workflow instance, to publish a message to the broker, to cancel a workflow instance, to update the variables of a workflow instance. It also has methods to activate available jobs, and to complete an activated job, fail an activated job, or raise a BPMN error in an activated job.

Your language client may be no more than a language-level API to the Zeebe gRPC API.

In this case, it is the responsibility of users of your library to construct the request objects to use with the API calls. They also have to manage retries and errors.

## Connection Characteristics 

The gRPC channel may throw errors during connection to the Zeebe broker on Camunda Cloud, as it negotiates the oAuth credentials and the nginx proxy. In that case, you might suppress errors if the library detects that it is connecting to Camunda Cloud, to normalise the behaviour for applications using your library.

## Error handling and Retries

One thing you may want to do is abstract some error handling. For example, if the broker is experiencing high latency internally, it will return a gRPC Error Code 8 to signal Back Pressure. Your library may respond that by doing an automatic back-off retry. Or it may not implement anything, and leave it to the user to handle this in their own code. Or it may be configurable - so that users can opt-in to retries on backpressure, or catch an exception / supply a handler for that case.

The broker may simply be unavailable. Perhaps the developer is working with a dockerised broker, and the broker has not started yet. In this case, does an attempt to deploy a workflow definition throw an error, or does your library transparently retry the operation until the broker starts?

In the case of business errors, you probably want to throw an exception, return an error object, or take an error path supplied to your API. For example, a gRPC Error Code 5 signals that an element was not found. This response will be sent if a program attempts to start an instance of a workflow definition that does not exist on the broker. 

These kinds of considerations dictate the developer ergonomics of your library, and how opinionated it is about application behaviour / how much it requires the developer to code.

Making your library configurable, so that it has both an opinionated behaviour that matches 80% of its anticipated use-cases, but can be switched to an unopinionated mode for the other 20%, makes it more flexible. It also makes it more complicated internally, and increases the number of cases that you have to test.

## Workers

Conceptually, we talk about Zeebe "job workers". These are programs that activate jobs, execute some handler code with the metadata and variable payload of the job, and then return a response to the broker.

In terms of the Zeebe gRPC API, this concern is purely logical. If you provided nothing more than a thin layer over the Zeebe gRPC API, then application developers will need to manage a number of concerns in their own code.

If your library takes connection details and returns a bound API that does nothing more than implements the Zeebe gRPC calls in the language of your client implementation, then application programmers will need to:

-   Compute the current capacity of the worker
-   Construct an `ActivateJobsRequest` object with the number of jobs to activate.
-   Make the `ActivateJobs` call to the broker.
-   Deal with an error response - back-off retry?
-   Handle the response, including demarshalling the payload to a native data structure if needed.
-   Execute a handler on each of the jobs returned.
-   Handle exceptions in the handler.
-   Construct either a `CompleteJobRequest`, a `FailJobRequest`, or a `ThrowErrorRequest` for each job, then call the appropriate API to send it. 
-   Manage the current capacity. 
-   Loop again.

This is the essential behaviour of a Zeebe worker program.

As you can see from this description, it is amenable to abstraction. With just the raw API exposed, users of your library are going to be repeating a lot of structural coding with every worker they write.

You might create just the raw language binding, and then implement an opinionated framework in another package that uses your library, or as an opt-in feature.

That's probably a good separation of concerns.

## Lessons from the Node.js client

With the Node.js library, I took the approach of building an opinionated framework, including an opinionated worker in the client library. Over time, in response to requests from users, I exposed more unmanaged APIs, _and_ added more opinionated functionality.

The library has 18 months of development and 42 releases. It started without a clear picture of how Zeebe works, or how it would be used. It was built initially to get something working for an early POC using Zeebe. As a result, it has some internal Frankenstein complexity.

If I could go back and do it over, knowing what I know now, I would implement it with a clear separation of concerns, and using the principle of least knowledge between the layers, to coalesce concerns and prevent logic from being split across components.

Before I sketch this out, let me say this: if you are building a new client, build the simplest, most direct mapping first. If you take any inspiration from this, take it as a picture of a future state. 

Having said that, here is how I would construct it:

### *Developer Ergonomics*

Let's start with the end in mind:

_How will developers use this library?_

A developer can import the library to their project, and then call a method to get back a connected API to a Zeebe broker. 

They pass in to this method (either explicitly or via environment / config file) the connection details for the cluster, and some configuration options, such as the retry strategy.

What they get back from that call is a connected API that uses the retry strategy they requested.

It also has a method for creating a worker. That method takes a task type and a handler function, and returns a handle to the worker that can be used to close the worker, or to listen for error events.

### *gRPC Connection component*

The gRPC Connection component takes connection details for a cluster, and creates and manages the gRPC channel. 

This component scans the `proto` file and dynamically generates the gRPC methods.

This component establishes a connection to the cluster, exposes the actual gRPC method calls, and emits network and business errors.

It needs to leverage some other objects that manage things like OAuth credential exchange for Camunda Cloud. These are best to be injected via the constructor. This makes the component testable, and maintains a clean separation of concern.

### *OAuth component*

This is a component that handles retrieving the OAuth credentials from Camunda Cloud, caching them on disk, and managing their lifecycle. 

### *Retry Machine component*

This component is a retry machine. It takes a retry strategy in its constructor, and returns a functional machine that can take an API operation as an argument and apply the retry strategy to it.

### *Connection Characteristic Middleware*

This component wraps a gRPC Connection component, and suppresses or propagates its errors based on profiles. This is where you handle Camunda Cloud's initial connection behaving differently from self-hosted Zeebe. Based on the expectation of the connection's characteristics, this Middleware normalises its behaviour so that the application gets the same experience no matter what it is connecting to. 

The constructor takes the dependencies of the gRPC Connection component, creates a gRPC Connection component, and wires it to the Middleware.

### *The Zeebe API* 

The gRPC connection class has the actual methods, but they are dynamically constructed. This means it has no typing information. The next layer is a concrete, strongly typed implementation of the proto file.

The Zeebe API component is stateful, and takes a Middleware-wrapped gRPC connection, and a retry machine in its constructor. 

It exposes an API that consumes and produces native JavaScript objects. Internally, it performs the marshalling / demarshalling. For example, the `variables` payload is a string in the Zeebe gRPC protocol. But it is stringified JSON. So the Zeebe API component parses it to JSON on receipt, before returning it to the program, and accepts JSON from the program, which it stringifies, before sending it over the gRPC connection.

When an API operation is invoked from the program, the retry machine calls it over the gRPC connection, and manages the retry before passing an error or result back up the chain to the caller.

### *Worker Factory Component*

The Worker Factory component is used to create Zeebe workers. It takes connection configuration in its constructor, and has a `createWorker` method. This method takes a task type and a worker handler, creates a gRPC connection component, and constructs and returns a worker. With the Node implementation, each worker needs its own gRPC connection. The `ActivateJobs` gRPC call is a _streaming gRPC method_ (returns a stream), and errors are thrown asynchronously as events. This means that they cannot be correlated to a particular worker if there is a shared connection. Also, any "synchronous" methods over that channel will also trigger the stream error handler, so you cannot share it with the rest of the API.

So the Worker Factory component also creates its own Zeebe API component to use for the job completion gRPC calls, with retry configuration.

### *Worker Component*

This component manages the lifecycle of `ActivateJob` requests and the corresponding `CompleteJobRequest`, `FailJobRequest`, and `ThrowErrorRequest` to complete jobs. It also manages unchecked exceptions in the worker handler, and the capacity of the worker - which is used to construct the `ActivateJobsRequest`. 

It is created in response to a call to the `createWorker` method of the Worker Factory component. It takes a task type and a worker handler function. The Worker Factory's Zeebe API is also passed in to the Worker constructor, to give it a channel to complete jobs with a managed retry.

### *Configuration Hydration Component*

This component can take an explicit configuration from code, and then reads any configuration files and the environment, and resolves all of these to return a complete configuration.

This is where you put all the defaults, all configuration parameters, and all precedence rules. It is very testable.

### *The Factory Component*

The top-level Factory component assembles the machine. It takes connection and retry configuration, and:

1. creates a Configuration Hydration Component and gets the configuration
1. constructs an OAuth component (if needed)
1. constructs a retry machine
1. injects those into a Connection Characteristic Middleware component
1. injects that into a Zeebe API component
1. constructs a Worker Factory component, injecting the middleware-wrapped gRPC component

And finally, returns the Zeebe API and the Worker Factory to the application.

Missing from here is Logging, and also the error handling strategy.

## Errors

Errors can occur in a number of different places, and for different causes.

Broadly speaking, there are two categories of errors:

- Network Errors 
- Broker Communicated Errors

Network errors are things like gRPC Error Code 14: Cannot Connect. That can be caused by the network being down, unresolvable DNS, or the broker not having started. 

These errors can be retried homogenously - that is to say, you can make a statement like "Retry for n minutes | indefinitely | never" for these errors as a class.

Broker communicated errors are of two types:

- Retryable
- Not Retryable

The retryable error is really only gRPC Error Code 8, which signals backpressure.
Business errors like 5, Element Not Found, should not be retried, and need to be propagated to the application logic.

Allowing API calls to be wrapped with an error handler enables the application to handle them. Network errors in the Node client emit an event that the developer can listen for. This allows an application to alert if it loses connectivity. This is why normalising the initial connection is important - otherwise applications may alert during the initial connection to Camunda Cloud.

Errors from the worker, which is a long-running functional component, are a different concern. What should happen if the worker attempts to complete a job, but cannot. Should it keep trying forever? What happens if it re-establishes a connection, and the attempt to complete the job fails, because another worker got the job and completed it in the meantime?

You probably want to log these errors, but not propagate them to the application logic - since there is nothing that the application can do about it.

## Ideal Architecture

This is pretty much the current architecture of the Node client - however, implemented in an evolutionary way, rather than as a clean architecture.

The separation of concerns isn't as clear cut as this picture, and there is a lot of code to support backward-compatibility. As the client has evolved to its current level of sophistication, it has added signature overloads and code to support them.

If I were doing a significant refactor, or starting from scratch, this is how I would I do it now.


