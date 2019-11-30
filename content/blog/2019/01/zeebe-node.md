+++
author = "Josh Wulf"
categories = ["javascript", "programming", "zeebe"]
date = "2019-01-29"
description = "I’m proud to announce that Credit Sense has open-sourced our Node.js client library for Zeebe."
featured = "zeebe.png"
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "Node.js client for Zeebe Microservices Orchestration Engine"
type = "post"

+++

_Update: I now work at Camunda on Zeebe as the Node client maintainer and a Developer Advocate. Things have changed in the broker and the library since this was published - for the latest on using it, refer to my new book in development - "[The Zeebe Node.js Client Guide](https://zeebe.joshwulf.com)"_

I’m proud to announce that Credit Sense has open-sourced our Node.js client library for Zeebe. [Check it out on GitHub and start using it now](https://github.com/CreditSenseAU/zeebe-client-node-js)!

## About Zeebe

[Zeebe](http://zeebe.io/) is an emerging microservices orchestration engine being [developed in the open](https://github.com/zeebe-io/) by Camunda.

It addresses one of the core issues in a distributed microservices architecture — where is the source of truth for the coordinated interaction of the entire system?

While designing a green-field microservice-based system at Credit Sense, our team of six developers found ourselves constantly drawing system diagrams in Confluence — with the knowing dread that they would rapidly go out of date once we started coding. At the same time, we appreciated the view they gave us of the overall system architecture — the system we are replacing uses a complex peer-to-peer choreography that requires reasoning across multiple codebases to understand.

We eventually converged on the Confluence BPMN plugin, in order to share a common language with our Business Analysts. Imagine our surprise and delight to find out that there is an orchestration engine that can parse and orchestrate the service flows in our diagrams!

{{< fancybox path="/img/2019/01" file="bpmn.png" caption="An example BPMN diagram" gallery="Gallery Name" >}}

No more drift between our system documentation in Confluence and the implementation? I’ll take it.

So after prototyping with the Zeebe Go client, we wrote a JavaScript client library (in TypeScript), and [made it available to the Zeebe community under an Apache license](https://github.com/CreditSenseAU/zeebe-client-node-js).

We had some experience with gRPC, as we’d been looking at building our new system with our own orchestration, and just followed the [gRPC + Zeebe Python client tutorial](https://zeebe.io/blog/2018/11/grpc-generating-a-zeebe-python-client/). It took a bit longer than an hour, including tests, and we’re currently tracking upstream development of the 0.15 release of Zeebe, so you can expect further changes and frequent releases leading up to that release.

## Working with the Zeebe team

Basing a project on a developing product is a risk. As part of our evaluation, we’ve been engaged with the Zeebe developers at Camunda in Slack, on GitHub, and have had a couple of calls.

The speed of their responses, and depth of expertise and passion has given us a lot of confidence in working with them. Most of the devs are in Germany, while we are in Australia. This is an advantage, because we can work around the clock. We have encountered issues, created a reproducer, opened a GitHub issue, chatted with the devs in Slack at the end of our day / beginning of theirs, and then come in the next morning to a fix and been able to keep moving forward.

This bug got fixed over the recent Australia Day long weekend, and the reproducer is a good example of using the JS client library, including starting the broker using Docker: [https://github.com/jwulf/zeebe-reproducer-1](https://github.com/jwulf/zeebe-reproducer-1).

## Zeebe Modeler

The [Zeebe Modeler](https://github.com/zeebe-io/zeebe-modeler) has support for the Zeebe metadata extensions that your BPMN diagrams need to be executable. However, it doesn’t yet support everything that you can do in Zeebe 0.15. We’ve been using the Camunda Modeler to add to our diagrams symbols that the Zeebe modeler doesn’t have yet.

## Using the JavaScript Zeebe Client Library

The library is available via [npm](https://www.npmjs.com/package/zeebe-node), and can be added to your project with a single command:

```
npm i zeebe-node
```

Comprehensive API documentation is [available online](https://creditsenseau.github.io/zeebe-client-node-js/). Since the library is written in TypeScript, we generate it directly from the source code using [TypeDoc](https://typedoc.org/).

Import the library in your code like this, in JavaScript:

```javascript
const { ZBClient } = require('zeebe-node');
```

Or like this in TypeScript:

```typescript
import { ZBClient } from "zeebe-node";
```

Now create a new Zeebe Client:

```javascript
const zbc = new ZBClient("localhost");
```

The ZBClient uses [`node-grpc-client`](https://www.npmjs.com/package/node-grpc-client) under the hood to establish a connection to a Zeebe broker on port 26500 (you can add a :${port} if you are using a different port). We initially forked node-grpc-client to add support for streaming gRPC methods. Our PR was accepted upstream, so the library is back on the mainstream.

## Deploy a BPMN Process to the Broker

To deploy a BPMN Process, use the deployWorkflow method [(API doc)](https://creditsenseau.github.io/zeebe-client-node-js/classes/zbclient.html#deployworkflow) and pass in a file path:

```javascript
const response = await zbc.deployWorkflow("path/to/file.bpmn");
```

Most methods are asynchronous, because they involve a roundtrip to the broker.

The response will look something like this:

```
{ bpmnProcessId: 'test-process',
       version: 1,
       workflowKey: '4',
       resourceName: 'test-process.bpmn' } ],
  key: '5' }
```

## Generating Types from BPMN

The JS library has a BPMN Parser ([API doc](https://creditsenseau.github.io/zeebe-client-node-js/classes/bpmnparser.html)) that can emit TypeScript definitions for the string keys of task-types and message names in your BPMN document. This is useful to avoid debugging errors caused by typos, and also to analyse the completeness of your worker coverage.

Here is an example of using it:

```javascript
const { BpmnParser } = require("zeebe-node");
async function outputTypes(workflowFilePath: string) {
    console.log(
      await BpmnParser.generateConstantsForBpmnFiles(
        workflowFilePath
      )
    );
}
```

## Create a Zeebe Worker

Now you can code up a Zeebe task worker ([API doc](https://creditsenseau.github.io/zeebe-client-node-js/classes/zbworker.html)). A task worker polls the broker for tasks that correspond to its `taskType` — a string key, and executes its handler for instances of tasks that are available (called jobs):

```javascript
const zbTaskWorker = zbc.createWorker("my-unique-id", "task-type-I-handle", handler);
```

The task handler ([API Doc](https://creditsenseau.github.io/zeebe-client-node-js/globals.html#zbworkertaskhandler)) looks like this:

```javascript
function handler(job, complete) {
   const { payload } = job.payload;
   // Business logic goes here
   complete.success(updatedPayload);
}
```

The payload is a JSON object that gets passed along the Workflow instance and can be mutated by workers. We use it mainly for passing IDs as pointers, and for some flow control flags for branching logic in the Business Process, and keep state out of the engine, in databases.

The job object that the handler receives looks like this:

```
{ key: '578',
  type: 'demo-service',
  jobHeaders:
   { workflowInstanceKey: '574',
     bpmnProcessId: 'test-process',
     workflowDefinitionVersion: 1,
     workflowKey: '3',
     elementId: 'ServiceTask_0xdwuw7',
     elementInstanceKey: '577' },
  customHeaders: '{}',
  worker: 'test-worker',
  retries: 3,
  deadline: '1546915422636',
  payload: { testData: 'something' } }
```

To complete the task, the handler calls the complete method that was passed into the handler, and passes back the object that is merged into the payload in the engine, for the next task in the workflow.

The JS client provides an optional third parameter, worker, which you can use to get the task type of the worker, and also a convenience console logger that adds metadata for debugging.

On the topic of debugging, for deeper inspection, you can start your workers with the environment variable `DEBUG=zeebe-node:*` for some verbose logging during development.

## Trigger a Workflow

Now you can trigger an instance of your workflow, using the `createWorkflowInstance` method ([API doc](https://creditsenseau.github.io/zeebe-client-node-js/classes/zbclient.html#createworkflowinstance)):

```javascript
const response = await zbc.createWorkflowInstance("test-process", intialPayload);
```

The response looks like this:

```
{ workflowKey: '3',
  bpmnProcessId: 'test-process',
  version: 1,
  workflowInstanceKey: '569' }
```

## Sending a Message

Workflows can contain message start events — which start a workflow when a message is received — and message catch events — which wait at the catch event until a message arrives.

Message start events are correlated by the message name, and the JS library method `publishStartMessage` ([API doc](https://creditsenseau.github.io/zeebe-client-node-js/classes/zbclient.html#publishstartmessage)) can be used to send one of these messages (this is the start method used in the [https://github.com/jwulf/zeebe-reproducer-1](https://github.com/jwulf/zeebe-reproducer-1) workflow).

```javascript
await publishStartMessage(MessageName.MSG_START_TEST, payload);
```

This needs no correlation key, as the message start event is correlated by name. It also returns void — fire and forget.

For message catch events, the message needs to be correlated with a workflow instance using a correlation key (see the [Zeebe docs](https://docs.zeebe.io/reference/message-correlation.html) for more details). For this use the publishMessage method ([API doc](https://creditsenseau.github.io/zeebe-client-node-js/classes/zbclient.html#publishmessage)).

```javascript
await zbc.publishMessage({
    correlationKey: "my-order-number",
    name: "MSG-payment-received",
    payload: payloadJSON,
    messageID: "my-message-name",
    timeToLive: 10000
});
```

## Support and Reporting Issues

The JavaScript library has been developed for our use case, and it is provided under an Apache license as-is. If you want to report an issue, use the [GitHub issues page](https://github.com/CreditSenseAU/zeebe-client-node-js/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc). For support developing Zeebe applications, the [Zeebe Slack and User Forums](https://zeebe.io/community/) are incredible resources.
