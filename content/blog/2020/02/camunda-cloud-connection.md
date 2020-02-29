+++
author = "Josh Wulf"
categories = ["javascript", "programming", "zeebe", "fp-ts", "Camunda Cloud"]
date = "2020-02-29"
description = "Building a state machine with business rules to deal with connection characteristics"
featured = "zeebe-state-machine.png"
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "Refactoring the Zeebe Node gRPC State Machine for Camunda Cloud: Part One"
type = "post"
+++

Preparing for the launch of Camunda Cloud, I turned on continuous integration testing for the Zeebe Node client against a running instance of a Camunda Cloud Zeebe cluster.

I was immediately forced to deal with something I'd been conveniently ignoring - Camunda Cloud gRPC connections _always_ fail initially, before eventually succeeding.

This is because the connection to Camunda Cloud is via a TLS-enabled Nginx reverse proxy with OAuth authentication. This causes the current gRPC client state machine to emit intermediate connection failure events before emitting an eventual "READY" state.

This is a characteristic of this connection that differs from the behaviour of the non-proxied connection over a Docker network (the current CI test environment in CircleCI) or against a non-proxied broker on a remote machine (my personal production setups not using Camunda Cloud).

What that looks like for a user is:

{{< fancybox path="/img/2020/02" file="camunda-cloud-connection-characteristics.png" caption="" gallery="Camunda Cloud" >}}

I had been ignoring this as "expected behaviour", and my [reticular activating system](http://matizmo.com/the-importance-of-ras-and-its-implications-with-your-content-the-cocktail-party-phenomenon/) had conveniently made it invisible to me.

The failure of the integration tests made it abundantly clear that this is actually _not_ expected behaviour in the formal specifications for the client (the tests).

## Designing for Developer UX 

It is bad user experience (UX) design.

When developers are using Zeebe Node for the first time against Camunda Cloud, they don't know what they are doing, _and_ whether they are doing it right. When it is not working as they expect, they don't know if their expectation is erroneous or they have done something incorrectly. Users are often unaware even that they _have_ a model of the system composed of expectations they hold as a hypothesis. Instead, they think: "_Something is wrong. This is not working._"

There are four things that can be at the cause of this:

* The user has missed a step or made a mistake in their code or configuration.
* There is an intermittent failure condition (network down, service interruption).
* There is a bug in the library.
* The user's expectation is incorrect (actual behaviour is correct, expected behaviour is incorrect).

Surfacing that last one - _the unexamined hypotheses that the user holds about the system as their working model of the system_ - is why bug reports request "Expected Behaviour" and "Actual Behaviour" in their templates.

_Any_ message presented to the user while they are developing their model of the system _must_ take into account that the user's model is unformed, and the user is usually not consciously forming the model. I mean _any_ message. A DEBUG level informational message in the Zeebe broker log has been a source of confusion for new users. They frequently interpret it as an error message ([an example from the Zeebe Forum](https://forum.zeebe.io/t/error-jobs-of-type-not-available-but-workflow-deploys-and-completes/1048)), and we are refactoring it to either reword it - taking into account the user's uncertainty - or just take it out completely ([GitHub issue "Reword Blocking request DEBUG Message"](https://github.com/zeebe-io/zeebe/issues/3890)).

This particular message in the Zeebe Node client - that _every single connection_ to Camunda Cloud _always_ emits an error, is **terrible** for UX. 

New users have enough uncertainty already. This behaviour guarantees that _even if they do everything correctly_, they are still going to be thinking: "_I've done something wrong, it's not working._" 

And if they _have_ done something incorrectly and it is not working, this message provides them with no clue as to what _that_ is, and will lead them on a [wild-goose chase](https://en.wiktionary.org/wiki/wild-goose_chase).

It has to go. 

## The Current gRPC State Machine

The current gRPC connection state machine has evolved over time. It started off pretty simple, then evolved to emit error events, then a [ready event for the downstream Node-RED client](https://github.com/creditsenseau/zeebe-client-node-js/issues/71), then [managing the gRPC Error 8 event](https://github.com/creditsenseau/zeebe-client-node-js/issues/80) for Broker back pressure response.

As these features were added, the responsibility for managing the representation of the current connection state (that's a [true variable in the code]((https://www.joshwulf.com/blog/2020/02/shun-the-mutant##valid-use-of-variables))), debouncing transitions (_the channel state can flap about wildly during retries when it does go down - and this requires managing more state: time_), and attaching different user-defined event handlers (_if you add one for worker job streaming to the same connection used for client commands, it gets called for both_), got split between the `ZBClient`, `ZBWorker`, and `GRPCClient` classes. This happened because these various patches were made one after the other, with no refactoring. 

Now, adding the concept of "connection characteristics" will exponentially complicate already fragile code. State management is the bane of program correctness and a source of interminable bugs and edge conditions. State needs to be coalesced as an encapsulated concern in an application to avoid leaking this complexity into the other components in an application, and making changes to state management a distributed concern that touches many components. 

See the article "[Avoiding Global Mutable State in Browser JS](https://www.joshwulf.com/blog/2020/02/avoid-global-state/)" and the "[Valid use of variables](https://www.joshwulf.com/blog/2020/02/shun-the-mutant##valid-use-of-variables)" section in the article "[Shun the mutant - the case for `const`](https://www.joshwulf.com/blog/2020/02/shun-the-mutant##valid-use-of-variables)" for more discussion about this.

That implementing connection characteristics requires changes to multiple components is a [code smell](https://en.wikipedia.org/wiki/Code_smell) that indicates there is a first-class concern with no, or an incorrectly bounded, materialised entity in the code.

It is time for a significant refactor. The time required for this refactor is not trivial, and I looked long and hard at the code before determining this (_and ignored the error message until it became a failing test suite_). 

This is a significant part of the Zeebe Node client - managing the state of the gRPC connection and providing an ergonomic API to handle various failure conditions. However, you don't have to be Einstein to realise that:

> “We can not solve our problems with the same level of thinking that created them.” - Albert Einstein

In this case, adding the concept of "Connection Characteristics" with differential behaviours to a non-first class abstraction is asking for a million bug reports and an unending game of whack-a-mole where fixing one problem causes problems with other behaviours.

No thanks. I'll suck up the refactor costs.

The code should model the domain. We now have in the domain "_various gRPC connection classes with different business rules for handling their characteristics_", so we are going to refactor the code to model that bounded context.

Fortunately, I already have the behavioural specification written - my integration tests. If I change nothing in those, I just have to make Camunda Cloud's integration test go green and keep the CircleCI one green, and I can be confident that it works as expected.

As Evan Burchard explains, in his excellent book "[Refactoring JavaScript: Turning Bad Code into Good Code](https://www.amazon.com/Refactoring-JavaScript-Turning-Code-Into/dp/1491964928)":

> When we have any code that lacks tests (or at least a documented way of executing it), we do not want to change this code. We can’t refactor it, because we won’t be able to verify that the behavior doesn’t change.

## Step One: Explain it in plain language

The first step is to write a specification in a non-executable language - aka plain English.

This is the initial specification, and it should strive to be an unambiguous definition.

I created a GitHub issue "[Manage that Camunda Cloud connections *always* error before eventually succeeding](https://github.com/creditsenseau/zeebe-client-node-js/issues/133)", and described the motivation for the refactor in there. 

Then, I added a [design specification as a comment](https://github.com/creditsenseau/zeebe-client-node-js/issues/133#issuecomment-592862739).

I am going to separate the functionality into two layers:

* The underlying GRPCClient that manages the gRPC connection and emits state events.
* An intermediary Business Rules component that models the connection characteristics and ensures that various connections behave the same at the API level.

There is one concern whose location I am not yet clear about. I am thinking that the GRPCClient will have a method to turn on a buffering mode, where it buffers state transition events, and then returns the eventual state with a list of intermediate transitions, after a specified period of time.

This allows me to turn this on for Camunda Cloud connections, and throw away those initial failures, reporting only the ultimate result.

This may complicate the GRPCClient state machine by adding an additional state machine to it (_managing time, and the current operational mode_), so I may move this into the Connection Characteristics component. We shall see. It's a working hypothesis. Gotta start with some kind of vision, and keep re-evaluating along the way.

OK, let the fun begin!

**About me**: _I’m a Developer Advocate at [Camunda](https://camunda.com), working primarily on the [Zeebe Workflow engine for Microservices Orchestration](https://zeebe.io), and the maintainer of the [Zeebe Node.js client](https://www.npmjs.com/package/zeebe-node). In my spare time, I build [Magikcraft](https://github.com/Magikcraft), a platform for programming with JavaScript in Minecraft._
