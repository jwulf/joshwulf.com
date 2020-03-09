+++
author = "Josh Wulf"
categories = ["javascript", "programming", "stackoverflowed"]
date = "2020-03-08"
description = "Handling failure and success in an array of asynchronous tasks whose execution may fail. TLDR; Promise.allSettled()"
images = ["img/2020/02/stack-overflow.png"]
linktitle = ""
title = "Handling failure and success in an array of asynchronous tasks"
image = "stack-overflow.png"
type = "post"
[twitter]
  card = "Handling failure and success in an array of asynchronous tasks"
  site = "@sitapati"
  title = "Handling failure and success in an array of asynchronous tasks"
  description = "Handling failure and success in an array of asynchronous tasks whose execution may fail"
  image = "https://www.joshwulf.com/img/2020/02/stack-overflow.png"
+++

_This is part of [a series of posts](https://www.joshwulf.com/categories/stackoverflowed/) where I refactor code from StackOverflow questions, with a discussion of the changes. One of the great things about JavaScript is how scalable it is. You can start with a simple script, and there is nothing wrong with that. Usually these posts are about refactorings other than what the questioner asked about, and would be out of scope for the SO answer. There is nothing wrong with code that runs, **and** "There is no such thing as good coding, only good refactoring"._

Here is the original code under discussion:

{{< gist jwulf b934f3a0e3551c25ab7aa85fba90ed36 >}}

The questioner asks: 

> But I am not sure where do I need to put try-catch block. Wrapping each content function? Or inside my async function and for operator.

I'm going to give my answer verbatim from StackOverflow, and then a little extension to it.

_Astute readers will recognise this pattern from "[A Functional Refactor of Zeebe Node with fp-ts](https://www.joshwulf.com/blog/2020/02/functional-refactor/)_.

## Answer

Depends how and where you want to handle failure.

One approach to "an array of asynchronous tasks whose execution may fail" is a pattern like this:

{{< gist jwulf 6e163088f80b3b59644ad7c1abbc81a6 >}}

You can chain a `.catch()` handler on an `async` function, and it has the same effect as wrapping it in `try/catch`.

More in "[A Functional Refactor of Zeebe Node with fp-ts](https://www.joshwulf.com/blog/2020/02/functional-refactor/), if you are interested. The section "_Refactor without fp-ts_" shows how to reduce that array from `[{error: e} | {success: res}]` to `{error: [], success: []}`, which is way easier to work with:

{{< gist jwulf 443ec653fe0aee1fbf78afa332f58773 >}}

This is an FP type called Either - an operation may return "either" (in this case) a value or an error.

Your code doesn't throw with this approach.

If you know that something may fail, it's not exceptional. Exceptions are when some unexpected failure occurs, IMHO.

"_Tasks that may fail_" that are known ahead of time just need the error path code written.

If you take this approach, I recommend building it as a first-class state reducing machine, like this:

{{< gist jwulf 919cb46fd4ca6a129356296d8141b22d >}}

## Further discussion

A couple of things are missing from this. 

* The ability to correlate the error and success results to the original task.
* Custom error-handling per task.

What gets populated into the eventual arrays of errors and results and just the outputs. You can answer the questions "_How many tasks succeeded/failed and with what results/errors_", but you cannot answer the question "_Which specific tasks failed?_"

To do this, you would need either to pass a correlation through this machine, or report the result back to something listening to the task.

## Application Architecture

How you do this really depends on _where you plan to deal with the failure and success of the operations_.

Now we start to move into the question of the _structure_ of your application - the application architecture, the set of patterns and conventions that you use to assemble the logic of your application. And this is, in fact, at the crux of this question.

If you build a _generalised_ machine for _this class of operation_ (executing an array of asynchronous tasks that may succeed or fail), you cannot generalise specific operation error handling.

Do you want the caller to pass in an array of tasks, and then deal with the aggregate of success and failure?

Or do you want each task to be (at least optionally) responsible for dealing with it, and report the aggregate to the caller?

The easiest way to do it, would be to create an `AsyncTask` class that has a run method, and require (or just allow) it to take a `success` and `failure` callback in its constructor. This allows the tasks themselves to handle their own failure and success if they want.

So, the `AsyncTask` class looks something like this:

{{< gist jwulf bc75bd014393be0a39a70f14f5bc2976 >}}

The executor now needs to deal with Promise branching, rather than just Promise chaining. The impact is in the `runWithResult` function:

{{< gist jwulf 668e0097484c2ad7e3e513c4577ec199 >}}

## Actually doing this

I wouldn't actually do this, but it is an interesting exercise.

You do need an application architecture - rather than custom-coding inline, refactoring the state machinery out to a first-class concern. The _logic_ of your application is usually the custom part that actually produces unique business value. 

However, rather than writing this state machinery, I would use something like `fp-ts`, or in this specific case - I'd probably use [`Promise.allSettled`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled), a state machine that does _exactly_ this, and is built in to JavaScript (supported from Node 12.9.0, Chrome 76, and Firefox 71). If you are using TypeScript, you need to target the `es2020` lib.

It's further evidence that state machines - when they are a means to an end in your application, rather than what your application does - belong is well-tested, sealed black boxes with a defined API that prevents them leaking their complexity into other areas of your application code.

**About me**: _I’m a Developer Advocate at [Camunda](https://camunda.com), working primarily on the [Zeebe Workflow engine for Microservices Orchestration](https://zeebe.io), and the maintainer of the [Zeebe Node.js client](https://www.npmjs.com/package/zeebe-node). In my spare time, I build [Magikcraft](https://github.com/Magikcraft), a platform for programming with JavaScript in Minecraft._
