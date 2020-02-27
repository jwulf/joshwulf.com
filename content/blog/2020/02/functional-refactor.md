+++
author = "Josh Wulf"
categories = ["javascript", "programming", "zeebe", "fp-ts"]
date = "2020-02-27"
description = "Don't worry, you don't need to FP to use it, it's internal!"
featured = "zeebe-node.png"
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "A Functional Refactor of Zeebe Node with fp-ts"
type = "post"
+++

> There is no such thing as good coding, only good refactoring.

I recently did a bunch of work on the [Zeebe Node.js client](https://npmjs.org/zeebe-node) for the upcoming 0.23 release. Zeebe Node is a client library for the [Zeebe Microservices Workflow Orchestration Engine](https://zeebe.io), and I maintain it.

While doing other work, I took the opportunity to refactor one method, `deployWorkflows`, to add a feature that I wanted it to have. I used [fp-ts](https://github.com/gcanti/fp-ts), a TypeScript Functional Programming library to do it. 

I discovered fp-ts after I used [io-ts](https://github.com/gcanti/io-ts), another library by the same author - [Giulio Canti](https://dev.to/gcanti) (gcanti), to decode the environment variables for the Zeebe GitHub Action. 

The benefit of using io-ts is that it allows you to express run-time validations of required and optional parameters that also provide design-time type checking and intellisense. Handy!

You really only appreciate it when you've tried to [write that kind of code by hand](https://github.com/jwulf/ghettohub-db/blob/master/src/parameters.ts). I got run-time validation with property key maps, but couldn't get intellisense without writing interfaces - double handling.

Using io-ts got me "_two for the price of one_". One set of definitions for strong typing in the IDE _and_ run-time validation. 

It did mean, however, that I had to make my consuming code deal with the Monads that io-ts returns, so it pulled in fp-ts.

After using fp-ts, I could see an opportunity to use the FP approach to implement this new feature in Zeebe Node, so I did.

## The Problem

The `deployWorkflows` method takes an object (containing a buffer), a single filename (string), or an array of filenames. It then constructs a [DeployWorkflowRequest](https://docs.zeebe.io/reference/grpc.html#deployworkflow-rpc) gRPC payload to send to Zeebe. 

It does this by either appending the object, or if it gets a string, putting it in an array, and then mapping over the array to read the files into buffers. It then maps over that array to construct the DeployWorkflowRequest.

If one of the files cannot be found, it immediately throws.

Here is the code, before refactoring:

{{< gist jwulf 068397de244ad0e21f035df04c3a3bd6 >}}

It's pretty simple and easy to understand. It has [no variables and no loops](https://www.joshwulf.com/blog/2020/02/just-say-no-to-loops-and-variables/). It does have a few `if` statements that could be refactored to ternaries. That would reduce the indentation.

Basically, there are three parts to the logic:

First, if the argument is not an array, put it in an array. Now we have an array of ( one or more strings, or an object ).

Next, we map over the array, and for each element, if it is an object, append the request. If it 
is a string, read the file and append the resulting buffer; then deploy - or throw if we can't find a file.

Some data transformation, and two outcomes: deploy or throw.

The issue with this implementation is that we cannot return information about _multiple_ missing files - only the first one we encounter.

I would like it to read all the files, and exit if one or more are missing with a list of _all_ missing files.

## Refactor Without fp-ts

This could actually be accomplished by mapping the array with a file reader function and returning `{buffer}` or `{error}` objects, then reducing that, then either throwing or constructing the request, like this:

{{< gist jwulf 60e1d53d0b38056f9acfd82e05946125 >}}

Actually, that's a pretty good solution right there. It borrows heavily from the kind of thinking I had to do to accomplish this with fp-ts. It's obvious to me in hindsight! :-) 

Recently I've been reading [Professor Frisby's Mostly Adequate Guide to Functional Programming](https://mostly-adequate.gitbooks.io/mostly-adequate-guide/) - a book on FP in vanilla JS. That has also been changing how I think about coding in JS.

This refactor uses the functional construct of an [`Either`](https://gcanti.github.io/fp-ts/modules/Either.ts.html), where errors flow down the left-hand path, and values down the right. The `read` function returns an `Either`. It returns _either_ an error or a result.

We map the read function over the workflows array, and end up with an array of `Either<Error, Buffer>`.

We then reduce that array down to a single object whose functional type is called [`These`](https://gcanti.github.io/fp-ts/modules/These.ts.html). It contains a collection of Errors and Buffers. We have an anonymous `These`, and immediately destructure it into its left-hand `errors` and right-hand `buffers`.

We then test the left-hand side of the `These`, and if it contains any errors, we throw with a list of the missing files - otherwise we move forward with deploying the Buffers.

## Refactor in fp-ts 

Here is what I actually ended up with. This uses the fp-ts first-class entity `Either`, which has it own methods. 

{{< gist jwulf d90f7812126c307184104bb69e69b24a >}}

The difference between this one, and the non-fp-ts refactor (that I literally banged up while writing this article), is that in my non-fp-ts implementation I am hand-rolling the Either and the These. Custom-coding them. 

There are two problems with this - the first is that you can't lean into the type system as hard as you can when you use first class Monads that understand how they compose. 

Writing the program with fp-ts is the process of writing the transformations as type signatures, then using the fp-ts functions to implement the type transformations. Then you put your data inside those functions, and it flows from one end to the other.

That reducer in my non-fp-ts refactor is the kind of thing that is encapsulated by the fp-ts library. That reducer is a custom state reducing machine, and writing those is error-prone and rework.

The other problem is that with custom-coded implementations, it is more work for other programmers to parse the code. There is no reuse of familiar constructs. That reducer is pretty dense.

It's easy to think that every problem is novel and needs custom code, but after you've been programming for a while, you start to recognise that there are a limited set of problems and data flow patterns, and well established and maintained solutions for them.

And finally, as Alan Perlis said in his [epigrams on programming](http://pu.inf.uni-tuebingen.de/users/klaeren/epigrams.html):

> "A language that doesn't affect the way you think about programming, is not worth knowing."

Definitely, this refactor using fp-ts changed the way I think about programming. That kind of reducer may look like something from Mars, but it is just implementing a simple FP concept. Once you know that, it makes perfect sense. And if you know enough to make sense of it, the next question you'd ask is: "_why did you reimplement that reduction?_"

## Props to gcanti 

I was struggling with how to accomplish the reduction of `Either<Error, Buffer>[] => These<Error[], Buffer[]>` in fp-ts. I read this article by gcanti about [Either and Validation](https://dev.to/gcanti/getting-started-with-fp-ts-either-vs-validation-5eja), but couldn't figure out how to do it with an array. 

Late at night I googled for [an FP Slack](https://fpchat-invite.herokuapp.com/) to get some help, and ended up on the one where gcanti himself holds court!

He helped me out by lifting the file reader into the Either context. The code from line 46 - 54 was written by gcanti himself, from my description of the problem. 

Rather than a These, it uses a construct called a [`Validation`](https://gcanti.github.io/fp-ts/modules/ValidationT.ts.html).

## Addendum on testability

After I published this article, I got some feedback on it from the FP Chat Slack:

>  I would've usually extracted any pure functions created during the refactor from the body of the original function.

Here is what it looks like with that done (I left `error` in to document both return values):

{{< gist jwulf 5ffa03d23baa993635a69dd62ebe1e0f >}}

The logic of the program is clearly expressed. You can see deploy and error outcomes, and you see: buffer or files - if buffer, deploy; otherwise read the files and then either report the error or deploy.

What I realised as soon as I moved them out, is that the functions with no dependencies are unit testable in isolation. I put them into two sub-directories: `pure`, and `impure` (for those with side-effects). There are three pure functions that do nothing other than transform data passed into them and return it, and one impure function that reads from the file system.

These are all easily testable - the impure file reading function needs a little more setup to test. My code is now more expressive of its intent, and testable.

With the non-FP implementations - even the fp-inspired refactor - you are forced to mentally reason through the execution of the code to understand what it does; and it is tightly coupled - meaning that you have to test the composition of side-effects _and_ logic to ensure that the entire method does what it says on the box, in all permutations.

This refactor is a functional specification of the method, plus some unit-testable functions that are composed to implement it.

**About me**: _I’m a Developer Advocate at [Camunda](https://camunda.com), working primarily on the [Zeebe Workflow engine for Microservices Orchestration](https://zeebe.io), and the maintainer of the [Zeebe Node.js client](https://www.npmjs.com/package/zeebe-node). In my spare time, I build [Magikcraft](https://github.com/Magikcraft), a platform for programming with JavaScript in Minecraft._