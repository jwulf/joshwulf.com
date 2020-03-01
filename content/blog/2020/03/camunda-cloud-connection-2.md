+++
author = "Josh Wulf"
categories = ["javascript", "programming", "zeebe", "fp-ts", "Camunda Cloud"]
date = "2020-03-01"
description = "Building a state machine with business rules to deal with connection characteristics"
featured = ""
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "Refactoring the Zeebe Node gRPC State Machine for Camunda Cloud: Part Two"
image = ""
type = "post"
[twitter]
  card = "Building a state machine with business rules to deal with connection characteristics"
  site = "@sitapati"
  title = "Refactoring the Zeebe Node gRPC State Machine for Camunda Cloud: Part Two"
  description = "Building a state machine with business rules to deal with connection characteristics"
  image = "https://www.joshwulf.com/img/2020/02/zeebe-state-machine.png"
+++

_See [Part One of this series here](https://www.joshwulf.com/blog/2020/02/camunda-cloud-connection/)_.

I'm refactoring the [Zeebe Node client](https://www.npmjs.com/package/zeebe-node) to give it the ergonomic excellence that developers have come to expect from the library, when running it against Zeebe clusters in [Camunda Cloud](https://camunda.io).

Right now, here is what it looks like connecting to Camunda Cloud with the Zeebe Node client:

{{< fancybox path="/img/2020/03" file="camunda-cloud-before.png" caption="" gallery="Zeebe Node" >}}

Boo!

The gRPC connection with Camunda Cloud has different characteristics to self-hosted Zeebe, particularly on initial connection, and there is nowhere in the current Node client architecture to model different expectations of connection behaviour. So I am adding a "_Connection Characteristics Middleware_" to it.

The next step in doing the refactor of the gRPC connection management is to refamiliarise myself with its current operation.

I did this by reading through the [current source code of the `GRPCClient` class](https://github.com/jwulf/zeebe-client-node-js/blob/38102e7faaebafe199abd7da4e02bb35a6011ab0/src/lib/GRPCClient.ts) and creating a BPMN diagram that models its behaviour.

BPMN - "[Business Process Model and Notation](https://en.wikipedia.org/wiki/Business_Process_Model_and_Notation)" is an XML standard for modelling business processes that can be rendered graphically. BPMN is perfect for modelling state machines, because that's what a business model is.

I used the [Camunda Modeler](https://camunda.com/download/modeler/) to create the diagram. It has more symbol support than the Zeebe modeler currently does. I'm not intending to execute this diagram, so I don't need to worry about compatibility.

After creating a model of the current behaviour, I uploaded it to [Cawemo](https://cawemo.com), Camunda's web-based collaborative modeling platform. Here it is:

{{< cawemo 93db6405-211b-499e-ac12-f867c875b63d >}}

### Sidenote: Hugo Shortcode for Cawemo models

To get the model to embed in my blog, I wrote a Hugo shortcode:

{{< gist jwulf e88c8b69ee9c3e86332e04f176bfcd3d >}}

## Model symbols

The gRPC State Machine is heavily asynchronous, and event-driven - as you can imagine. I modelled callbacks as subprocesses, and noted when something is a Promise.

Escalation to the new "_Connection Characteristics Business Rules Middleware_" that we are building are noted using the [Escalation Event symbol](https://docs.camunda.org/manual/7.12/reference/bpmn20/events/escalation-events/).

Signals are used to trigger the debouncing connected (ready) / disconnected (error) state machines.

## Preliminary Conclusion

Looking over it, I'm actually pretty happy with the design. I'm not surprised though - I _am_ pretty good. At least [most of the time](https://www.joshwulf.com/blog/2020/02/refining-method-signature/). And I did refine that state machine continuously over the last year, as I used it in production.

There are some obvious escalation points, and it looks like the refactor is going to be mostly lifting the inline logging out of the `GRPCClient` class and putting it in the middleware, where we encapsulate the business rules around connection characteristics.

## Start Mashing Keys

I think I will create a `GrpcConnectionFactory` class. Instead of directly instantiating a gRPC client as it does now, the ZBClient will get one from this factory.

The factory will be responsible for instantiating the GRPCClient and a Middleware component with the correct profile; wiring them up; and then passing back the wired up client to the ZBClient. That makes my refactor of the ZBClient code minimal: I just replace all `new GRPCClient()` calls with `GrpcConnectionFactory.getClient()`.

While I'm at it, I will rename the GRPCClient class to GrpcClient to break all existing references and normalise my naming.

I will make the Middleware component responsible for detecting the correct profile to use, determining what constitutes exceptional behaviour of the gRPC connection, and logging it out.

This will mean injecting the configured logger into it, but we're already doing that with the GRPCClient - I mean GrpcClient - so not much change there.

The GrpcClient will no longer log exceptions. Instead it will emit events, and the Middleware component will log them, or supress them, and will also have to maintain some state to determine if an error event during connection is final (after a timeout), or was transient. So it needs to be stateful.

From my reading of the source code, it looks like I just replace logging in the GrpcClient with events emitted to the Middleware.

It would be good to be able to make the GrpcClient class private to a module or namespace, but I don't know if you can do that in TypeScript without [putting them in the same file](https://stackoverflow.com/questions/17162989/typescript-private-class-inside-class-or-something-similar). Anyway, the linter settings in the project disallow modules and namespaces. And it's not exported from the library, so _whatevs_.

## GrpcConnectionFactory

First cut, I just make a class with a static method `getGrpcClient`, have it take the same args as the `GrpcClient` constructor, and return a new instance of the class:

{{< gist jwulf dc1a619a8da2435526af24d2237a362e >}}

And just like that, we have created a new level of indirection - [the fundamental theorem of software engineering](https://en.wikipedia.org/wiki/Fundamental_theorem_of_software_engineering):

> "We can solve any problem by introducing an extra level of indirection."

## GrpcMiddleware

OK, so this needs to be a stateful class. Let's create some profile types first, and some characteristic profiles.

I'll use a [string literal union type](https://mariusschulz.com/blog/string-literal-types-in-typescript) for the profile names, and key the characteristics map using them.

I don't know what shape the characteristics rules will have yet, so I'll type them `any` for now, but using an alias so that I can update the typing across the entire system when I know what it is:

{{< gist jwulf efcdc1c36c852b876969d20f384b0079 >}}

OK, now the class. It will take in the entire config being passed to the GrpcClient constructor, and we can do an initial naive detection by looking for the address of Camunda Cloud in the host string:

{{< gist jwulf e95df07ea94b8147699228bf752f9d01 >}}

Actually, I need to get the GrpcClient in here. I could move the detection up to the factory, and then pass in the profile and the GrpcClient at the same time - using a parameter object _of course_.

Here it what it looks like after that refactor:

{{< gist jwulf 7a41b260caf30cce7972739a0559ea03 >}}

The unassigned call to a new GrpcMiddleware looks a bit weird. We won't have a reference to it, but it won't get garbage collected because it will attach event listeners to the GrpcClient.

We can test the GrpcMiddleware by passing in a mock event emitter as the GrpcClient.

## Logging

Next, I rip out the logging from GrpcClient, and put it into the GrpcMiddleware. Then I just look for log calls in GrpcClient and turn them into events for the middleware.

Oh, OK - to configure the logger with the right namespace, I need the config. OK, I guess I delegate creation of the client to the GrpcMiddleware after all.

Now the factory looks like this: 

{{< gist jwulf 19ed3181415f5de5870655ff6df4084a >}}

OK, I create a new ZBLogger in the middleware. Now it looks like this:

{{< gist jwulf 9e44a5ddc0b2e124943edd30bee04734 >}}

## Events 

The GrpcClient already emits events. You can chain event listeners to instances of ZBClient and ZBWorker to react to connection ('ready') and disconnection ('error') events already. I can't change the names of those, because they are a public API.

_Update: man, emitting an 'error' event caused my program to inexplicably crash and had me debugging for 30 minutes. Eventually, I tracked it down, and consulted the README - the event is `connectionError`. [Emitting 'error' with no listeners throws](https://medium.com/better-programming/using-events-in-node-js-the-basics-9a9c44dcbe30)._

I should namespace events for the Middleware so it clear where they are going, rather than using plain strings. 

I will have to redirect all events through the middleware, actually - otherwise custom listeners on clients connected to Camunda Cloud will not get the benefit of the middleware.

This poses a challenge, actually. I can trap the current event emitters in the middleware, but since the ZBClient only has access to the GrpcClient, and not the middleware, I will need to re-emit them _through_ the GrpcClient from the middleware. I've never tried that. Let me see if it can be done...

OK, my IDE is telling me I can call `this.GrpcClient.emit('error')`, so we will redirect all events through the middleware.

I will create namespaced events for the existing events as well as the new ones, which will break the connection right now, and then re-emit them from the middleware later. So in the GrpcClient:

{{< gist jwulf 7398a833081e6390fc6977cf7e3f3544 >}}

And here is an example of redirecting the existing log messages and events in GrpcClient to the new Middleware:

{{< gist jwulf 5c27cbcead60acabb07643296852869f >}}

Now I can modify my Middleware to construct an intercepted GrpcClient that behaves just like the existing one. This is a good checkpoint, because I can verify my hypotheses and work so far by running the standard unit tests. So I make my GrpcMiddleware component like this:

{{< gist jwulf 43e8b92ebf14e209542205c3f35af275 >}}

## Event-driven: Spooky Action at a Distance 

When React first came out, one of the patterns to make your components communicate at a distance across the component hierarchy was to [emit events](https://www.sderosiaux.com/articles/2015/02/12/how-to-communicate-between-react-components/). That pattern went out, because in lead to unpredictable and hard to reason about architectures.

Adding namespaced events helps us out here, but - apart from the hell I just created for myself [changing filename casings on a case-insensitive file system](https://stackoverflow.com/questions/17683458/how-do-i-commit-case-sensitive-only-filename-changes-in-git/17688308#17688308) - the GrpcClient just went into a stackoverflow loop.

It turns out that it listens to the same signals internally that it uses to communicate publicly. As soon as I intercepted them in the middleware and rebroadcast them, it went into a loop.

I fixed that by changing the string value of the Middleware namespaced events - but it means that those events are not only informing the world, but also informing parts of GrpcClient.

I'm not going to fix that now (_just like I didn't fix it then_). It's technical debt though. Changes to the "Middleware-facing" events will have unpredictable side-effects on the GrpcClient behaviour. I will have to fix those at some point.

On second thoughts, _something something_ [write the best code you can at the time that you write it](https://www.joshwulf.com/blog/2020/02/refining-method-signature/). 

Architecture diagram in hand, I carefully trace the logic, and create namespaced `InternalSignal` events for GrpcClient to use internally.

## Hours later...

Don't emit an event named 'error' from an event emitter with no listeners attached, otherwise your code will throw. _Just so you know..._

In the end, I realised that the GrpcClient and the ZBLogger are so tightly coupled that they need to come at the same time from the same place.

I put the state management into a component called `StatefulLogInterceptor`. The `ConnectionFactory` static class takes a Grpc configuration and a Log configuration, and returns a wired GrpcClient and ZBLogger. They are wired together via a StatefulLogInterceptor. 

Check it out:

### Before

{{< fancybox path="/img/2020/03" file="camunda-cloud-before.png" caption="" gallery="Zeebe Node" >}}

### After

{{< fancybox path="/img/2020/03" file="camunda-cloud-after.png" caption="" gallery="Zeebe Node" >}}

Under the hood, the behaviour of the gRPC connection is _exactly_ the same. However, now the library detects that it is connecting to Camunda Cloud, and changes its output while the connection is being established.

You can see from both that it takes about three seconds for the gRPC connection to settle. Our expectation with Camunda Cloud, however, is that there will be error events emitted as this happens - and there is no benefit exposing these to users. They are expected behaviour.

Once the connection is established, the behaviour from that point is the same as a self-hosted connection. If the Camunda Cloud connection doesn't settle within five seconds, _all_ the emitted errors are presented to the user (_they are being buffered in the background_). 

The adaptive behaviour is completely disabled when the log level is set to DEBUG.

**Happy**. 

Next: get the tests to pass.

## And....

{{< fancybox path="/img/2020/03" file="tests-green.png" caption="" gallery="Zeebe Node" >}}

**Yassss!**

(_Although this is against the local broker. Not green on Camunda Cloud yet..._)

**About me**: _I’m a Developer Advocate at [Camunda](https://camunda.com), working primarily on the [Zeebe Workflow engine for Microservices Orchestration](https://zeebe.io), and the maintainer of the [Zeebe Node.js client](https://www.npmjs.com/package/zeebe-node). In my spare time, I build [Magikcraft](https://github.com/Magikcraft), a platform for programming with JavaScript in Minecraft._
