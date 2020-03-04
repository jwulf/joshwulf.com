+++
author = "Josh Wulf"
categories = ["javascript", "programming", "stackoverflowed"]
date = "2020-03-04"
description = "Use Array.map instead of loops and Array.push"
images = ["img/2020/02/stack-overflow.png"]
linktitle = ""
title = "Why Array.map"
image = "stack-overflow.png"
type = "post"
[twitter]
  card = "Use Array.map instead of loops and Array.push"
  site = "@sitapati"
  title = "Why Array.map"
  description = "Use Array.map instead of loops and Array.push"
  image = "https://www.joshwulf.com/img/2020/02/zeebe-state-machine.png"
+++

_This is part of [a series of posts](https://www.joshwulf.com/categories/stackoverflowed/) where I refactor code from StackOverflow questions, with a discussion of the changes. One of the great things about JavaScript is how scalable it is. You can start with a simple script, and there is nothing wrong with that. Usually these posts are about refactorings other than what the questioner asked about, and would be out of scope for the SO answer. There is nothing wrong with code that runs, **and** "There is no such thing as good coding, only good refactoring"._

Here is the original code from StackOverflow:

{{< gist jwulf b46b22b2b293f87dae2e2b384e7b4172 >}}

This is a common pattern in code in StackOverflow questions for JavaScript.

Here, the programmer wants to do a 1:1 data transformation of the contents of an array.

To do it, they declare no less than four variables. Only one of these is an actual variable - _i_ - the others are falsely declared. Those three do not mutate, and they do not represent mutable values. They are, in fact, misdeclared `const` assignments.

See this previous article about variables and `const`: "[Shun the mutant - the case for `const`](http://joshwulf.com/blog/2020/02/shun-the-mutant/), for more explanation about that distinction.

The actual variable, though - _i_ - is a red flag that we are looking at a _state machine_.

Anywhere in your code that you have an _actual_ mutable variable whose value you must keep track of over time, you have a state machine.

_State_ and _time_ are the two biggest sources of complexity in an application. You want to encapsulate those inside bounded contexts with immutable APIs that return constant values that represent _the constant value of the state at a point in time_.

To wildly introduce state like this is to unleash Pandora's box on your application. You should be pushing all _actual_ state representation out of your application logic, not creating it inline where it doesn't even exist!

Now you have created bug surface areas for "off-by-one" errors and "array index out of bounds" errors.

You had one job - now you are juggling four variables, and one of them is an actual footgun (the other three are just pretending to be).

There is _already_ a state machine for a 1:1 data transformation of elements of an array: `Array.map`. It encapsulates this functionality.

Here is the polyfill for `Array.prototype.map`, from [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map):

{{< gist jwulf 05a31e21fa38937508bf17a39c1476d9 >}}

That is a state machine, and it does _exactly_ what your code is tryna do - but it does it without leaking its variables into your application.

That code is a machine that is concerned with doing one thing - _apply a function to each element in an array_.

There is no **mixing of concerns here**.

The code from StackOverflow does _two_ things at the same time.

We can see that, because this code does _one_ of them - apply a transform to each element of an array and create a new array.

In addition to the state machine for that, the code from StackOverflow also contains the transformation logic - inline.

The two are tightly coupled - and they are definitely separate concerns, because one of them has been crystallised as a well-tested prototype method in JavaScript.

So, even if you were going to reimplement this functionality instead of leveraging the existing method - you would put that state machine in its own bounded context, where it doesn't leak its complexity into the application.

Instead, though, novice programmers will freely mix state machines with logic. Every single loop in an application is someone doing at least two things at once, and is another surface area for bugs.

I adopted programming without variables as a discipline a number of years ago.

What came out of doing that was a recognition that there _are_ some things that _cannot_ be modelled in a program without variables. A specific class of application concern - state machines.

These are representations of state where there is no other source for _a constant value representing the current state of something_. These are "edge-trigger" events, where you have to store the edge-trigger as a level (constant value) for the rest of the application to read. Examples include a state transition of a network connection - ie: a "disconnect" event emitted by an event emitter; or a batch where some part of the application can add or remove an item; or a counter that increments on some event.

These are state machines.

The _absolute requirement_ of a variable is an indication that you are dealing with a state machine. And a state machine is a concern unto itself. It involves variables and time - the two biggest sources of complexity in an application.

The best way to deal with state machines is to isolate them in a bounded context, with an API that accepts and returns constant values.

Then the complexity does not leak into the rest of your application.

And that's what `Array.map` is.

If you were programming this way, then you would invent `Array.map` from first principles, simply through the process of extracting all these state machines out of your code through refactoring.

<a name = "how-to-use-array-map"></a>

## [How to use Array.map](#how-to-use-array-map)

Here is the original code again:

{{< gist jwulf b46b22b2b293f87dae2e2b384e7b4172 >}}

Here is the same functionality with no loops, no variables, and no mutation:

{{< gist jwulf b220dc3413b94d3274022f0f68571293 >}}

This code, plus the state machine of `Array.map` is all it takes to accomplish this. And the complexity and bug surface area of the code is significantly reduced.

Construct a new array `projects`, whose elements consist of each element of the `content` array transformed into an object by the function `makeProject`.

That's it.

Functions over data. That's application logic.

Functions over mutable state, or functions over time are state machines.

Don't mix them together in your code, and your life will be much, much simpler.

There is enough irreducible complexity in programming already, without adding more.

**About me**: _I’m a Developer Advocate at [Camunda](https://camunda.com), working primarily on the [Zeebe Workflow engine for Microservices Orchestration](https://zeebe.io), and the maintainer of the [Zeebe Node.js client](https://www.npmjs.com/package/zeebe-node). In my spare time, I build [Magikcraft](https://github.com/Magikcraft), a platform for programming with JavaScript in Minecraft._
