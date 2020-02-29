+++
author = "Josh Wulf"
categories = ["javascript", "programming", "stackoverflowed"]
date = "2020-02-26"
description = "TLDR; only use variables for actual mutable state, and put them inside testable state machines."
featured = "mutant.png"
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "Shun the Mutant - the case for const"
type = "post"
+++

There are three ways you can declare and assign in JS in 2020:

```
let a = "Hello"
var b = "World"
const c = "!"
```

These are "declarations with assignment", as opposed to "declaration _without_ assignment" - which can only be done with `let` and `var`:

```
let a;
var b;
const c; // has no meaning
```

To understand the difference between `let` and `var`, you can refer to [this excellent answer on StackOverflow](https://stackoverflow.com/a/11444416/1758461).

I'm here today to make the case for `const`.

## Semantics of Mutability

When you use `var` or `let` in a declaration with assignment, by which I mean:

```
var a = "Hello"
let b = "World"
```

You are communicating to the world - by which I mean machine reasoners (like ESLint, your IDE's language service, and the JS run-time itself) and other programmers:

> I intend that the value of this assignment change over the course of execution. Do not rely on the eventual value of this assignment.

What this means for other programmers is that when they encounter this reference later in the code base, they have to go back through all the intervening code, and mentally execute it to reason about its value at that point in the code.

This is a source of complexity in comprehending and working with a code base.

For machine reasoners, their ability to detect errors related to this reference is weakened. They cannot, for example, detect an error where you mistype a variable name and assign a new value to this variable when you meant something else; or if someone reuses the variable name in an enclosed scope but forgets to declare it, like this:

{{< gist jwulf d302fde251bc273ee920fb9a96aa8c9c >}}

For runtimes, a `const` declaration can be replaced with its value inline. To do this with a `var` or `let` that is never reassigned requires an optimizer to run all possible code paths involving that reference.

I see programmers declaring assignments using `var` and `let` where the assignment does not change during the lifetime of the reference.

In this case, it is quite simple: the declaration is misstated. The programmer has miscommunicated their intent. They **do not** intend the reference value of the assignment to change over the course of execution. In this case, the term that matches their intent is `const`.

**Recommendation**: For all simple values that do not change (like a URL string), use `const`.

## Understanding Object References

One characteristic of JavaScript is that objects, including arrays, and assigned by reference.

This statement is deceptively complex:

```
var a = []
```

There are in fact _three_ distinct things going on in this one statement: declaration, assignment, and object creation.

First, a variable is declared: `var a`. 

Next, an object is created: `[]`. It is an object with its own independent existence. It occupies its own location in memory, distinct from the variable `a`, and has its own lifecycle, managed by the JS runtime Garbage Collector.

Finally, `a` is assigned the value of a reference to the array.

So `a` is a reference to a pointer, and the reference can be used to access the value that pointer points to. 

In this case, that pointer points to a newly created array, which exists somewhere else in memory.

You can validate that the created object exists independently by running the following code:

{{< gist jwulf c591a4b6ccf6715e3bc4a5478e33e5d6 >}}

When you run this code, whether in Node or a browser console, you will see that `a` first refers to an object, then refers to `undefined`.

However, the object that got created continues to exist, and keeps logging.

Although we say loosely that "_`a` is an object_", in fact `a` is a _reference_ to an object that exists independently.

When a novice programmer creates a statement like `var a = []`, they may reason: "_I want to mutate that array, so I need to declare it as `var`, so that it is mutable._"

What gets created here, however, is not a mutable array and a reference to it `a`, but rather a mutable array and a _mutable reference_ to it.

In our logging object example above, we changed the reference `a` to `undefined`, and lost the reference to the object.

If you declare `a` as a `const` you do not make the object immutable, you make the reference immutable.

So in most cases, use `const` for object references as well. For the same reasons as value references: safety, code comprehensibility for humans and machine reasoners, and optimization (_that last one is low on the list, but I include it for completeness. Your code runs slow for many other reasons_).

## The case against mutation

I am going to expand my case against `var` and `let`. Thus far, I have simply argued for correctly expressing the intended mutability of a reference / value by declaring something as `const` when the referee is not intended to change during the course of execution. 

That is simply accurately expressing programmer intent in the syntax, and is non-controversial. Just accurately declare it.

Now, I am going to make a further case: _that using actual mutable references (and mutating them) increases code complexity_.

I think that in many cases that the number of actual variables in most code will be significantly reduced by simply declaring them as what they are: references whose referee does not change over the course of execution (ie: `const`).

What remains after this "rectification of names" are references whose value changes over the course of execution (actual variables).

Common use-cases include:

* Assigning a new string through concatenation with the previous value: eg. `name = 'Ms' + name`
* Assigning a new number through an operation on the previous value: eg. `count -= 1`
* Assigning a new object reference. eg: `members = [...members, ...newMember]`

All of these are actual reference mutations that require the use of `let` or `var`.

Note that `members.push(newMember)` mutates the contents of the referenced array, and thus `members` itself can be declared as `const`. I'm not advocating using `Array.push`, and will deal with it further on.

All of these mutable references create code that is complex to reason about, and can lead to couplings that are hard to test, because they represent state.

Once all the faux variables have been renamed to `const`, a variable that is mutated inside a function usually indicates the presence of a custom state machine. Sometimes a custom state machine is necessary, but less often than you would think.

<a name="valid-use-of-variables"></a>
## Valid use of variables 

Valid uses for a variable can be to represent internal state, for example:

{{< gist jwulf 269745c95b98c0308b95c472066c24c0 >}}

In this example, we need a variable to represent the connected status of our `GRPCConnection`. It is _literally_ its state, and we have no other way to represent it (we assume here that the object returned by `gRPC()` does not capture and expose it).

This is the correct use of a variable. It represents (models) some _real mutable state_ in the system - rather than creating mutable state where none exists.

However, externally, we do not expose state. We return a `const` value that _represents the state of the connection at a point in time_. That doesn't change. It is an immutable statement.

State machines require rigorous testing to be reliable.

This custom state machine is hard to test. It has a hard dependency on `gRPC`, which provokes the state transitions.

To make this state machine testable, we would want to inject the `gRPC` implementation like this:

{{< gist jwulf d10859a9b3daa30ed13e8bdc11272533 >}}

This one simple change means that instead of directly referring to the `gRPC` implementation, our custom state machine can have one injected, so we can now create a mock `gRPC()` to exercise it in automated tests.

There are many reliable state machines that encapsulate mutation available to the JS programmer, particularly in the `Array` methods, such as `filter`, `map`, and `reduce`. Most transformations can be accomplished using these.

In cases where you do, genuinely, need to use a variable, it should be inside a testable state machine, not inline in function code.

## Application State 

"_What about the application state?_" I hear you say. 

Mostly your code has no interest in "application state". Most of your code is interested in the _value_ of the application state at a point in time (like _now_), and in being notified when a change occurs in the application state. _Both_ of these are constants.

This brings us back to `Array.push`. Your code probably wants to update the application state. I recommend putting that code inside a state machine and encapsulating mutation there, behind a singularity, in a testable black box. And from that black box return immutable values that represent the state. See the article "[Avoiding Global Mutable State in Browser JS](https://www.joshwulf.com/blog/2020/02/avoid-global-state/)" for a demonstration of how to accomplish this.

Outside of actual state machines, there is no need to use variables.

If you find yourself using a variable, take another look. 

Are you building an actual state machine? 

If no, then use `const`. 

If yes, first check to see if a well-tested, existing state machine, like an [Array method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array), can do what you want to achieve.

If not, then refactor the code to put your state machine in its own isolated context, with no side-ways dependencies, so you can test the _operation of the state machine itself_.

The complexity of your code will go down, and its reasonableness, for humans and machines, will go up.

**About me**: _I’m a Developer Advocate at [Camunda](https://camunda.com), working primarily on the [Zeebe Workflow engine for Microservices Orchestration](https://zeebe.io), and the maintainer of the [Zeebe Node.js client](https://www.npmjs.com/package/zeebe-node). In my spare time, I build [Magikcraft](https://github.com/Magikcraft), a platform for programming with JavaScript in Minecraft._


