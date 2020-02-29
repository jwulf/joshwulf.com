+++
author = "Josh Wulf"
categories = ["javascript", "programming", "zeebe", "typescript"]
date = "2020-02-29"
title = "Providing a method signature overload for Zeebe Node's `createWorker` using TypeScript"
description = "TypeScript allows signature overloads, but it takes some behind-the-scenes work. Code so you never have to do it!"
featured = "zeebe-overload.png"
featuredalt = ""
featuredpath = "date"
linktitle = ""
image = "/img/2020/02/zeebe-overload.png"
type = "post"
[twitter]
  card = "TypeScript allows signature overloads, but it takes some behind-the-scenes work. Code so you never have to do it!"
  site = "@sitapati"
  title = "Providing a method signature overload for Zeebe Node's `createWorker` using TypeScript"
  description = "TypeScript allows signature overloads, but it takes some behind-the-scenes work"
  image = "https://www.joshwulf.com/img/2020/02/zeebe-overload.png"
+++

When I wrote the first iteration of the [Zeebe Node client library](https://www.npmjs.com/package/zeebe-node) in the first months of 2019, I didn't have any experience in using it. How could I - it didn't exist.

One early design decision has haunted me for the last year, causing me sleepless nights as I toss and turn, tormented by my guilty conscience. 

The `ZBClient.createWorker()` method - to create a new job worker process - takes as one of its parameters an `id`, used to uniquely identify a specific instance of a worker in events exported from the broker.

Events viewed in the exporter records contain information like "_Worker THX-1138 activated 3 jobs_".

It turns out, after using the library extensively myself, and observing others use it, that this parameter is not widely used. In fact, the [Zeebe NestJS integration](https://www.npmjs.com/package/@payk/nestjs-zeebe), (written by [Dan Shapir](https://github.com/danshapir) at [Pay-K](http://www.payk.com.au/)) which integrates the Zeebe Node client with the excellent [NestJS framework](https://nestjs.com/), auto-assigns ids to the workers. The ability to assign a specific `id` for the worker is not exposed to the user.

That's not to say that it will not be used in the future. In larger systems with more worker processes than the ones currently in use, the id may well be derived from an environment variable, to allow misbehaving worker instances (including out-of-date ones) to be identified and dealt with.

But for now, requiring a worker id to create a worker is clunky.

The source of my problem here is that I violated a principle explained in Bob Martin's "[Clean Code: A Handbook of Agile Software Craftsmanship](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)":

> The ideal number of arguments for a function is zero (niladic). Next comes one (monadic), followed closely by two (dyadic). Three arguments (triadic) should be avoided where possible. More than three (polyadic) requires very special justification—and then shouldn’t be used anyway.

I initially had the `createWorker` method take four arguments. That was a _bad idea_.

I later extended it to take a fifth parameter, when I added the ability to attach an `onConnectionError` handler. Hey, "_if you find yourself going through hell, keep going_" - right?

Here is the method signature, with the Generics removed to make it clearer:

{{< gist jwulf c27afcf00891b23bdd1c0c712f26b12a >}}

The last two arguments are optional, but the worker id is _the first parameter_. Somehow, when I first wrote it, I thought it was necessary and important.

The solution to this at design time is to use the [Parameter Object](https://sourcemaking.com/refactoring/introduce-parameter-object) pattern. That way a function / method takes a single argument (next best thing to none), and it can be extended to add new parameters, and modified to make parameters optional, with no impact on existing code.

I knew the clean coding principle of one parameter. I knew about using parameter objects (see [this StackOverflow code refactor](http://joshwulf.com/blog/2020/02/providing-a-semantic-api#second-refactor) where I explain more the impact of avoiding them).

And _I did this anyway_. 

I reasoned at the time:

> I'm just banging out some prototype code here to test this out. I can always come back and refactor it later.

"There is no such thing as good coding, only good refactoring". (_That's my adaptation of [a quote by author Robert Graves](https://www.goodreads.com/quotes/9084374-there-is-no-such-thing-as-good-writing-only-good)_).

You will always have to refactor as the domain you are modelling becomes clearer, and you materialise and coalesce concerns in your code.

At the same time, _this_ is not one of those "_now I can see..._" concerns. 

I willfully violated a coding principle where I had full knowledge at the time. 

_Always_ write the best code possible _at the time you write it_ - while knowing full well that you will have to refactor it later. You are introducing enough technical debt with your keyboard with every line of clean code that you write. You can't afford to add this as well.

Most of the scratch code you write will go nowhere, and you won't experience the full impact of sloppy coding practices. It's easy to write and throw away thousands of lines of code, and go: "_What's the big deal?"

 However, the code that _does_ survive will cost you. You should write every line of code as if you have to maintain it for ten years, as a discipline.

_Aside #1_: I told someone on StackOverflow the other day: "_You should always make sure the code runs and is formatted. That will solve 35% of your problems as a professional developer_". Poorly formatted code in questions reveals poorly structured thinking. If you just take on structuring your code properly, the structure of the domain problems become soluble in many cases. 

_Aside #2_: Also, (_and I had forgotten this - obviously_) when I joined Red Hat in 2004, I wrote code patches for a version of RHEL that was going EOL, after its three-year support lifetime. Well, that day arrived, and some big financial institutions paid millions of dollars to extend its life to seven years. And when that day arrived, paid more money to extend it to 12 years. When I left Red Hat, after 10 years, the patches I wrote in my first year were still in production and being supported. There is no way you can forsee that, so just write _all_ code as if you have to maintain it for 10 years, as a discipline.

## Optional parameters 

You can make trailing parameters optional in TypeScript, but required parameters cannot follow optional ones. So there was no way to make `id` optional.

At the same time, in writing documentation for the library, it became apparent that examples showing the worker id and a task type were complicated for introducing new users to the library.

{{< gist jwulf 60f4b69f0af1bb14596d5f324c45ffc4 >}}

_Everything_ in that statement is unknown to a new user. Having to explain each element, and say "_Ignore this one_" leads to the obvious question: 

> If it should be ignored, why is it even visible?

I also found myself having to supply information to the method every time I used it that was just thrown away. 

With over 6k weekly downloads of the library from NPM, and multiple downstream packages, I can't just change the signature in a breaking way. That breaks it for a lot of people.

{{< fancybox path="/img/2020/02" file="npm-downloads.png" caption="" gallery="Zeebe Node" >}}

The problems of success.

## Making a required parameter "optional"

The first thing I did, for my own sanity, is make that first parameter - `id` - nullable. So the signature changed like this:

{{< gist jwulf 2bed7fa5f6f084fed317cd4ba6a5e731 >}}

Now you can write (and examples look like) this:

{{< gist jwulf 183b62dce9d1cfe70f05201f6599495a >}}

Marginally better. It reduces cognitive load when encountering the library for the first time, and for using it. But my original sin against clean code principles is still there for the world to see.

## Method Overloads 

In statically-compiled languages such as Java and C#, you can provide multiple method implementations with the same name but different parameter signatures. On compilation, the compiler resolves the one you mean from a combination of the method name and the parameter signature, and links the call to the correct implementation.

With TypeScript, you can provide different parameter signatures for the same method, but because all type information is erased at run-time, you have to handle the various signatures in a single implementation.

Redemption from my original sin was going to cost. The internal complexity of the implementation would go up having to deal with this design error in a fully backwards compatible way.

I held off on it, and finally bit the bullet and did it in the work for the 0.23.0-alpha.1 release, providing an alternate method signature, one that no longer requires the worker id as an argument.

Why didn't I just go all the way and move to a single parameter object? Because I'm an idiot, maybe. I wanted it to be a gradual change to avoid having to document and test two radically different signatures. Maybe that's a mistake that will pile more technical debt in.

My plan is to add the third method overload to a single parameter object in a future release, if it makes sense. The jury is still out on that. If it needs extension, that will definitely be part of that work.

This is not released yet, so there is still time for me to deliberate and go all in on the object parameter.

## Creating a method overload in TypeScript

Here is what violating the single parameter principle will cost you, if you have to maintain backwards-compatibility:

To go from this in the README:

{{< gist jwulf 183b62dce9d1cfe70f05201f6599495a >}}

To this:

{{< gist jwulf 4a3c8a3c10d3dc886b49b573a5c4e8fc >}}

While still supporting existing code that uses the previous signature, requires the method to go from this:

{{< gist jwulf 07c06339bf28d765c02ba3dcc3ac0f5d >}}

To this:

{{< gist jwulf 7c59ae624ad5a794651cb31658616d5c >}}

You have to provide both signatures as overload signatures, then define an implementation signature that is a union of all overloads. And this is with the Generic Parameterization stripped out to reduce the noise.

But wait - _there's more_!

Now you have to decode the call at run-time by examining the actual parameters that you received, and determining which signature the caller used, and which parameter is which.

That is why the implementation signature (not shown to consumers) contains parameter names like ` taskHandlerOrOptions`.

To reduce the internal complexity of the method (_that's_ about creating a worker, not decoding parameters!), and also to reduce the work required to support an eventual single object parameter, I moved the parameter decoding to a unit testable pure function:

The entire impact on the _internal_ complexity of the method is this:

{{< gist jwulf 0dfa6db868afa330f6a9035f57a5aea4 >}}

OK, I've isolated the implementation of the method from the fall-out of my momentary madness in creating that original signature.

Now I have to implement the run-time decoder:

{{< gist jwulf b348521de01517647502161b65e5b36f >}}

That's a lot of internal complexity required to go from:

{{< gist jwulf 183b62dce9d1cfe70f05201f6599495a >}}

to this (with backwards compatibility):

{{< gist jwulf 4a3c8a3c10d3dc886b49b573a5c4e8fc >}}

Going to the third signature, with a single object parameter, will be a small amount of additional code. A new signature overload, a line or two in the decoder, then changes to documentation and a test or two.

And to think:

 **All that code could have been avoided by using an object parameter for a method that takes more than one parameter**

/_makes note_.

**About me**: _I’m a Developer Advocate at [Camunda](https://camunda.com), working primarily on the [Zeebe Workflow engine for Microservices Orchestration](https://zeebe.io), and the maintainer of the [Zeebe Node.js client](https://www.npmjs.com/package/zeebe-node). In my spare time, I build [Magikcraft](https://github.com/Magikcraft), a platform for programming with JavaScript in Minecraft._
