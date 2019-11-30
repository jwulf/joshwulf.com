+++
author = "Josh Wulf"
categories = ["javascript", "programming"]
date = "2017-04-15"
description = "On a standard 101-key keyboard, there are 100 keys that increase technical debt, and only one key that reduces it."
featured = ""
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "There is no good coding, only good refactoring"
type = "post"

+++

> On a standard 101-key keyboard, there are 100 keys that increase technical debt, and only one key that reduces it.

When you write code you produce functionality and technical debt. Refactoring code is the process of reducing technical debt while preserving functionality.

Yesterday, I spent the afternoon refactoring a method in one of the Magikcraft components.

I refactored it three or four times, extracting and consolidating pieces of logic. Each time I refactored, the essential logic became clearer.

## Before

I started with this:

{{< fancybox path="/img/2017/04" file="before.png" caption="Before" gallery="Gallery Name" >}}

This has a number of problems.

### Duplication

You can see the file path `${config.PLAYERSPATH}/${this.minecraftUsername}/spells/${file.name}.js` in lines 7, 24, and 36.

What happens when we make a change to the file structure? We then have to find and change it in three places. 

Subtle differences in the each of those lines can lead to unpredictable behaviour and hard to track down bugs.

This is the opposite of DRY (Do not Repeat Yourself) code — it’s WET (We Enjoy Typing).

### Comments

Comments are a code smell. If you have to comment something, it often means you have not named it clearly, or you need to extract it into its own named function

### Mutation

The variables `added`, `changed`, and `removed` are all mutated in the method. Mutation makes code harder to reason about. It’s how the code is actually executed on the processor — imperatively as a set of sequential steps that operate on values in accumulators and registers — but I find that refactoring mutation (variables) out of code is often a pathway to discovering its true essence, as is removing `if-then-else` statements.

### Side-inputs

The method takes no parameters, but it does operate on state from outside the method. This input magically appears via the side-inputs `this.files` and `this.prevFiles`. This code was implemented as a TypeScript class, and classes frequently use internal state. However, while a class encapsulates state from the rest of the system, writing methods that operate on the state of the class instance obscures what is going on in the class method itself.

### Side-effects

This method has side-effects by nature — it’s an I/O method that writes to the filesystem, so its outputs are not via return value, by via writing to the filesystem, and sending a message to the user in Minecraft.

This makes it difficult to test.

## First Refactor

{{< fancybox path="/img/2017/04" file="first-refactor.png" caption="First refactor" gallery="Gallery Name" >}}

### Explicit Input

I’ve made the input explicit. The method now takes previousFiles and files as input parameters.

### DRY Configuration

I’ve consolidated the file path into line 2. Now it gets set in a single place, so no hard-to-trace, subtle differing behaviour bugs, and a single place to refactor.

### Shun The Mutant

Rather than mutating variables for the counting how many files were added, changed, or removed, I spent the time to write them as functional pipelines, and extract the logic of those functions out into named lambda functions. The essential logic of each is now explicit and clear.

### Side-Effects

File writing is still a side-effect, and it is done inside the `.map` of each of the functional pipelines. Those took some thinking about, because I wanted to consolidate the logic as much as possible, and we’re doing two things (and in the case of remove, three) — doing a side-effect, and counting (and in the case of remove, doing a comparison based on an intermediate computation). I got them consolidated down, but now we can’t test this method easily because it writes to the filesystem and also tries to communicate with a running Minecraft server.

### Testability

Writing a unit test for this will be complicated. However, unit tests are vital. There is no good code — only good refactoring. It takes several “edits” to the code for its essential structure to emerge: for the dimly grasped ideas to be coalesced into concrete, concise implementations that are clearly grasped, and easily extended or modified; to take code that runs, and turn it into code that clearly and boldly states what it does, and does it well.

To do that kind of refactoring, you need unit tests to know that everything still does what it is meant to do. When you write code, you create functionality and technical debt. When you refactor, you reduce technical debt, and you (obviously) want to preserve functionality.

I have two routes I can go down here to handle side-effects and testing: dependency injection, or a clean separation of concerns between logic and I/O. We’ll look at both.

### Dependency Injection

Using the approach of dependency injection to isolate my function from side-effects at the time of testing looks like this:

{{< fancybox path="/img/2017/04" file="di.png" caption="Using Dependency Injection" gallery="Gallery Name" >}}

Here I have extended the function signature with a second, optional object that contains the dependencies. Under normal operation, this second parameter can be ignored, and it will use the same code it was using before.

However, in a unit test, mock file write and remove methods, and a sendMessageToPlayer method can be injected, and it can be tested without a file system or a Minecraft server, and the outputs observed.

It still has some issues: the injected method names shadow the class method names, which can lead to hard to spot bugs. Also, the unit tests would be more complicated to write as they require I/O mocks, and as Eric Elliot points out — [mocking is a code smell](https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a).

### Separation of Concerns

Another way is to separate the concerns of logic and I/O into distinct functions. In that case, I make the function return an explicit value — the list of files to add, modify, or remove. I then do the actual side-effects of file writing and communication in the calling method. Then I can test the input and output of the logic function, as it has become a referentially transparent, pure function.

Here it is with the essential logic refactored into a referentially-transparent, side-effect-free method, and all side-effects isolated in another function:

{{< fancybox path="/img/2017/04" file="pure.png" caption="Separate out I/O" gallery="Gallery Name" >}}

The method `computeFilesToWrite` now contains the logic in a pure function — explict inputs via files and previousFiles (with default values to guard against an exception if we tried to filter undefined), and explicit outputs via the return value.

This we can unit test easily.

Side-effects occur in the `writeFilesToFileSystem` method. This is the right separation of concerns. Logic and I/O should be separated.

## There is no good coding, only good refactoring

Both of the following pieces of code do the same thing, but one is superior in its clarity, testability, and maintainability.

## Before

{{< fancybox path="/img/2017/04" file="before.png" caption="Before" gallery="Gallery Name" >}}

## After 

{{< fancybox path="/img/2017/04" file="pure.png" caption="Separate out I/O" gallery="Gallery Name" >}}

## Update 

While writing unit tests, I discovered that my ternary string builder doesn’t work. Here’s the working code:

{{< fancybox path="/img/2017/04" file="update.png" caption="Working implementation" gallery="Gallery Name" >}}
